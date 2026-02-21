"""
Orchestrateur principal — TriRace Data Sync
==========================================

Usage :
    python scripts/sync.py                    # tout scraper + enrichir
    python scripts/sync.py --sources fftri    # source unique
    python scripts/sync.py --no-enrich        # scraper seulement, pas d'enrichissement
    python scripts/sync.py --year 2027        # année spécifique
    python scripts/sync.py --dry-run          # afficher sans écrire en base

Variables d'environnement requises :
    SUPABASE_URL          — URL de ton projet Supabase
    SUPABASE_SERVICE_KEY  — Service role key (pas l'anon key !)
"""

import argparse
import os
import sys
from datetime import date

from dotenv import load_dotenv
from supabase import create_client

# Charger le .env si présent (dev local)
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

# Import des scrapers
from scrapers import fftri, ironman, opentri, les_chronos
from enrichers import weather, geocoding
from utils import upsert_races


ALL_SOURCES = {
    "fftri": fftri,       # Fédération Française de Triathlon (calendrier officiel)
    "opentri": opentri,   # OpenTri.fr (640+ courses France, avec distances)
    "ironman": ironman,   # Ironman + 70.3 Europe
    "les_chronos": les_chronos,  # Les-Chronos (complément régional)
}


def main():
    parser = argparse.ArgumentParser(description="TriRace — Synchronisation des courses")
    parser.add_argument(
        "--sources",
        nargs="+",
        choices=list(ALL_SOURCES.keys()),
        default=list(ALL_SOURCES.keys()),
        help="Sources à scraper (défaut: toutes)",
    )
    parser.add_argument(
        "--year",
        type=int,
        default=date.today().year,
        help=f"Année à scraper (défaut: {date.today().year})",
    )
    parser.add_argument(
        "--no-enrich",
        action="store_true",
        help="Désactiver l'enrichissement météo et géocodage",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Afficher les données sans écrire en base",
    )
    args = parser.parse_args()

    # --- Connexion Supabase ---
    supabase_url = os.environ.get("SUPABASE_URL")
    supabase_key = os.environ.get("SUPABASE_SERVICE_KEY")

    if args.dry_run:
        supabase = None
        print("🔍 Mode dry-run : aucune écriture en base")
    else:
        if not supabase_url or not supabase_key:
            print("❌ SUPABASE_URL et SUPABASE_SERVICE_KEY sont requis.")
            print("   Copie scripts/.env.example en scripts/.env et remplis les valeurs.")
            sys.exit(1)
        supabase = create_client(supabase_url, supabase_key)
        print(f"✓ Connecté à Supabase : {supabase_url}")

    print(f"\n{'='*50}")
    print(f"  TriRace Sync — {args.year}")
    print(f"  Sources : {', '.join(args.sources)}")
    print(f"{'='*50}\n")

    # --- Scraping ---
    total_stats = {"inserted": 0, "updated": 0, "errors": 0, "scraped": 0}

    for source_name in args.sources:
        scraper = ALL_SOURCES[source_name]
        print(f"\n▶ {source_name.upper()}")
        print("-" * 40)

        try:
            races = scraper.scrape(year=args.year)
            total_stats["scraped"] += len(races)

            if args.dry_run:
                print(f"  [DRY-RUN] {len(races)} courses trouvées :")
                for r in races[:5]:
                    print(f"    - {r.get('slug')} ({r.get('category')}) — {r.get('date')}")
                if len(races) > 5:
                    print(f"    ... et {len(races) - 5} de plus")
                continue

            if races:
                stats = upsert_races(supabase, races)
                total_stats["inserted"] += stats["inserted"]
                total_stats["updated"] += stats["updated"]
                total_stats["errors"] += stats["errors"]
            else:
                print(f"  ⚠ Aucune course trouvée")

        except Exception as e:
            print(f"  ✗ Erreur scraper {source_name} : {e}")
            total_stats["errors"] += 1

    # --- Enrichissement ---
    if not args.dry_run and not args.no_enrich:
        print(f"\n{'='*50}")
        print("  ENRICHISSEMENT")
        print(f"{'='*50}\n")

        print("\n▶ GÉOCODAGE (Nominatim / OpenStreetMap)")
        print("-" * 40)
        try:
            geocoding.enrich_geocoding(supabase)
        except Exception as e:
            print(f"  ✗ Erreur géocodage : {e}")

        print("\n▶ MÉTÉO (Open-Meteo — historique 5 ans)")
        print("-" * 40)
        try:
            weather.enrich_weather(supabase)
        except Exception as e:
            print(f"  ✗ Erreur météo : {e}")

    # --- Résumé ---
    print(f"\n{'='*50}")
    print("  RÉSUMÉ")
    print(f"{'='*50}")
    print(f"  Courses scrapées  : {total_stats['scraped']}")
    if not args.dry_run:
        print(f"  Ajoutées          : {total_stats['inserted']}")
        print(f"  Mises à jour      : {total_stats['updated']}")
        print(f"  Erreurs           : {total_stats['errors']}")
    print(f"{'='*50}\n")

    if total_stats["errors"] > 0:
        sys.exit(1)


if __name__ == "__main__":
    main()
