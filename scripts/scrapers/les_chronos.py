"""
Scraper Les-Chronos.com — plateforme française de chronométrage sportif.
URL : https://www.les-chronos.com/calendar?discipline=triathlon

Bonne source complémentaire pour les courses régionales moins connues.
"""
import re
import time
import requests
from datetime import date
from typing import Optional
from bs4 import BeautifulSoup

import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from utils import make_slug, normalize_category, clean_str, DEFAULT_HEADERS


BASE_URL = "https://www.les-chronos.com"
CALENDAR_URL = f"{BASE_URL}/calendar"


def scrape(year: Optional[int] = None) -> list[dict]:
    """
    Scrape le calendrier triathlon de Les-Chronos pour l'année donnée.
    """
    year = year or date.today().year
    print(f"[LES-CHRONOS] Scraping calendrier {year}...")

    races = []
    try:
        races = _scrape_html(year)
        print(f"[LES-CHRONOS] {len(races)} courses trouvées")
    except Exception as e:
        print(f"[LES-CHRONOS] Erreur : {e}")

    return races


def _scrape_html(year: int) -> list[dict]:
    """Scrape la page calendrier de Les-Chronos."""
    params = {
        "discipline": "triathlon",
        "year": year,
        "country": "fr",
    }

    resp = requests.get(CALENDAR_URL, params=params, headers=DEFAULT_HEADERS, timeout=20)
    resp.raise_for_status()

    soup = BeautifulSoup(resp.text, "lxml")
    races = []

    # Chercher les events dans différentes structures possibles
    # Les-Chronos utilise généralement un tableau ou des cards
    rows = soup.select(
        "table.events tbody tr, "
        ".event-item, .race-item, "
        "[data-race], [data-event], "
        ".calendar-event"
    )

    if not rows:
        # Fallback : chercher tous les liens vers des événements
        rows = soup.select("a[href*='/events/'], a[href*='/races/'], a[href*='/competition']")

    for row in rows:
        try:
            race = _parse_row(row, year)
            if race:
                races.append(race)
        except Exception as e:
            print(f"  [LES-CHRONOS] Erreur ligne : {e}")
            continue
        time.sleep(0.03)

    return races


def _parse_row(el, year: int) -> Optional[dict]:
    """Parse un élément de la liste d'events."""

    # Selon la structure HTML (tableau ou card)
    if el.name == "tr":
        cells = el.find_all("td")
        if len(cells) < 3:
            return None

        raw_date = clean_str(cells[0].get_text())
        name = clean_str(cells[1].get_text())
        city = clean_str(cells[2].get_text()) if len(cells) > 2 else None
        raw_cat = clean_str(cells[3].get_text()) if len(cells) > 3 else "M"

        link = el.find("a")
        href = link["href"] if link and link.get("href") else None
    else:
        # Card ou autre élément
        name_el = el.select_one("h2, h3, .name, .event-name, .title")
        city_el = el.select_one(".city, .location, .lieu")
        date_el = el.select_one(".date, time, .event-date")
        cat_el = el.select_one(".category, .type, .distance")

        name = clean_str(name_el.get_text()) if name_el else clean_str(el.get_text()[:60])
        city = clean_str(city_el.get_text()) if city_el else None
        raw_date = clean_str(date_el.get_text()) if date_el else None
        raw_cat = clean_str(cat_el.get_text()) if cat_el else "M"

        href = el.get("href") or (el.find("a") or {}).get("href")

    if not name or not city:
        return None

    # Construction URL complète
    race_url = None
    if href:
        race_url = href if href.startswith("http") else f"{BASE_URL}{href}"

    return {
        "slug": make_slug(name, city, year),
        "name": name,
        "date": _parse_date(raw_date, year),
        "city": city,
        "country": "France",
        "discipline": "triathlon",
        "category": normalize_category(raw_cat or "M"),
        "location": f"{city}, France",
        "website_url": race_url,
    }


def _parse_date(raw: Optional[str], year: int) -> Optional[str]:
    if not raw:
        return None

    MONTHS_FR = {
        "janvier": 1, "février": 2, "mars": 3, "avril": 4,
        "mai": 5, "juin": 6, "juillet": 7, "août": 8,
        "septembre": 9, "octobre": 10, "novembre": 11, "décembre": 12,
        "jan": 1, "fév": 2, "fev": 2, "mar": 3, "avr": 4, "jun": 6,
        "juil": 7, "jul": 7, "aoû": 8, "aou": 8, "sep": 9,
        "oct": 10, "nov": 11, "déc": 12, "dec": 12,
    }

    raw = raw.strip()

    # ISO
    m = re.search(r"(\d{4}-\d{2}-\d{2})", raw)
    if m:
        return m.group(1)

    # JJ/MM/AAAA
    m = re.search(r"(\d{1,2})[/\-](\d{1,2})[/\-](\d{4})", raw)
    if m:
        return f"{m.group(3)}-{m.group(2).zfill(2)}-{m.group(1).zfill(2)}"

    # "15 juin 2026"
    m = re.search(r"(\d{1,2})\s+(\w+)\s+(\d{4})", raw.lower())
    if m:
        month = MONTHS_FR.get(m.group(2))
        if month:
            return f"{m.group(3)}-{str(month).zfill(2)}-{m.group(1).zfill(2)}"

    # "15 juin" (sans année)
    m = re.search(r"(\d{1,2})\s+(\w+)", raw.lower())
    if m:
        month = MONTHS_FR.get(m.group(2))
        if month:
            return f"{year}-{str(month).zfill(2)}-{m.group(1).zfill(2)}"

    return None
