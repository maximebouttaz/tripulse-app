"""
Scraper Finishers.fr — calendrier et résultats triathlon France.
URL : https://www.finishers.com/fr/competitions/?discipline=triathlon

Finishers expose une API JSON paginée très pratique.
"""
import time
import requests
from datetime import date
from typing import Optional

import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from utils import make_slug, normalize_category, clean_str, DEFAULT_HEADERS


# API Finishers (endpoint découvert via les DevTools)
FINISHERS_API = "https://www.finishers.com/fr/api/competitions"

FINISHERS_PARAMS = {
    "discipline": "triathlon",
    "country": "fr",
    "page": 1,
    "per_page": 100,
    "order": "date",
}


def scrape(year: Optional[int] = None) -> list[dict]:
    """
    Récupère toutes les courses triathlon France depuis Finishers.
    """
    year = year or date.today().year
    print(f"[FINISHERS] Scraping calendrier triathlon France {year}...")

    races = []
    try:
        races = _fetch_all_pages(year)
        print(f"[FINISHERS] {len(races)} courses trouvées")
    except Exception as e:
        print(f"[FINISHERS] Erreur API ({e}), passage HTML...")
        try:
            races = _scrape_html(year)
            print(f"[FINISHERS] {len(races)} courses via HTML")
        except Exception as e2:
            print(f"[FINISHERS] Erreur HTML : {e2}")

    return races


def _fetch_all_pages(year: int) -> list[dict]:
    """Parcourt toutes les pages de l'API Finishers."""
    races = []
    page = 1

    headers = {
        **DEFAULT_HEADERS,
        "Accept": "application/json",
        "Referer": "https://www.finishers.com/fr/competitions/",
    }

    while True:
        params = {**FINISHERS_PARAMS, "page": page, "year": year}
        resp = requests.get(FINISHERS_API, params=params, headers=headers, timeout=20)

        if resp.status_code == 404:
            break
        resp.raise_for_status()

        data = resp.json()
        items = data if isinstance(data, list) else data.get("competitions", data.get("data", []))

        if not items:
            break

        for item in items:
            race = _parse_item(item, year)
            if race:
                races.append(race)

        # Pagination
        total_pages = data.get("total_pages", data.get("pages", 1)) if isinstance(data, dict) else 1
        if page >= total_pages:
            break

        page += 1
        time.sleep(0.5)  # Respecter le serveur

    return races


def _parse_item(item: dict, year: int) -> Optional[dict]:
    """Parse un item de l'API Finishers."""
    name = clean_str(item.get("name", item.get("nom", item.get("title", ""))))
    city = clean_str(item.get("city", item.get("ville", item.get("location", ""))))

    if not name or not city:
        return None

    raw_cat = item.get("category", item.get("categorie", item.get("distance", "M")))
    finishers_slug = item.get("slug", item.get("id", ""))
    finishers_url = f"https://www.finishers.com/fr/competitions/{finishers_slug}" if finishers_slug else None

    # Distances (Finishers peut les donner en km ou en m)
    swim = _parse_distance(item.get("swim_distance", item.get("natation")))
    bike = _parse_distance(item.get("bike_distance", item.get("velo", item.get("cyclisme"))))
    run = _parse_distance(item.get("run_distance", item.get("cap", item.get("course_a_pied"))))

    # Prix
    price = None
    price_raw = item.get("price", item.get("prix", item.get("registration_fee")))
    if price_raw:
        try:
            price = int(float(str(price_raw)))
        except (ValueError, TypeError):
            pass

    # Coordonnées
    lat = item.get("lat", item.get("latitude"))
    lon = item.get("lng", item.get("lon", item.get("longitude")))

    return {
        "slug": make_slug(name, city, year),
        "name": name,
        "date": _parse_date(item.get("date", item.get("event_date", item.get("start_date")))),
        "city": city,
        "department": clean_str(item.get("department", item.get("departement"))),
        "region": clean_str(item.get("region")),
        "country": "France",
        "discipline": "triathlon",
        "category": normalize_category(str(raw_cat or "M")),
        "location": f"{city}, France",
        "swim_distance": swim,
        "bike_distance": bike,
        "run_distance": run,
        "latitude": float(lat) if lat else None,
        "longitude": float(lon) if lon else None,
        "price_euros": price,
        "max_participants": item.get("max_participants", item.get("capacity")),
        "website_url": clean_str(item.get("website", item.get("url_site"))),
        "finishers_url": finishers_url,
        "tagline": clean_str(item.get("tagline", item.get("description_courte"))),
        "description": clean_str(item.get("description")),
        "tags": item.get("tags"),
    }


def _scrape_html(year: int) -> list[dict]:
    """Fallback HTML pour Finishers."""
    from bs4 import BeautifulSoup

    url = f"https://www.finishers.com/fr/competitions/?discipline=triathlon&year={year}"
    resp = requests.get(url, headers=DEFAULT_HEADERS, timeout=25)
    resp.raise_for_status()

    soup = BeautifulSoup(resp.text, "lxml")
    races = []

    # Cards de compétitions sur Finishers
    cards = soup.select(".competition-card, .event-card, .race-card, [data-competition]")

    for card in cards:
        try:
            name_el = card.select_one("h2, h3, .competition-name, .race-name")
            city_el = card.select_one(".city, .location, .competition-city")
            date_el = card.select_one(".date, time, .competition-date")
            cat_el = card.select_one(".category, .distance, .type")

            name = clean_str(name_el.get_text()) if name_el else None
            city = clean_str(city_el.get_text()) if city_el else None

            if not name or not city:
                continue

            link = card.find("a")
            href = link["href"] if link and link.get("href") else None
            finishers_url = f"https://www.finishers.com{href}" if href and href.startswith("/") else href

            races.append({
                "slug": make_slug(name, city, year),
                "name": name,
                "date": _parse_date(date_el.get_text() if date_el else None),
                "city": city,
                "country": "France",
                "discipline": "triathlon",
                "category": normalize_category(clean_str(cat_el.get_text()) if cat_el else "M"),
                "location": f"{city}, France",
                "finishers_url": finishers_url,
            })
        except Exception:
            continue

    return races


def _parse_distance(raw) -> Optional[int]:
    if raw is None:
        return None
    try:
        val = float(str(raw).replace(",", "."))
        return int(val * 1000) if val < 500 else int(val)
    except (ValueError, TypeError):
        return None


def _parse_date(raw) -> Optional[str]:
    import re
    if not raw:
        return None
    raw = str(raw).strip()
    m = re.search(r"(\d{4}-\d{2}-\d{2})", raw)
    if m:
        return m.group(1)
    m = re.search(r"(\d{1,2})[/\-](\d{1,2})[/\-](\d{4})", raw)
    if m:
        return f"{m.group(3)}-{m.group(2).zfill(2)}-{m.group(1).zfill(2)}"
    return None
