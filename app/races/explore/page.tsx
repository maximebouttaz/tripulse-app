'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Heart, MapPin, Mountain, Waves, Bike, Activity,
  Calendar, ChevronLeft, Euro, Check,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Race } from '@/lib/types';

// --- Catégories de filtre ---
const CATEGORIES = [
  { key: 'all', label: 'Toutes' },
  { key: 'sprint', label: 'Sprint (S)' },
  { key: 'olympic', label: 'Olympique (M)' },
  { key: 'half', label: 'Half (L / 70.3)' },
  { key: 'full', label: 'Ironman / XL' },
] as const;

type CategoryFilter = (typeof CATEGORIES)[number]['key'];

// --- Helpers ---
function formatDistance(meters: number | null): string {
  if (!meters) return '—';
  if (meters >= 1000) return `${(meters / 1000).toFixed(meters % 1000 === 0 ? 0 : 1)}km`;
  return `${meters}m`;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'Date TBC';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

function categoryLabel(cat: string): string {
  const map: Record<string, string> = {
    'XS': 'XS', 'S': 'Sprint', 'M': 'Olympique',
    'L': 'Longue Distance', '70.3': '70.3',
    'XL': 'XL', 'Ironman': 'Ironman',
  };
  return map[cat] || cat;
}

function categoryColor(cat: string): string {
  switch (cat) {
    case 'Ironman': return 'bg-red-600 text-white';
    case 'XL': return 'bg-purple-600 text-white';
    case '70.3': return 'bg-blue-600 text-white';
    case 'L': return 'bg-indigo-600 text-white';
    case 'M': return 'bg-emerald-600 text-white';
    case 'S': return 'bg-amber-600 text-white';
    case 'XS': return 'bg-zinc-600 text-white';
    default: return 'bg-zinc-600 text-white';
  }
}

// --- Race Card ---
function RaceCard({ race, inSeason }: { race: Race; inSeason: boolean }) {
  return (
    <Link href={`/races/${race.slug}`}>
      <motion.div
        whileHover={{ y: -4 }}
        className="group bg-white rounded-3xl overflow-hidden border border-zinc-200 shadow-sm hover:shadow-lg transition-all cursor-pointer h-full flex flex-col"
      >
        {/* Image header */}
        <div className={`h-36 ${race.image_gradient || 'bg-gradient-to-br from-zinc-400 to-zinc-600'} relative`}>
          {inSeason ? (
            <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500 text-white rounded-full text-[10px] font-bold">
              <Check size={12} /> Ma saison
            </div>
          ) : (
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
              className="absolute top-3 right-3 p-2 bg-white/40 backdrop-blur-sm rounded-full hover:bg-white/80 text-white hover:text-red-500 transition-all"
            >
              <Heart size={16} />
            </button>
          )}
          <div className={`absolute bottom-3 left-3 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${categoryColor(race.category)}`}>
            {categoryLabel(race.category)}
          </div>
          {race.country !== 'France' && (
            <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur text-zinc-700 text-[10px] font-bold px-2 py-1 rounded-lg">
              {race.country}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-5 flex-1 flex flex-col">
          {/* Location + Date */}
          <div className="flex items-center gap-1.5 text-xs text-zinc-400 mb-1.5">
            <MapPin size={12} />
            <span>{race.city}, {race.country}</span>
          </div>

          <h3 className="font-display font-bold text-zinc-900 text-lg leading-tight mb-1">
            {race.name}
          </h3>

          <div className="flex items-center gap-1.5 text-xs text-zinc-500 mb-4">
            <Calendar size={12} />
            <span className="font-mono">{formatDate(race.date)}</span>
          </div>

          {/* Distances */}
          <div className="flex items-center gap-4 text-xs text-zinc-500 mb-3">
            {race.swim_distance && (
              <div className="flex items-center gap-1">
                <Waves size={12} className="text-cyan-500" />
                <span className="font-mono font-bold text-zinc-700">{formatDistance(race.swim_distance)}</span>
              </div>
            )}
            {race.bike_distance && (
              <div className="flex items-center gap-1">
                <Bike size={12} className="text-red-500" />
                <span className="font-mono font-bold text-zinc-700">{formatDistance(race.bike_distance)}</span>
              </div>
            )}
            {race.run_distance && (
              <div className="flex items-center gap-1">
                <Activity size={12} className="text-amber-500" />
                <span className="font-mono font-bold text-zinc-700">{formatDistance(race.run_distance)}</span>
              </div>
            )}
          </div>

          {/* Elevation + Price */}
          <div className="flex items-center gap-4 text-xs text-zinc-400 mb-4">
            {race.total_elevation != null && race.total_elevation > 0 && (
              <div className="flex items-center gap-1">
                <Mountain size={12} />
                <span className="font-mono">{race.total_elevation}m D+</span>
              </div>
            )}
            {race.price_euros && (
              <div className="flex items-center gap-1">
                <Euro size={12} />
                <span className="font-mono">{race.price_euros}€</span>
              </div>
            )}
          </div>

          {/* Tags */}
          {race.tags && race.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-auto">
              {race.tags.slice(0, 3).map((tag) => (
                <span key={tag} className="text-[10px] font-bold text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded-full">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </Link>
  );
}

// --- Page principale ---
export default function ExplorePage() {
  const [races, setRaces] = useState<Race[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>('all');
  const [seasonRaceIds, setSeasonRaceIds] = useState<Set<number>>(new Set());

  // Fetch races + season
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const [racesRes, seasonRes] = await Promise.all([
        supabase.from('races').select('*').order('date', { ascending: true }),
        supabase.from('athlete_races').select('race_id').eq('athlete_id', 126239815),
      ]);

      if (!racesRes.error && racesRes.data) {
        setRaces(racesRes.data as Race[]);
      }
      if (!seasonRes.error && seasonRes.data) {
        setSeasonRaceIds(new Set(seasonRes.data.map((r: { race_id: number }) => r.race_id)));
      }
      setLoading(false);
    }
    fetchData();
  }, []);

  // Filter
  const filtered = useMemo(() => {
    let result = races;

    // Category filter
    if (activeCategory !== 'all') {
      if (activeCategory === 'sprint') result = result.filter(r => ['XS', 'S'].includes(r.category));
      else if (activeCategory === 'olympic') result = result.filter(r => r.category === 'M');
      else if (activeCategory === 'half') result = result.filter(r => ['L', '70.3'].includes(r.category));
      else if (activeCategory === 'full') result = result.filter(r => ['XL', 'Ironman'].includes(r.category));
    }

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(r =>
        r.name.toLowerCase().includes(q) ||
        r.city.toLowerCase().includes(q) ||
        r.country.toLowerCase().includes(q) ||
        (r.region && r.region.toLowerCase().includes(q))
      );
    }

    return result;
  }, [races, activeCategory, search]);

  return (
    <div className="min-h-screen bg-zinc-50 p-6 md:p-10 pb-24">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link href="/races" className="p-2 bg-white border border-zinc-200 rounded-xl hover:bg-zinc-50 transition">
            <ChevronLeft size={20} className="text-zinc-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-display font-bold text-zinc-900">Explorer les courses</h1>
            <p className="text-sm text-zinc-400">
              {loading ? 'Chargement...' : `${filtered.length} course${filtered.length > 1 ? 's' : ''} disponible${filtered.length > 1 ? 's' : ''}`}
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={20} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Chercher une course, ville, pays..."
            className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-zinc-200 bg-white font-display text-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-300 outline-none transition"
          />
        </div>

        {/* Category filters */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className={`
                px-4 py-2 rounded-xl text-sm font-display font-bold whitespace-nowrap transition-all
                ${activeCategory === cat.key
                  ? 'bg-zinc-900 text-white shadow-md'
                  : 'bg-white border border-zinc-200 text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900'
                }
              `}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Results grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="animate-pulse bg-white rounded-3xl overflow-hidden border border-zinc-100">
                <div className="h-36 bg-zinc-200" />
                <div className="p-5 space-y-3">
                  <div className="h-3 w-24 bg-zinc-100 rounded" />
                  <div className="h-5 w-3/4 bg-zinc-200 rounded" />
                  <div className="h-3 w-32 bg-zinc-100 rounded" />
                  <div className="flex gap-4">
                    <div className="h-3 w-12 bg-zinc-100 rounded" />
                    <div className="h-3 w-12 bg-zinc-100 rounded" />
                    <div className="h-3 w-12 bg-zinc-100 rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <Search size={48} className="mx-auto text-zinc-200 mb-4" />
            <h3 className="font-display font-bold text-zinc-900 text-lg">Aucune course trouvée</h3>
            <p className="text-zinc-500 text-sm mt-2">Essaie un autre filtre ou une autre recherche.</p>
          </motion.div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={activeCategory + search}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            >
              {filtered.map((race) => (
                <RaceCard key={race.id} race={race} inSeason={seasonRaceIds.has(race.id)} />
              ))}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
