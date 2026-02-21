"""
Scraper Ironman.com — courses Ironman et 70.3 en Europe.
URL : https://www.ironman.com/races

Le site Ironman utilise une API interne REST pour charger les events.
On interroge directement cette API pour éviter le rendu JS côté client.
"""
import time
import requests
from datetime import date
from typing import Optional

import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from utils import make_slug, clean_str, DEFAULT_HEADERS


# API interne Ironman (reverse-engineered depuis le réseau du navigateur)
# Filtre : région Europe, toutes les distances Ironman/70.3
IRONMAN_API = "https://www.ironman.com/api/events/search"

IRONMAN_PARAMS = {
    "take": 200,
    "skip": 0,
    "region": "europe",
    "sortOrder": "asc",
}

# Mapping catégories Ironman → format interne
IRONMAN_CATEGORY_MAP = {
    "ironman": "Ironman",
    "ironman 70.3": "70.3",
    "5i50": "M",
    "5150": "M",
}

# Pays européens qu'on garde
EUROPE_COUNTRIES = {
    "France", "Germany", "Spain", "Italy", "Switzerland", "Austria",
    "Belgium", "Netherlands", "Portugal", "United Kingdom", "Ireland",
    "Sweden", "Norway", "Denmark", "Finland", "Poland", "Czech Republic",
    "Hungary", "Croatia", "Slovenia", "Slovakia", "Estonia", "Latvia",
    "Lithuania", "Luxembourg", "Monaco", "Greece", "Turkey", "Malta",
    "Iceland", "Andorra",
}

COUNTRY_FR: dict[str, str] = {
    "Germany": "Allemagne", "Spain": "Espagne", "Italy": "Italie",
    "Switzerland": "Suisse", "Austria": "Autriche", "Belgium": "Belgique",
    "Netherlands": "Pays-Bas", "Portugal": "Portugal",
    "United Kingdom": "Royaume-Uni", "Ireland": "Irlande",
    "Sweden": "Suède", "Norway": "Norvège", "Denmark": "Danemark",
    "Finland": "Finlande", "Poland": "Pologne", "Czech Republic": "République Tchèque",
    "Greece": "Grèce", "Croatia": "Croatie",
}


def scrape(year: Optional[int] = None) -> list[dict]:
    """
    Récupère les courses Ironman/70.3 en Europe pour l'année donnée.
    """
    year = year or date.today().year
    print(f"[IRONMAN] Scraping courses Europe {year}...")

    races = []

    try:
        races = _fetch_api(year)
        print(f"[IRONMAN] {len(races)} courses trouvées")
    except Exception as e:
        print(f"[IRONMAN] Erreur API ({e}), tentative scraping HTML...")
        try:
            races = _scrape_html(year)
            print(f"[IRONMAN] {len(races)} courses trouvées via HTML")
        except Exception as e2:
            print(f"[IRONMAN] Erreur HTML : {e2}")

    return races


def _fetch_api(year: int) -> list[dict]:
    """Interroge l'API REST interne d'Ironman."""
    params = {**IRONMAN_PARAMS, "year": year}
    headers = {
        **DEFAULT_HEADERS,
        "Accept": "application/json",
        "Referer": "https://www.ironman.com/races",
        "X-Requested-With": "XMLHttpRequest",
    }

    resp = requests.get(IRONMAN_API, params=params, headers=headers, timeout=20)
    resp.raise_for_status()
    data = resp.json()

    events = data if isinstance(data, list) else data.get("events", data.get("data", []))
    races = []

    for e in events:
        race = _parse_api_event(e, year)
        if race:
            races.append(race)

    return races


def _parse_api_event(e: dict, year: int) -> Optional[dict]:
    """Parse un event de l'API Ironman."""
    country_en = clean_str(e.get("country", e.get("countryName", ""))) or ""

    # Filtrer sur l'Europe uniquement
    if country_en and country_en not in EUROPE_COUNTRIES:
        return None

    country = "France" if country_en == "France" else COUNTRY_FR.get(country_en, country_en)
    city = clean_str(e.get("city", e.get("location", ""))) or ""
    name = clean_str(e.get("name", e.get("eventName", e.get("title", "")))) or ""

    if not name:
        return None

    # Catégorie
    event_type = (e.get("eventType", e.get("type", "")) or "").lower()
    category = IRONMAN_CATEGORY_MAP.get(event_type, "Ironman")

    # Distances (en mètres)
    swim = _parse_ironman_distance(e.get("swimDistance", e.get("swim")), "swim")
    bike = _parse_ironman_distance(e.get("bikeDistance", e.get("bike")), "bike")
    run = _parse_ironman_distance(e.get("runDistance", e.get("run")), "run")

    # Prix
    price = None
    price_raw = e.get("registrationFee", e.get("price", e.get("fee")))
    if price_raw:
        try:
            price = int(float(str(price_raw).replace(",", ".")))
        except ValueError:
            pass

    # Coordonnées
    lat = e.get("latitude", e.get("lat"))
    lon = e.get("longitude", e.get("lng", e.get("lon")))

    # Max participants
    max_p = e.get("maxParticipants", e.get("capacity"))
    if max_p:
        try:
            max_p = int(max_p)
        except (ValueError, TypeError):
            max_p = None

    slug = make_slug(name, city, year)

    return {
        "slug": slug,
        "name": name,
        "date": _parse_date(e.get("date", e.get("eventDate", e.get("startDate")))),
        "city": city,
        "country": country,
        "discipline": "triathlon",
        "category": category,
        "location": f"{city}, {country}",
        "swim_distance": swim,
        "bike_distance": bike,
        "run_distance": run,
        "latitude": float(lat) if lat else None,
        "longitude": float(lon) if lon else None,
        "price_euros": price,
        "max_participants": max_p,
        "website_url": clean_str(e.get("url", e.get("registrationUrl", e.get("website")))),
        "image_gradient": _category_gradient(category),
        "tags": _build_tags(category, country_en),
    }


def _scrape_html(year: int) -> list[dict]:
    """Fallback : scrape la page HTML d'Ironman."""
    url = f"https://www.ironman.com/races?year={year}&region=europe"
    resp = requests.get(url, headers=DEFAULT_HEADERS, timeout=25)
    resp.raise_for_status()

    from bs4 import BeautifulSoup
    soup = BeautifulSoup(resp.text, "lxml")
    races = []

    # Chercher les cards d'events (classes susceptibles de changer)
    cards = soup.select(".event-card, .race-card, [data-event], .event-list-item")
    for card in cards:
        try:
            name_el = card.select_one(".event-name, .race-name, h2, h3")
            city_el = card.select_one(".event-location, .location, .city")
            date_el = card.select_one(".event-date, .date, time")
            type_el = card.select_one(".event-type, .race-type, .category")

            name = clean_str(name_el.get_text()) if name_el else None
            city = clean_str(city_el.get_text()) if city_el else None

            if not name or not city:
                continue

            raw_cat = clean_str(type_el.get_text()) if type_el else "ironman"
            category = IRONMAN_CATEGORY_MAP.get((raw_cat or "").lower(), "Ironman")

            races.append({
                "slug": make_slug(name, city, year),
                "name": name,
                "date": _parse_date(date_el.get_text() if date_el else None),
                "city": city,
                "country": "France",  # À améliorer avec détection pays
                "discipline": "triathlon",
                "category": category,
                "location": city,
                "image_gradient": _category_gradient(category),
            })
        except Exception:
            continue

    return races


def _parse_ironman_distance(raw, discipline: str) -> Optional[int]:
    """Convertit les distances Ironman (déjà en km souvent) en mètres."""
    if raw is None:
        return None

    # Distances standard Ironman si non précisé
    defaults = {"swim": 3800, "bike": 180000, "run": 42195}

    try:
        val = float(str(raw).replace(",", "."))
        # Si c'est un grand nombre c'est déjà en mètres, sinon en km
        if val < 500:
            return int(val * 1000)
        return int(val)
    except (ValueError, TypeError):
        pass

    # Distances 70.3
    if "70.3" in str(raw).lower():
        return {"swim": 1900, "bike": 90000, "run": 21097}[discipline]

    return defaults.get(discipline)


def _parse_date(raw) -> Optional[str]:
    if not raw:
        return None
    import re
    raw = str(raw).strip()
    # ISO format
    m = re.search(r"(\d{4}-\d{2}-\d{2})", raw)
    if m:
        return m.group(1)
    # DD/MM/YYYY
    m = re.search(r"(\d{1,2})[/\-](\d{1,2})[/\-](\d{4})", raw)
    if m:
        return f"{m.group(3)}-{m.group(2).zfill(2)}-{m.group(1).zfill(2)}"
    return None


def _category_gradient(cat: str) -> str:
    gradients = {
        "Ironman": "bg-gradient-to-br from-red-700 to-rose-900",
        "70.3": "bg-gradient-to-br from-blue-700 to-indigo-900",
        "M": "bg-gradient-to-br from-emerald-600 to-teal-800",
    }
    return gradients.get(cat, "bg-gradient-to-br from-zinc-600 to-zinc-800")


def _build_tags(category: str, country: str) -> list[str]:
    tags = []
    if category == "Ironman":
        tags.extend(["Longue distance", "Ironman"])
    elif category == "70.3":
        tags.extend(["Half Ironman", "70.3"])
    if country and country != "France":
        tags.append(f"Étranger")
    return tags or None
