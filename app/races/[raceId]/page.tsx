'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, Calendar, MapPin, Users, Mountain, Wind, Sun,
  Timer, Zap, Waves, Bike, Activity, Euro, Clock, ExternalLink,
  Trophy, Plus, Check, X,
} from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import type { Race } from '@/lib/types';

// --- Priority config ---
const PRIORITIES = [
  { key: 'A', label: 'A-Race', desc: 'Objectif principal', color: 'bg-red-600', ring: 'ring-red-200' },
  { key: 'B', label: 'B-Race', desc: 'Préparation', color: 'bg-amber-500', ring: 'ring-amber-200' },
  { key: 'C', label: 'C-Race', desc: 'Découverte', color: 'bg-zinc-400', ring: 'ring-zinc-200' },
] as const;

// --- Helpers ---
function formatDistance(meters: number | null): string {
  if (!meters) return '—';
  if (meters >= 1000) return `${(meters / 1000).toFixed(meters % 1000 === 0 ? 0 : 1)}km`;
  return `${meters}m`;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'Date TBC';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

function categoryColor(cat: string): string {
  switch (cat) {
    case 'Ironman': return 'bg-red-600';
    case 'XL': return 'bg-purple-600';
    case '70.3': return 'bg-blue-600';
    case 'L': return 'bg-indigo-600';
    case 'M': return 'bg-emerald-600';
    case 'S': return 'bg-amber-600';
    default: return 'bg-zinc-600';
  }
}

function tempLabel(temp: number | null): { label: string; color: string } {
  if (!temp) return { label: '', color: '' };
  if (temp >= 28) return { label: 'Chaud', color: 'bg-red-50 text-red-600' };
  if (temp >= 22) return { label: 'Agréable', color: 'bg-amber-50 text-amber-600' };
  if (temp >= 16) return { label: 'Frais', color: 'bg-blue-50 text-blue-600' };
  return { label: 'Froid', color: 'bg-cyan-50 text-cyan-600' };
}

export default function RaceDetailPage() {
  const params = useParams();
  const slug = params.raceId as string;
  const [race, setRace] = useState<Race | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [targetWatts, setTargetWatts] = useState(200);

  // Season state
  const [inSeason, setInSeason] = useState<{ priority: string } | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function fetchRace() {
      const { data } = await supabase
        .from('races')
        .select('*')
        .eq('slug', slug)
        .single();

      if (data) {
        setRace(data as Race);
        // Check if already in season
        const { data: ar } = await supabase
          .from('athlete_races')
          .select('priority')
          .eq('athlete_id', 126239815)
          .eq('race_id', data.id)
          .single();
        if (ar) setInSeason({ priority: ar.priority });
      }
      setLoading(false);
    }
    if (slug) fetchRace();
  }, [slug]);

  async function addToSeason(priority: string) {
    if (!race) return;
    setSaving(true);
    const { error } = await supabase.from('athlete_races').insert({
      athlete_id: 126239815,
      race_id: race.id,
      priority,
    });
    if (!error) {
      setInSeason({ priority });
      setShowPicker(false);
    }
    setSaving(false);
  }

  async function removeFromSeason() {
    if (!race) return;
    setSaving(true);
    await supabase.from('athlete_races')
      .delete()
      .eq('athlete_id', 126239815)
      .eq('race_id', race.id);
    setInSeason(null);
    setSaving(false);
  }

  const estimatedTime = () => {
    const bikeKm = race?.bike_distance ? race.bike_distance / 1000 : 180;
    const elevFactor = race?.bike_elevation ? race.bike_elevation * 0.08 : 0;
    const baseMinutes = (bikeKm / 30) * 60 + elevFactor;
    const gain = (targetWatts - 150) * 0.5;
    const totalMin = baseMinutes - gain;
    const h = Math.floor(totalMin / 60);
    const m = Math.floor(totalMin % 60);
    return `${h}h${m < 10 ? '0' + m : m}`;
  };

  // Loading
  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 pb-24">
        <div className="h-64 md:h-80 bg-zinc-200 animate-pulse" />
        <div className="max-w-7xl mx-auto p-6 md:p-10 space-y-6">
          <div className="h-12 w-72 bg-zinc-200 rounded-2xl animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 h-64 bg-zinc-100 rounded-3xl animate-pulse" />
            <div className="h-48 bg-zinc-100 rounded-3xl animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  // Not found
  if (!race) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center pb-24">
        <div className="text-center">
          <h2 className="text-2xl font-display font-bold text-zinc-900 mb-2">Course introuvable</h2>
          <p className="text-zinc-500 mb-6">Cette course n&apos;existe pas ou a été supprimée.</p>
          <Link href="/races/explore" className="px-6 py-3 bg-zinc-900 text-white rounded-xl font-bold">
            Explorer les courses
          </Link>
        </div>
      </div>
    );
  }

  const temp = tempLabel(race.avg_temp_celsius);

  return (
    <div className="min-h-screen bg-zinc-50 pb-24">

      {/* HERO */}
      <div className={`h-64 md:h-80 ${race.image_gradient || 'bg-gradient-to-br from-zinc-600 to-zinc-800'} relative`}>
        <div className="absolute inset-0 bg-black/20" />
        <div className="absolute top-6 left-6 z-10">
          <Link href="/races/explore" className="flex items-center gap-2 text-white/80 hover:text-white font-bold bg-black/20 px-4 py-2 rounded-full backdrop-blur transition">
            <ChevronLeft size={18} /> Retour
          </Link>
        </div>
        <div className="absolute bottom-0 w-full p-6 md:p-10 bg-gradient-to-t from-zinc-900/80 to-transparent">
          <div className="max-w-7xl mx-auto">
            <span className={`${categoryColor(race.category)} text-white px-3 py-1 rounded text-xs font-bold uppercase tracking-wider mb-2 inline-block`}>
              {race.category}
            </span>
            <h1 className="text-3xl md:text-5xl font-display font-black text-white tracking-tight">
              {race.name}
            </h1>
            <div className="flex flex-wrap gap-4 md:gap-6 mt-4 text-white/90 text-sm font-bold">
              <span className="flex items-center gap-2"><Calendar size={16} /> {formatDate(race.date)}</span>
              <span className="flex items-center gap-2"><MapPin size={16} /> {race.location}</span>
              {race.max_participants && (
                <span className="flex items-center gap-2"><Users size={16} /> {race.max_participants.toLocaleString('fr-FR')} places</span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 md:p-10 -mt-6">

        {/* ADD TO SEASON CTA */}
        <div className="mb-6">
          {inSeason ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-5 py-3 bg-emerald-50 border border-emerald-200 rounded-2xl">
                <Check size={16} className="text-emerald-600" />
                <span className="text-sm font-display font-bold text-emerald-700">Dans ma saison</span>
                <span className={`ml-1 px-2 py-0.5 rounded-lg text-[10px] font-bold text-white ${
                  inSeason.priority === 'A' ? 'bg-red-600' : inSeason.priority === 'B' ? 'bg-amber-500' : 'bg-zinc-400'
                }`}>
                  {inSeason.priority}-Race
                </span>
              </div>
              <button
                onClick={removeFromSeason}
                disabled={saving}
                className="flex items-center gap-1.5 px-4 py-3 bg-white border border-zinc-200 rounded-2xl text-xs font-bold text-zinc-500 hover:text-red-500 hover:border-red-200 transition"
              >
                <X size={14} /> Retirer
              </button>
            </div>
          ) : showPicker ? (
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm"
              >
                <p className="text-sm font-display font-bold text-zinc-900 mb-4">Choisir la priorité :</p>
                <div className="flex gap-3">
                  {PRIORITIES.map((p) => (
                    <button
                      key={p.key}
                      onClick={() => addToSeason(p.key)}
                      disabled={saving}
                      className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-2xl border-2 border-transparent hover:ring-2 ${p.ring} transition-all ${saving ? 'opacity-50' : ''}`}
                    >
                      <div className={`w-10 h-10 rounded-xl ${p.color} flex items-center justify-center text-white font-bold text-sm`}>
                        {p.key}
                      </div>
                      <span className="text-sm font-display font-bold text-zinc-900">{p.label}</span>
                      <span className="text-[10px] text-zinc-400">{p.desc}</span>
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setShowPicker(false)}
                  className="mt-3 text-xs text-zinc-400 hover:text-zinc-600 font-bold transition"
                >
                  Annuler
                </button>
              </motion.div>
            </AnimatePresence>
          ) : (
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => setShowPicker(true)}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-2xl font-display font-bold text-sm shadow-lg hover:shadow-xl transition-shadow"
            >
              <Plus size={16} /> Ajouter à ma saison
            </motion.button>
          )}
        </div>

        {/* TABS */}
        <div className="flex bg-white rounded-2xl p-1 shadow-sm border border-zinc-200 mb-8 w-full md:w-auto md:inline-flex overflow-x-auto">
          {['overview', 'strategy', 'squad'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 rounded-xl text-sm font-bold font-display capitalize transition-all flex-1 md:flex-none ${activeTab === tab ? 'bg-zinc-900 text-white shadow-md' : 'text-zinc-500 hover:text-zinc-900'}`}
            >
              {tab === 'overview' ? 'Parcours' : tab === 'strategy' ? 'Stratégie' : 'Squad'}
            </button>
          ))}
        </div>

        {/* 1. OVERVIEW */}
        {activeTab === 'overview' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">

            {/* Distances KPI */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {race.swim_distance && (
                <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-sm text-center">
                  <Waves size={20} className="mx-auto text-cyan-500 mb-2" />
                  <p className="text-2xl font-mono font-bold text-zinc-900">{formatDistance(race.swim_distance)}</p>
                  <p className="text-xs text-zinc-400 font-bold uppercase tracking-widest mt-1">Natation</p>
                </div>
              )}
              {race.bike_distance && (
                <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-sm text-center">
                  <Bike size={20} className="mx-auto text-red-500 mb-2" />
                  <p className="text-2xl font-mono font-bold text-zinc-900">{formatDistance(race.bike_distance)}</p>
                  <p className="text-xs text-zinc-400 font-bold uppercase tracking-widest mt-1">Vélo</p>
                </div>
              )}
              {race.run_distance && (
                <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-sm text-center">
                  <Activity size={20} className="mx-auto text-amber-500 mb-2" />
                  <p className="text-2xl font-mono font-bold text-zinc-900">{formatDistance(race.run_distance)}</p>
                  <p className="text-xs text-zinc-400 font-bold uppercase tracking-widest mt-1">Course</p>
                </div>
              )}
              {race.total_elevation != null && race.total_elevation > 0 && (
                <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-sm text-center">
                  <Mountain size={20} className="mx-auto text-purple-500 mb-2" />
                  <p className="text-2xl font-mono font-bold text-zinc-900">{race.total_elevation}m</p>
                  <p className="text-xs text-zinc-400 font-bold uppercase tracking-widest mt-1">Dénivelé D+</p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Main content */}
              <div className="md:col-span-2 space-y-6">

                {/* Bike profile */}
                {race.bike_elevation && race.bike_elevation > 0 && (
                  <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm">
                    <h3 className="font-display font-bold text-zinc-900 mb-4 flex items-center gap-2">
                      <Mountain size={18} /> Profil Vélo ({race.bike_elevation}m D+)
                    </h3>
                    <div className="h-40 w-full relative">
                      <svg viewBox="0 0 100 30" className="w-full h-full" preserveAspectRatio="none">
                        <path d="M0 25 L 10 25 L 30 5 L 50 15 L 70 2 L 90 25 L 100 25" fill="none" stroke="#dc2626" strokeWidth="2" />
                        <path d="M0 25 L 10 25 L 30 5 L 50 15 L 70 2 L 90 25 L 100 25 V 30 H 0 Z" fill="url(#red-grad)" className="opacity-20" />
                        <defs>
                          <linearGradient id="red-grad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#dc2626" stopOpacity="0.5" />
                            <stop offset="100%" stopColor="#dc2626" stopOpacity="0" />
                          </linearGradient>
                        </defs>
                      </svg>
                      <div className="flex justify-between text-xs text-zinc-400 font-mono mt-2">
                        <span>0km</span>
                        <span>{formatDistance(race.bike_distance)}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Description */}
                {race.description && (
                  <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm">
                    <h3 className="font-display font-bold text-zinc-900 mb-3">Description</h3>
                    {race.tagline && (
                      <p className="text-sm font-display font-bold italic text-zinc-500 mb-3">&ldquo;{race.tagline}&rdquo;</p>
                    )}
                    <p className="text-zinc-600 leading-relaxed text-sm">
                      {race.description}
                    </p>
                  </div>
                )}

                {/* Records */}
                {(race.record_men || race.record_women) && (
                  <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm">
                    <h3 className="font-display font-bold text-zinc-900 mb-4 flex items-center gap-2">
                      <Trophy size={18} className="text-amber-500" /> Records
                    </h3>
                    <div className="space-y-3">
                      {race.record_men && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-zinc-500 font-bold">Hommes</span>
                          <span className="text-sm font-mono font-bold text-zinc-900">{race.record_men}</span>
                        </div>
                      )}
                      {race.record_women && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-zinc-500 font-bold">Femmes</span>
                          <span className="text-sm font-mono font-bold text-zinc-900">{race.record_women}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Sidebar */}
              <div className="space-y-6">

                {/* Weather */}
                {race.avg_temp_celsius && (
                  <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm">
                    <h3 className="font-display font-bold text-zinc-900 mb-4">Météo Moyenne</h3>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Sun className="text-amber-500" />
                        <span className="text-2xl font-mono font-bold">{race.avg_temp_celsius}°C</span>
                      </div>
                      {temp.label && (
                        <span className={`text-xs font-bold px-2 py-1 rounded ${temp.color}`}>{temp.label}</span>
                      )}
                    </div>
                    <div className="flex items-center justify-between text-sm text-zinc-500 border-t border-zinc-100 pt-4">
                      {race.avg_wind_kmh && (
                        <div className="flex items-center gap-1"><Wind size={14} /> {race.avg_wind_kmh} km/h</div>
                      )}
                      {race.avg_water_temp_celsius && (
                        <div className="flex items-center gap-1">Eau : {race.avg_water_temp_celsius}°C</div>
                      )}
                    </div>
                  </div>
                )}

                {/* Info pratiques */}
                <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm space-y-4">
                  <h3 className="font-display font-bold text-zinc-900">Infos pratiques</h3>
                  {race.price_euros && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-zinc-500"><Euro size={14} /> Inscription</div>
                      <span className="font-mono font-bold text-zinc-900">{race.price_euros}€</span>
                    </div>
                  )}
                  {race.time_limit_hours && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-zinc-500"><Clock size={14} /> Barrière horaire</div>
                      <span className="font-mono font-bold text-zinc-900">{race.time_limit_hours}h</span>
                    </div>
                  )}
                  {race.max_participants && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-zinc-500"><Users size={14} /> Places</div>
                      <span className="font-mono font-bold text-zinc-900">{race.max_participants.toLocaleString('fr-FR')}</span>
                    </div>
                  )}
                </div>

                {/* Tags */}
                {race.tags && race.tags.length > 0 && (
                  <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm">
                    <h3 className="font-display font-bold text-zinc-900 mb-3">Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {race.tags.map((tag) => (
                        <span key={tag} className="text-xs font-bold text-zinc-500 bg-zinc-100 px-3 py-1.5 rounded-full">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Links */}
                {(race.website_url || race.finishers_url) && (
                  <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm space-y-3">
                    <h3 className="font-display font-bold text-zinc-900">Liens</h3>
                    {race.website_url && (
                      <a href={race.website_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 font-bold transition">
                        <ExternalLink size={14} /> Site officiel
                      </a>
                    )}
                    {race.finishers_url && (
                      <a href={race.finishers_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 font-bold transition">
                        <ExternalLink size={14} /> Voir sur Finishers
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* 2. STRATEGY */}
        {activeTab === 'strategy' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto">
            <div className="bg-zinc-900 text-white rounded-[2rem] p-8 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-10 opacity-10">
                <Timer size={150} />
              </div>

              <h3 className="text-2xl font-display font-bold mb-2 relative z-10">Bike Split Predictor</h3>
              <p className="text-zinc-400 text-sm mb-8 relative z-10">
                {formatDistance(race.bike_distance)} — {race.bike_elevation ? `${race.bike_elevation}m D+` : 'Plat'}
              </p>

              <div className="mb-10 relative z-10">
                <div className="flex justify-between mb-4">
                  <span className="text-zinc-400 font-bold uppercase text-xs tracking-widest">Puissance Cible (NP)</span>
                  <span className="text-3xl font-mono font-bold text-red-500">{targetWatts} <span className="text-sm text-zinc-400">Watts</span></span>
                </div>
                <input
                  type="range"
                  min="150"
                  max="350"
                  step="5"
                  value={targetWatts}
                  onChange={(e) => setTargetWatts(parseInt(e.target.value))}
                  className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-red-500"
                />
                <div className="flex justify-between text-xs text-zinc-500 font-mono mt-2">
                  <span>Safe (150w)</span>
                  <span>Pro (350w)</span>
                </div>
              </div>

              <div className="bg-white/10 rounded-2xl p-6 backdrop-blur border border-white/10 text-center relative z-10">
                <p className="text-zinc-400 text-xs font-bold uppercase tracking-widest mb-2">Temps Vélo Estimé</p>
                <p className="text-6xl font-mono font-bold text-white tracking-tighter">{estimatedTime()}</p>
                <p className="text-emerald-400 text-xs font-bold mt-2 flex items-center justify-center gap-1">
                  <Zap size={12} /> Optimal Pacing
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* 3. SQUAD */}
        {activeTab === 'squad' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-zinc-200">
              <Users size={48} className="mx-auto text-zinc-300 mb-4" />
              <h3 className="font-display font-bold text-zinc-900 text-lg">Race Squad</h3>
              <p className="text-zinc-500 max-w-md mx-auto mt-2">
                Rejoins les autres athlètes TriPulse qui participent à {race.name} pour partager logistique et conseils.
              </p>
              <button className="mt-6 px-6 py-3 bg-zinc-900 text-white rounded-xl font-bold shadow-lg">
                Rejoindre le chat
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
