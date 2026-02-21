"""
Scraper FFTRI — Fédération Française de Triathlon
Source : https://fftri.t2area.com/calendrier.html

Structure découverte :
- Events : <a class="blocEvent"> avec .nomEvent, .lieuEvent, .jourEvent, .moisEvent
- Pagination infinite-scroll : ?layout=new&limitstart=N (par 10)
- Filtre triathlon disponible en GET param
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

BASE_URL = "https://fftri.t2area.com"
CALENDAR_URL = f"{BASE_URL}/calendrier.html"

MOIS_MAP = {
    "jan.": 1, "janv.": 1, "fév.": 2, "fevr.": 2, "mars": 3, "avr.": 4,
    "mai": 5, "juin": 6, "juil.": 7, "août": 8, "sep.": 9, "sept.": 9,
    "oct.": 10, "nov.": 11, "déc.": 12, "dec.": 12,
}

DEPT_TO_REGION = {
    "01": "Auvergne-Rhône-Alpes", "02": "Hauts-de-France", "03": "Auvergne-Rhône-Alpes",
    "04": "Provence-Alpes-Côte d'Azur", "05": "Provence-Alpes-Côte d'Azur",
    "06": "Provence-Alpes-Côte d'Azur", "07": "Auvergne-Rhône-Alpes",
    "08": "Grand Est", "09": "Occitanie", "10": "Grand Est",
    "11": "Occitanie", "12": "Occitanie", "13": "Provence-Alpes-Côte d'Azur",
    "14": "Normandie", "15": "Auvergne-Rhône-Alpes", "16": "Nouvelle-Aquitaine",
    "17": "Nouvelle-Aquitaine", "18": "Centre-Val de Loire", "19": "Nouvelle-Aquitaine",
    "21": "Bourgogne-Franche-Comté", "22": "Bretagne", "23": "Nouvelle-Aquitaine",
    "24": "Nouvelle-Aquitaine", "25": "Bourgogne-Franche-Comté", "26": "Auvergne-Rhône-Alpes",
    "27": "Normandie", "28": "Centre-Val de Loire", "29": "Bretagne",
    "30": "Occitanie", "31": "Occitanie", "32": "Occitanie",
    "33": "Nouvelle-Aquitaine", "34": "Occitanie", "35": "Bretagne",
    "36": "Centre-Val de Loire", "37": "Centre-Val de Loire", "38": "Auvergne-Rhône-Alpes",
    "39": "Bourgogne-Franche-Comté", "40": "Nouvelle-Aquitaine", "41": "Centre-Val de Loire",
    "42": "Auvergne-Rhône-Alpes", "43": "Auvergne-Rhône-Alpes", "44": "Pays de la Loire",
    "45": "Centre-Val de Loire", "46": "Occitanie", "47": "Nouvelle-Aquitaine",
    "48": "Occitanie", "49": "Pays de la Loire", "50": "Normandie",
    "51": "Grand Est", "52": "Grand Est", "53": "Pays de la Loire",
    "54": "Grand Est", "55": "Grand Est", "56": "Bretagne",
    "57": "Grand Est", "58": "Bourgogne-Franche-Comté", "59": "Hauts-de-France",
    "60": "Hauts-de-France", "61": "Normandie", "62": "Hauts-de-France",
    "63": "Auvergne-Rhône-Alpes", "64": "Nouvelle-Aquitaine", "65": "Occitanie",
    "66": "Occitanie", "67": "Grand Est", "68": "Grand Est",
    "69": "Auvergne-Rhône-Alpes", "70": "Bourgogne-Franche-Comté", "71": "Bourgogne-Franche-Comté",
    "72": "Pays de la Loire", "73": "Auvergne-Rhône-Alpes", "74": "Auvergne-Rhône-Alpes",
    "75": "Île-de-France", "76": "Normandie", "77": "Île-de-France",
    "78": "Île-de-France", "79": "Nouvelle-Aquitaine", "80": "Hauts-de-France",
    "81": "Occitanie", "82": "Occitanie", "83": "Provence-Alpes-Côte d'Azur",
    "84": "Provence-Alpes-Côte d'Azur", "85": "Pays de la Loire", "86": "Nouvelle-Aquitaine",
    "87": "Nouvelle-Aquitaine", "88": "Grand Est", "89": "Bourgogne-Franche-Comté",
    "90": "Bourgogne-Franche-Comté", "91": "Île-de-France", "92": "Île-de-France",
    "93": "Île-de-France", "94": "Île-de-France", "95": "Île-de-France",
    "971": "Guadeloupe", "972": "Martinique", "973": "Guyane",
    "974": "La Réunion", "976": "Mayotte",
}

# Disciplines à inclure (pas duathlon, bike&run, etc.)
DISCIPLINES_TRIATHLON = {"TRI", "TRL", "AQUA", "AQUA+", "S&B"}

# Correspondance discipline FFTRI → catégorie interne
DISCIPLINE_TO_CAT = {
    "TRI": None,    # catégorie déterminée par les badges de distance
    "TRL": "XL",   # Triathlon Longue Distance
    "AQUA": None,
    "S&B": None,
}


def scrape(year: Optional[int] = None) -> list[dict]:
    year = year or date.today().year
    print(f"[FFTRI] Scraping calendrier {year}...")

    all_events = []
    offset = 0
    page_size = 10

    while True:
        url = CALENDAR_URL
        params = {"layout": "new", "limitstart": offset} if offset > 0 else {}
        # Sur la première page, pas de layout=new
        if offset == 0:
            resp = requests.get(url, headers=DEFAULT_HEADERS, timeout=20)
        else:
            resp = requests.get(url, params=params, headers=DEFAULT_HEADERS, timeout=20)

        resp.raise_for_status()
        soup = BeautifulSoup(resp.text, "lxml")
        events = soup.select("a.blocEvent")

        if not events:
            break

        for ev in events:
            race = _parse_event(ev, year)
            if race:
                all_events.append(race)

        print(f"  Page offset={offset} : {len(events)} events")

        # Si on a moins d'une page complète, on a tout
        if len(events) < page_size:
            break

        offset += page_size
        time.sleep(0.5)

        # Sécurité : max 200 pages (2000 events)
        if offset > 2000:
            break

    # Filtrer par année si date disponible
    year_str = str(year)
    filtered = [r for r in all_events if not r.get("date") or year_str in (r.get("date") or "")]
    print(f"[FFTRI] {len(filtered)} courses triathlon {year} trouvées")
    return filtered


def _parse_event(ev, year: int) -> Optional[dict]:
    """Parse un élément <a class='blocEvent'>."""
    href = ev.get("href", "")
    if not href:
        return None

    # Nom
    nom_el = ev.select_one(".nomEvent")
    name = clean_str(nom_el.get_text()) if nom_el else None
    if not name:
        return None

    # Nettoyer le département du nom : "Aquathlon d'Annonay (07)" → "Aquathlon d'Annonay"
    dept_in_name = re.search(r"\s*\(\d{2,3}\)\s*$", name)
    dept_code = dept_in_name.group().strip("() ") if dept_in_name else None
    name_clean = name[:dept_in_name.start()].strip() if dept_in_name else name

    # Lieu : "07100 ANNONAY" → CP + ville
    lieu_el = ev.select_one(".lieuEvent")
    lieu_raw = clean_str(lieu_el.get_text()) if lieu_el else ""
    city, postal = _parse_lieu(lieu_raw)

    if not dept_code and postal:
        dept_code = postal[:2] if len(postal) >= 2 else None

    region = DEPT_TO_REGION.get(dept_code[:2] if dept_code else "", None)

    # Date : jour + mois abbr (sans année → on l'infère)
    jour_el = ev.select_one(".jourEvent")
    mois_el = ev.select_one(".moisEvent")
    day = clean_str(jour_el.get_text()) if jour_el else None
    mois = clean_str(mois_el.get_text()) if mois_el else None
    event_date = _build_date(day, mois, year)

    # Catégorie : chercher les badges de disciplines
    badges = [b.get_text().strip() for b in ev.select(".libelleDisc, [class*='disc'], [class*='badge']") if b.get_text().strip()]
    category = _infer_category(badges, name_clean)

    return {
        "slug": make_slug(name_clean, city or "", year),
        "name": name_clean,
        "date": event_date,
        "city": city or lieu_raw,
        "department": dept_code,
        "region": region,
        "country": "France",
        "discipline": "triathlon",
        "category": category,
        "location": f"{city or lieu_raw}, France",
        "website_url": href if href.startswith("http") else f"{BASE_URL}{href}",
    }


def _parse_lieu(lieu: str) -> tuple[Optional[str], Optional[str]]:
    """'07100 ANNONAY' → ('Annonay', '07100')"""
    if not lieu:
        return None, None
    m = re.match(r"(\d{5})\s+(.+)", lieu.strip())
    if m:
        postal = m.group(1)
        city = m.group(2).strip().title()
        return city, postal
    return lieu.strip().title() or None, None


def _build_date(day: Optional[str], mois: Optional[str], year: int) -> Optional[str]:
    if not day or not mois:
        return None
    mois_num = MOIS_MAP.get(mois.lower().strip())
    if not mois_num:
        return None
    try:
        day_int = int(re.sub(r"\D", "", day))
        return f"{year}-{str(mois_num).zfill(2)}-{str(day_int).zfill(2)}"
    except (ValueError, TypeError):
        return None


def _infer_category(badges: list[str], name: str) -> str:
    """Infère la catégorie depuis les badges ou le nom."""
    name_lower = name.lower()

    if "ironman" in name_lower:
        return "Ironman"
    if "70.3" in name_lower:
        return "70.3"
    if "longue" in name_lower or "ld" in name_lower or "xl" in name_lower:
        return "XL"
    if "half" in name_lower:
        return "70.3"
    if "olympique" in name_lower or "olympic" in name_lower:
        return "M"
    if "sprint" in name_lower:
        return "S"
    if "super sprint" in name_lower or "xs" in name_lower:
        return "XS"

    # Chercher XL, L, M, S dans les badges
    for b in badges:
        b_upper = b.upper()
        if b_upper in ["XL", "IRONMAN", "IML"]:
            return "Ironman"
        if b_upper in ["L", "70.3", "HIM"]:
            return "70.3"
        if b_upper in ["M", "OLY"]:
            return "M"
        if b_upper in ["S", "SPR"]:
            return "S"
        if b_upper in ["XS", "SS"]:
            return "XS"

    return "M"  # Olympique par défaut
