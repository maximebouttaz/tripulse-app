'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin, Calendar, Plus, Trophy, ArrowRight, Trash2,
  Waves, Bike, Activity,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { AthleteRace } from '@/lib/types';

const ATHLETE_ID = 126239815;

// --- Helpers ---
function daysLeft(dateStr: string | null): string {
  if (!dateStr) return '';
  const diff = Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
  if (diff < 0) return 'Terminé';
  if (diff === 0) return "Aujourd'hui";
  return `J-${diff}`;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'Date TBC';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

function formatDistance(meters: number | null): string {
  if (!meters) return '—';
  if (meters >= 1000) return `${(meters / 1000).toFixed(meters % 1000 === 0 ? 0 : 1)}km`;
  return `${meters}m`;
}

function priorityStyle(p: string) {
  switch (p) {
    case 'A': return { bg: 'bg-red-600', text: 'A-Race', dot: 'bg-red-600' };
    case 'B': return { bg: 'bg-amber-500', text: 'B-Race', dot: 'bg-amber-500' };
    default:  return { bg: 'bg-zinc-400', text: 'C-Race', dot: 'bg-zinc-400' };
  }
}

function categoryLabel(cat: string): string {
  const map: Record<string, string> = {
    'XS': 'XS', 'S': 'Sprint', 'M': 'Olympique',
    'L': 'Longue Distance', '70.3': '70.3',
    'XL': 'XL', 'Ironman': 'Ironman',
  };
  return map[cat] || cat;
}

// --- Race Card ---
function SeasonRaceCard({
  entry, isNext, onRemove,
}: {
  entry: AthleteRace; isNext: boolean; onRemove: () => void;
}) {
  const race = entry.races;
  const prio = priorityStyle(entry.priority);
  const dl = daysLeft(race.date);
  const isPast = dl === 'Terminé';

  return (
    <Link href={`/races/${race.slug}`} className="block">
      <motion.div
        whileHover={{ scale: 1.02 }}
        className={`relative rounded-3xl overflow-hidden border ${
          isNext && !isPast ? 'border-red-300 shadow-xl shadow-red-500/10' : 'border-zinc-200 shadow-sm'
        } bg-white`}
      >
        {/* Gradient header */}
        <div className={`h-32 w-full ${race.image_gradient || 'bg-gradient-to-br from-zinc-400 to-zinc-600'} relative`}>
          <div className="absolute inset-0 bg-black/20" />
          <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-zinc-900 uppercase tracking-wider">
            {categoryLabel(race.category)}
          </div>
          <div className={`absolute top-4 left-4 ${prio.bg} text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-lg`}>
            {prio.text}
          </div>
        </div>

        <div className="p-6">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-xl font-display font-bold text-zinc-900 leading-tight">{race.name}</h3>
            <ArrowRight className="text-zinc-300 shrink-0" />
          </div>

          <div className="flex flex-col gap-2 mt-4">
            <div className="flex items-center gap-2 text-sm text-zinc-500">
              <Calendar size={16} />
              <span className="font-mono font-bold text-zinc-700">{formatDate(race.date)}</span>
              {dl && (
                <span className={`text-xs px-2 py-0.5 rounded font-bold ${
                  isPast ? 'bg-zinc-100 text-zinc-400' : 'bg-red-50 text-red-600'
                }`}>
                  {dl}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm text-zinc-500">
              <MapPin size={16} /> {race.city}, {race.country}
            </div>
          </div>

          {/* Distances */}
          <div className="flex items-center gap-4 text-xs text-zinc-500 mt-4">
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

          {/* Remove button */}
          <div className="mt-4 flex justify-end">
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onRemove(); }}
              className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-red-500 transition px-2 py-1 rounded-lg hover:bg-red-50"
            >
              <Trash2 size={14} /> Retirer
            </button>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}

// --- Page ---
export default function RacesPage() {
  const [entries, setEntries] = useState<AthleteRace[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchSeason() {
    setLoading(true);
    const { data, error } = await supabase
      .from('athlete_races')
      .select('*, races(*)')
      .eq('athlete_id', ATHLETE_ID);

    if (!error && data) {
      const sorted = (data as AthleteRace[]).sort((a, b) => {
        if (!a.races.date) return 1;
        if (!b.races.date) return -1;
        return a.races.date.localeCompare(b.races.date);
      });
      setEntries(sorted);
    }
    setLoading(false);
  }

  useEffect(() => { fetchSeason(); }, []);

  async function handleRemove(raceId: number) {
    await supabase
      .from('athlete_races')
      .delete()
      .eq('athlete_id', ATHLETE_ID)
      .eq('race_id', raceId);
    setEntries((prev) => prev.filter((e) => e.race_id !== raceId));
  }

  // Find the next upcoming race
  const nextIdx = entries.findIndex((e) => {
    if (!e.races.date) return false;
    return new Date(e.races.date).getTime() >= Date.now() - 86400000;
  });

  return (
    <div className="min-h-screen bg-zinc-50 p-6 md:p-10 pb-24">
      <div className="max-w-3xl mx-auto">

        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold text-zinc-900">Ma Saison</h1>
            <p className="text-zinc-500 text-sm">
              {loading ? 'Chargement...' : `${entries.length} course${entries.length > 1 ? 's' : ''}`}
            </p>
          </div>
          <Link href="/races/explore">
            <button className="flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white rounded-xl text-sm font-bold shadow-lg hover:bg-zinc-800 transition">
              <Plus size={16} /> Explorer
            </button>
          </Link>
        </header>

        {loading ? (
          <div className="space-y-6">
            {[1, 2].map((i) => (
              <div key={i} className="animate-pulse bg-white rounded-3xl overflow-hidden border border-zinc-100">
                <div className="h-32 bg-zinc-200" />
                <div className="p-6 space-y-3">
                  <div className="h-5 w-3/4 bg-zinc-200 rounded" />
                  <div className="h-3 w-40 bg-zinc-100 rounded" />
                  <div className="h-3 w-32 bg-zinc-100 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : entries.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <Trophy size={48} className="mx-auto text-zinc-200 mb-4" />
            <h3 className="font-display font-bold text-zinc-900 text-lg">Aucune course ajoutée</h3>
            <p className="text-zinc-500 text-sm mt-2 mb-6">
              Explore le catalogue et ajoute tes objectifs 2026.
            </p>
            <Link href="/races/explore">
              <button className="px-6 py-3 bg-zinc-900 text-white rounded-xl text-sm font-bold shadow-lg hover:bg-zinc-800 transition">
                Explorer les courses
              </button>
            </Link>
          </motion.div>
        ) : (
          <div className="relative border-l-2 border-zinc-200 ml-4 pl-8 space-y-8">
            <AnimatePresence>
              {entries.map((entry, i) => {
                const prio = priorityStyle(entry.priority);
                return (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="relative"
                  >
                    {/* Timeline dot */}
                    <div className={`absolute -left-[41px] top-8 w-5 h-5 rounded-full border-4 border-zinc-50 ${prio.dot}`} />
                    <SeasonRaceCard
                      entry={entry}
                      isNext={i === nextIdx}
                      onRemove={() => handleRemove(entry.race_id)}
                    />
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {/* End of season */}
            <div className="relative">
              <div className="absolute -left-[41px] top-2 w-5 h-5 rounded-full border-4 border-zinc-50 bg-zinc-200" />
              <div className="p-6 border-2 border-dashed border-zinc-200 rounded-3xl flex flex-col items-center justify-center text-zinc-400 gap-2 h-40">
                <Trophy size={24} />
                <span className="font-display font-bold text-sm">Fin de saison</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
