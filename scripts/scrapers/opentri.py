"""
Scraper OpenTri.fr — 640+ courses triathlon en France.
Source : https://www.opentri.fr/calendrier/

Structure découverte :
- Liste des courses : liens <a href="/calendrier/[slug]/"> dans la page principale
- Page de course : FAQ JSON-LD avec date, lieu, distances
"""
import re
import time
import json
import requests
from datetime import date
from typing import Optional
from bs4 import BeautifulSoup

import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from utils import make_slug, normalize_category, clean_str, parse_distance_m, DEFAULT_HEADERS

BASE_URL = "https://www.opentri.fr"
CALENDAR_URL = f"{BASE_URL}/calendrier/"

MOIS_FR = {
    "janvier": 1, "février": 2, "fevrier": 2, "mars": 3, "avril": 4,
    "mai": 5, "juin": 6, "juillet": 7, "août": 8, "aout": 8,
    "septembre": 9, "octobre": 10, "novembre": 11, "décembre": 12, "decembre": 12,
}


def scrape(year: Optional[int] = None) -> list[dict]:
    year = year or date.today().year
    print(f"[OPENTRI] Scraping {year}...")

    # 1. Récupérer tous les liens de courses
    race_urls = _get_race_urls()
    print(f"[OPENTRI] {len(race_urls)} courses trouvées dans le calendrier")

    # 2. Scraper chaque page de course
    races = []
    for i, url in enumerate(race_urls):
        try:
            race = _scrape_race_page(url, year)
            if race:
                races.append(race)
        except Exception as e:
            print(f"  ✗ {url}: {e}")

        # Rate limiting respectueux
        time.sleep(0.4)

        if (i + 1) % 50 == 0:
            print(f"  {i + 1}/{len(race_urls)} traitées...")

    # OpenTri : on importe toutes les courses (dates souvent de l'édition précédente)
    # L'upsert sur slug évite les doublons si la course existe déjà
    print(f"[OPENTRI] {len(races)} courses trouvées")
    return races


def _get_race_urls() -> list[str]:
    """Récupère tous les liens /calendrier/[slug]/ depuis la page principale."""
    resp = requests.get(CALENDAR_URL, headers=DEFAULT_HEADERS, timeout=20)
    resp.raise_for_status()
    soup = BeautifulSoup(resp.text, "lxml")

    seen = set()
    urls = []
    for a in soup.find_all("a", href=True):
        href = a["href"]
        if (
            "/calendrier/" in href
            and href != CALENDAR_URL
            and not href.endswith("/calendrier/")
            and href not in seen
            and not any(x in href for x in ["?", "#", "page", "region", "categorie"])
        ):
            seen.add(href)
            urls.append(href if href.startswith("http") else f"{BASE_URL}{href}")

    return urls


def _scrape_race_page(url: str, year: int) -> Optional[dict]:
    """
    Scrape une page de course OpenTri.
    Les données clés sont dans le JSON-LD FAQPage.
    """
    resp = requests.get(url, headers=DEFAULT_HEADERS, timeout=15)
    if resp.status_code != 200:
        return None

    soup = BeautifulSoup(resp.text, "lxml")

    # Extraire le slug OpenTri depuis l'URL
    opentri_slug = url.rstrip("/").split("/")[-1]

    # --- JSON-LD FAQPage (source principale) ---
    faq_data = {}
    for s in soup.find_all("script", type="application/ld+json"):
        try:
            d = json.loads(s.string or "")
            if d.get("@type") == "FAQPage":
                for q in d.get("mainEntity", []):
                    question = q.get("name", "").lower()
                    answer_html = q.get("acceptedAnswer", {}).get("text", "")
                    answer = BeautifulSoup(answer_html, "lxml").get_text()
                    faq_data[question] = answer
        except Exception:
            continue

    if not faq_data:
        return None

    # --- Extraire les champs depuis les FAQs ---
    # Date
    event_date = None
    for key, val in faq_data.items():
        if "date" in key or "édition" in key or "aura lieu" in key:
            event_date = _parse_date_fr(val, year)
            if event_date:
                break

    # Lieu / ville
    city, dept, region_str = None, None, None
    for key, val in faq_data.items():
        if "départ" in key or "lieu" in key or "situe" in key or "ville" in key:
            city, dept, region_str = _parse_location(val)
            if city:
                break

    # Distances
    swim, bike, run = None, None, None
    for key, val in faq_data.items():
        if "distance" in key:
            swim, bike, run = _parse_distances(val)
            break

    # Catégorie
    category = "M"
    for key, val in faq_data.items():
        if "distance" in key or "format" in key or "catégorie" in key:
            category = _extract_category(val)
            if category:
                break

    # --- Nom depuis le titre de la page ---
    title = ""
    og_title = soup.find("meta", property="og:title")
    if og_title:
        title = og_title.get("content", "")
        # Nettoyer " : date, distances & avis - Opentri"
        title = re.sub(r"\s*[:–|-].*$", "", title).strip()
    if not title:
        h1 = soup.find("h1")
        title = clean_str(h1.get_text()) if h1 else opentri_slug.replace("-", " ").title()

    if not city:
        return None  # Pas assez d'infos

    name = title or city
    slug = make_slug(name, city, year)

    return {
        "slug": slug,
        "name": name,
        "date": event_date,
        "city": city,
        "department": dept,
        "region": region_str,
        "country": "France",
        "discipline": "triathlon",
        "category": category,
        "location": f"{city}, France",
        "swim_distance": swim,
        "bike_distance": bike,
        "run_distance": run,
        "website_url": url,
    }


def _parse_date_fr(text: str, year: int) -> Optional[str]:
    """Extrait une date depuis un texte en français."""
    text = text.lower().strip()

    # "23 février 2025"
    m = re.search(r"(\d{1,2})\s+(\w+)\s+(\d{4})", text)
    if m:
        mois = MOIS_FR.get(m.group(2))
        if mois:
            return f"{m.group(3)}-{str(mois).zfill(2)}-{m.group(1).zfill(2)}"

    # "23 février" sans année → utiliser year
    m = re.search(r"(\d{1,2})\s+(\w+)", text)
    if m:
        mois = MOIS_FR.get(m.group(2))
        if mois:
            return f"{year}-{str(mois).zfill(2)}-{m.group(1).zfill(2)}"

    # Format ISO
    m = re.search(r"(\d{4}-\d{2}-\d{2})", text)
    if m:
        return m.group(1)

    return None


def _parse_location(text: str) -> tuple[Optional[str], Optional[str], Optional[str]]:
    """
    Formats possibles :
    - 'Le départ est à Nice, France'
    - 'Le départ est à 02860 Chamouille, France'
    - 'Le départ est à Nice, Alpes-Maritimes, Provence-Alpes-Côte d'Azur'
    → ('Nice', dept_or_None, region_or_None)
    """
    # Nettoyer le préfixe
    text = re.sub(r"^le départ (de la course )?est à\s*", "", text, flags=re.I).strip()
    text = re.sub(r"^à\s+", "", text, flags=re.I)
    # Supprimer ", France" final
    text = re.sub(r",?\s*France\s*$", "", text, flags=re.I).strip()

    # Si commence par un code postal "02860 Chamouille"
    m = re.match(r"(\d{5})\s+(.+)", text)
    if m:
        city = m.group(2).strip().title()
        return city, None, None

    parts = [p.strip() for p in text.split(",")]
    city = parts[0].strip().title() if parts else None
    dept_name = parts[1].strip() if len(parts) > 1 else None
    region_name = parts[2].strip() if len(parts) > 2 else None

    return city, dept_name, region_name


def _parse_distances(text: str) -> tuple[Optional[int], Optional[int], Optional[int]]:
    """Extrait swim/bike/run depuis un texte de distances."""
    text_lower = text.lower()

    swim, bike, run = None, None, None

    # Patterns : "1.5 km natation", "natation : 1500 m", "swim 1.9km"
    patterns = [
        (r"(\d+[,.]\d+|\d+)\s*km\s*(?:de\s*)?(?:natation|nage|swim)", "swim", True),
        (r"(?:natation|nage|swim)\s*[:\-]?\s*(\d+[,.]\d+|\d+)\s*(km|m)", "swim", None),
        (r"(\d+[,.]\d+|\d+)\s*km\s*(?:de\s*)?(?:vélo|velo|bike|cyclisme|cycliste)", "bike", True),
        (r"(?:vélo|velo|bike)\s*[:\-]?\s*(\d+[,.]\d+|\d+)\s*(km|m)", "bike", None),
        (r"(\d+[,.]\d+|\d+)\s*km\s*(?:de\s*)?(?:course|cap|run|pied)", "run", True),
        (r"(?:course|cap|run)\s*[:\-]?\s*(\d+[,.]\d+|\d+)\s*(km|m)", "run", None),
    ]

    for pattern, discipline, is_km in patterns:
        m = re.search(pattern, text_lower)
        if not m:
            continue
        try:
            val = float(m.group(1).replace(",", "."))
            if is_km is True:
                meters = int(val * 1000)
            elif is_km is False:
                meters = int(val)
            else:
                # group(2) contient l'unité
                unit = m.group(2).lower() if len(m.groups()) > 1 else "km"
                meters = int(val * 1000) if unit == "km" else int(val)

            if discipline == "swim":
                swim = meters
            elif discipline == "bike":
                bike = meters
            elif discipline == "run":
                run = meters
        except (ValueError, IndexError):
            continue

    return swim, bike, run


def _extract_category(text: str) -> str:
    """Extrait la catégorie depuis le texte."""
    text_lower = text.lower()

    if "ironman" in text_lower:
        return "Ironman"
    if "70.3" in text_lower:
        return "70.3"

    # Chercher les tags HTML : <span>S</span>, <span>XL</span>
    span_cats = re.findall(r"<span[^>]*>([XSLM]{1,2})</span>", text, re.I)
    if span_cats:
        cat_map = {"XS": "XS", "S": "S", "M": "M", "L": "L", "XL": "XL"}
        return cat_map.get(span_cats[0].upper(), "M")

    if "longue" in text_lower or "xl" in text_lower:
        return "XL"
    if "half" in text_lower:
        return "70.3"
    if "olympique" in text_lower or "olympic" in text_lower:
        return "M"
    if "sprint" in text_lower:
        return "S"

    return "M"
