"""
Enrichissement géographique via Nominatim (OpenStreetMap) — gratuit, sans clé.
https://nominatim.org/release-docs/develop/api/Search/

Pour chaque course sans coordonnées GPS, on cherche lat/lon depuis city + country.
"""
import time
import requests
from typing import Optional


NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"

HEADERS = {
    "User-Agent": "TriRace/1.0 (trirace.app; contact@trirace.app)",
    "Accept-Language": "fr,en",
}


def enrich_geocoding(supabase_client) -> int:
    """
    Enrichit toutes les courses sans coordonnées GPS.
    Retourne le nombre de courses géocodées.
    """
    print("[GEO] Géocodage des courses sans coordonnées...")

    result = (
        supabase_client.table("races")
        .select("id, slug, city, country, location, latitude")
        .is_("latitude", "null")
        .execute()
    )

    races = result.data or []
    print(f"[GEO] {len(races)} courses à géocoder")

    geocoded = 0
    for race in races:
        try:
            coords = geocode(
                city=race["city"],
                country=race["country"],
                location=race.get("location"),
            )

            if coords:
                supabase_client.table("races").update(coords).eq("id", race["id"]).execute()
                geocoded += 1
                print(f"  ✓ {race['slug']} → {coords['latitude']:.4f}, {coords['longitude']:.4f}")
            else:
                print(f"  ✗ {race['slug']} : non trouvé")

        except Exception as e:
            print(f"  ✗ {race['slug']} : {e}")

        # Nominatim impose max 1 requête/seconde
        time.sleep(1.1)

    print(f"[GEO] {geocoded}/{len(races)} courses géocodées")
    return geocoded


def geocode(city: str, country: str, location: Optional[str] = None) -> Optional[dict]:
    """
    Géocode une ville + pays via Nominatim.
    Retourne { latitude, longitude } ou None.
    """
    # On essaie d'abord avec city + country
    queries = [
        f"{city}, {country}",
        city,
    ]

    # Si le champ location est plus précis (ex: "Lac d'Annecy, Annecy"), on l'essaie en premier
    if location and location != city and len(location) < 80:
        queries.insert(0, f"{location}, {country}")

    for query in queries:
        result = _nominatim_search(query)
        if result:
            return result
        time.sleep(1.1)

    return None


def _nominatim_search(query: str) -> Optional[dict]:
    """Effectue une recherche Nominatim et retourne les coordonnées."""
    params = {
        "q": query,
        "format": "json",
        "limit": 1,
        "addressdetails": 0,
    }

    try:
        resp = requests.get(NOMINATIM_URL, params=params, headers=HEADERS, timeout=10)
        resp.raise_for_status()
        results = resp.json()

        if results:
            r = results[0]
            return {
                "latitude": float(r["lat"]),
                "longitude": float(r["lon"]),
            }
    except Exception:
        pass

    return None
