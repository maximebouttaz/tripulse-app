# TriRace — Plateforme de courses triathlon

Site de découverte de courses triathlon en France et en Europe (~700 courses).
Permet de rechercher, filtrer et consulter les détails de chaque épreuve.

## Stack technique

- **Framework** : Next.js 16 (App Router), React 19, TypeScript 5
- **Style** : Tailwind CSS 4 (dark theme zinc-950), PostCSS
- **Backend** : Supabase (PostgreSQL) — client dans `lib/supabase.ts`
- **Icônes** : Lucide React
- **Fonts** : Geist Sans / Geist Mono (Vercel)
- **SEO** : ISR (revalidate: 86400), JSON-LD, sitemap dynamique

## Commandes

```bash
npm run dev      # serveur local http://localhost:3000
npm run build    # build production
npm run lint     # ESLint
```

## Structure du projet

```
app/
  page.tsx                  # Homepage (server component, ISR)
  layout.tsx                # Root layout, Header + Footer
  globals.css               # Tailwind imports + custom theme
  not-found.tsx             # Page 404
  robots.ts                 # robots.txt
  sitemap.ts                # Sitemap XML dynamique
  courses/
    page.tsx                # Liste toutes les courses (client component)
    [slug]/page.tsx         # Détail d'une course (SSG + ISR)

components/
  Header.tsx                # Header sticky avec nav
  Footer.tsx                # Footer avec liens
  RaceCard.tsx              # Card de course réutilisable
  RaceFilters.tsx           # Recherche + filtres catégorie + tri
  CTABanner.tsx             # Bannière TriCoach

lib/
  types.ts                  # Interface Race (36 propriétés)
  utils.ts                  # formatDistance, formatDate, categoryLabel, categoryColor, tempLabel
  supabase.ts               # Client Supabase
```

## Modèle de données — table `races`

Colonnes principales :
- **Identité** : `id`, `slug`, `name`, `date`, `location`, `city`, `department`, `region`, `country`
- **Géo** : `latitude`, `longitude`
- **Catégorie** : `discipline`, `category` (valeurs : XS, S, M, L, 70.3, XL, Ironman)
- **Distances** (en mètres) : `swim_distance`, `bike_distance`, `run_distance`, `total_distance`
- **Dénivelé** (en mètres) : `bike_elevation`, `run_elevation`, `total_elevation`
- **Pratique** : `price_euros`, `max_participants`, `time_limit_hours`
- **Contenu** : `description`, `tagline`, `image_gradient` (classe Tailwind), `tags` (string[])
- **Météo** : `avg_temp_celsius`, `avg_water_temp_celsius`, `avg_wind_kmh`
- **Records** : `record_men`, `record_women` (format string, ex: "7h42:15")
- **Liens** : `website_url`, `finishers_url`

## Conventions importantes

### Catégories
| Valeur DB | Label affiché | Filtre UI |
|-----------|--------------|-----------|
| XS, S     | Sprint       | `sprint`  |
| M         | Olympique    | `olympic` |
| L, 70.3   | Half / 70.3  | `half`    |
| XL, Ironman | Ironman/XL | `full`    |

### Design
- **Couleurs principales** : rouge (`red-500`/`red-600`) et orange (`orange-500`) pour la marque
- **Fond** : `zinc-950`, cartes `zinc-900`, bordures `zinc-800`
- **Texte** : `white` pour titres, `zinc-400`/`zinc-500` pour secondaire
- **Arrondis** : `rounded-3xl` pour les cartes, `rounded-2xl` pour les sections
- **Hover** : `hover:-translate-y-1`, `hover:border-zinc-700`

### Utilitaires
- `formatDistance(meters)` → "1.5km" ou "400m"
- `formatDate(dateStr)` → "15 juin 2026" (fr-FR)
- `formatDateLong(dateStr)` → "dimanche 15 juin 2026"
- `categoryLabel(cat)` → "Sprint", "Olympique", "Ironman"...
- `categoryColor(cat)` → classes Tailwind pour le badge couleur
- `tempLabel(temp)` → `{ label: "Chaud", color: "bg-red-50 text-red-600" }`

## Partenaire — TriCoach
URL : `process.env.NEXT_PUBLIC_TRICOACH_URL` (défaut: `https://tricoach.app`)
Chaque course a un lien vers `tricoach.app/races/{slug}` pour la préparation.

## Points d'attention
- La page `/courses` est un **client component** (`'use client'`) car elle utilise `useState`, `useEffect`, `useMemo`, `useSearchParams`
- Les pages `app/page.tsx` et `app/courses/[slug]/page.tsx` sont des **server components** avec ISR
- Ne jamais commit les variables d'environnement (`.env.local`)
- Les images sont des **gradients Tailwind** stockés en DB (pas de vraies images)
