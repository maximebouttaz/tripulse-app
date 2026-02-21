"""
Utilitaires partagés : slug, normalisation des catégories, upsert Supabase.
"""
import re
import unicodedata
from datetime import date
from typing import Optional


# ---------------------------------------------------------------------------
# Slug
# ---------------------------------------------------------------------------

def make_slug(name: str, city: str, year: Optional[int] = None) -> str:
    """
    Génère un slug stable : {name}-{city}-{year}
    Ex: "Ironman France Nice 2026" + "Nice" -> "ironman-france-nice-2026"
    """
    def normalize(s: str) -> str:
        s = unicodedata.normalize("NFD", s)
        s = s.encode("ascii", "ignore").decode("ascii")
        s = s.lower()
        s = re.sub(r"[^a-z0-9\s-]", "", s)
        s = re.sub(r"[\s-]+", "-", s).strip("-")
        return s

    parts = [normalize(name)]
    # Éviter la redondance si le nom contient déjà la ville
    if normalize(city) not in normalize(name):
        parts.append(normalize(city))
    if year and str(year) not in normalize(name):
        parts.append(str(year))

    return "-".join(parts)


# ---------------------------------------------------------------------------
# Catégories
# ---------------------------------------------------------------------------

CATEGORY_MAP: dict[str, str] = {
    # FFTRI
    "s": "S", "sprint": "S",
    "xs": "XS", "super sprint": "XS", "supersprint": "XS",
    "m": "M", "olympique": "M", "olympic": "M",
    "ml": "L", "longue distance": "L", "ld": "L",
    "70.3": "70.3", "half ironman": "70.3", "half": "70.3",
    "l": "L",
    "xl": "XL",
    "ironman": "Ironman", "iron man": "Ironman",
}

def normalize_category(raw: str) -> str:
    """Convertit n'importe quelle désignation de catégorie vers nos valeurs internes."""
    key = raw.strip().lower()
    return CATEGORY_MAP.get(key, "M")  # Olympique par défaut


# ---------------------------------------------------------------------------
# Nettoyage des données
# ---------------------------------------------------------------------------

def clean_str(s: Optional[str]) -> Optional[str]:
    if not s:
        return None
    return s.strip() or None


def parse_distance_m(raw: str) -> Optional[int]:
    """
    Convertit "1.5 km", "1500m", "1,5km", "400 m" → entier en mètres.
    Retourne None si non parseable.
    """
    if not raw:
        return None
    raw = raw.replace(",", ".").lower().strip()
    m = re.search(r"([\d.]+)\s*(km|m)", raw)
    if not m:
        return None
    val = float(m.group(1))
    unit = m.group(2)
    return int(val * 1000) if unit == "km" else int(val)


def parse_price(raw: str) -> Optional[int]:
    """Extrait le prix en euros depuis "65€", "65 €", "65.00", etc."""
    if not raw:
        return None
    m = re.search(r"(\d+)", raw.replace(",", ""))
    return int(m.group(1)) if m else None


def current_year() -> int:
    return date.today().year


# ---------------------------------------------------------------------------
# Upsert Supabase
# ---------------------------------------------------------------------------

def upsert_races(supabase_client, races: list[dict]) -> dict:
    """
    Upsert une liste de courses dans la table `races`.
    Conflict resolution sur la colonne `slug` (unique).
    Retourne un dict { inserted, updated, errors }.
    """
    if not races:
        return {"inserted": 0, "updated": 0, "errors": 0}

    stats = {"inserted": 0, "updated": 0, "errors": 0}

    for race in races:
        # Nettoyer les URLs (supprimer les whitespace/newlines parasites)
        if race.get("website_url"):
            race["website_url"] = race["website_url"].strip()

        try:
            # Vérifier si la course existe déjà
            existing = (
                supabase_client.table("races")
                .select("id, slug")
                .eq("slug", race["slug"])
                .execute()
            )

            if existing.data:
                # UPDATE — on ne met à jour que les champs non-null du scraper
                # pour ne pas écraser les données enrichies manuellement
                update_data = {k: v for k, v in race.items() if v is not None and k != "slug"}
                supabase_client.table("races").update(update_data).eq("slug", race["slug"]).execute()
                stats["updated"] += 1
                print(f"  ↻ Mise à jour : {race['slug']}")
            else:
                # INSERT
                supabase_client.table("races").insert(race).execute()
                stats["inserted"] += 1
                print(f"  + Ajout : {race['slug']}")

        except Exception as e:
            stats["errors"] += 1
            print(f"  ✗ Erreur sur {race.get('slug', '?')} : {e}")

    return stats


# ---------------------------------------------------------------------------
# Headers HTTP communs (évite les 403)
# ---------------------------------------------------------------------------

DEFAULT_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/121.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.8",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
}
