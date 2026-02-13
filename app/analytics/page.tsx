'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3,
  ArrowUpRight, ArrowDownRight, Award
} from 'lucide-react';
import type { AthleteProfile } from '@/lib/types';

// --- COMPOSANTS UI GRAPHIQUES ---

const StatCard = ({ title, value, unit, trend, label, color = "text-zinc-900" }: any) => (
  <div className="p-6 bg-white rounded-3xl border border-zinc-200 shadow-sm flex flex-col justify-between">
    <div className="flex justify-between items-start mb-4">
      <h3 className="text-zinc-400 font-bold text-xs uppercase tracking-widest">{title}</h3>
      <div className={`flex items-center gap-1 text-xs font-bold ${trend === 'up' ? 'text-emerald-500' : 'text-rose-500'}`}>
        {trend === 'up' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
        {label}
      </div>
    </div>
    <div className="flex items-baseline gap-1">
      <span className={`text-4xl font-mono font-bold tracking-tighter ${color}`}>{value}</span>
      <span className="text-zinc-400 font-bold text-sm">{unit}</span>
    </div>
  </div>
);

// Barre de Zone (Distribution)
const ZoneBar = ({ zone, percent, color, range }: any) => (
  <div className="mb-4">
    <div className="flex justify-between text-xs font-bold mb-1">
      <span className="text-zinc-500">Z{zone} • {range}</span>
      <span className="text-zinc-900 font-mono">{percent}%</span>
    </div>
    <div className="h-3 w-full bg-zinc-100 rounded-full overflow-hidden">
      <motion.div 
        initial={{ width: 0 }}
        animate={{ width: `${percent}%` }}
        transition={{ duration: 1, ease: "easeOut" }}
        className={`h-full rounded-full ${color}`}
      />
    </div>
  </div>
);

// --- HELPERS ---
function tsbTrend(tsb: number): { trend: 'up' | 'down'; label: string; color: string } {
  if (tsb > 5) return { trend: 'up', label: 'Bien reposé', color: 'text-cyan-500' };
  if (tsb > -10) return { trend: 'up', label: 'Forme optimale', color: 'text-emerald-500' };
  if (tsb > -25) return { trend: 'down', label: 'Charge productive', color: 'text-amber-500' };
  return { trend: 'down', label: 'Fatigue élevée', color: 'text-red-500' };
}

function detectModel(dist: number[]): string {
  if (!dist || dist.length < 5) return '';
  const lowIntensity = dist[0] + dist[1]; // Z1 + Z2
  const highIntensity = dist[3] + dist[4]; // Z4 + Z5
  if (lowIntensity >= 75 && highIntensity >= 10) return `Polarisé (${lowIntensity}/${highIntensity})`;
  if (dist[2] >= 20) return 'Pyramidal';
  return `Mix (${lowIntensity}/${dist[2]}/${highIntensity})`;
}

export default function AnalyticsPage() {
  const [profile, setProfile] = useState<AthleteProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/athlete/metrics?athlete_id=126239815')
      .then(res => res.ok ? res.json() : null)
      .then(data => { if (data && !data.error) setProfile(data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const ctl = profile ? Math.round(profile.ctl) : 0;
  const atl = profile ? Math.round(profile.atl) : 0;
  const tsb = profile ? Math.round(profile.tsb) : 0;
  const tsbInfo = tsbTrend(tsb);
  const hrDist = profile?.hr_zone_distribution ?? [0, 0, 0, 0, 0];
  const powerDist = profile?.power_zone_distribution ?? null;
  const ftp = profile?.ftp_watts;

  const zoneColors = ['bg-zinc-300', 'bg-emerald-400', 'bg-yellow-400', 'bg-orange-500', 'bg-red-600'];
  const zoneNames = ['Récupération', 'Endurance', 'Tempo', 'Seuil', 'VO2 Max'];

  return (
    <div className="min-h-screen bg-zinc-50 p-6 md:p-10 pb-24">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* EN-TÊTE */}
        <header className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-display font-bold text-zinc-900">Performance</h1>
            <p className="text-zinc-500 text-sm mt-1">
              {profile?.last_assessed_at
                ? `Dernière analyse : ${new Date(profile.last_assessed_at).toLocaleDateString('fr-FR')}`
                : 'Analyse des données Strava'}
            </p>
          </div>
          <button className="hidden md:flex items-center gap-2 px-4 py-2 bg-white border border-zinc-200 rounded-xl text-xs font-bold text-zinc-600 hover:bg-zinc-50 transition">
            <BarChart3 size={16} /> Exporter CSV
          </button>
        </header>

        {/* 1. KPIs PRINCIPAUX */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard
            title="Fitness (CTL)"
            value={loading ? '—' : String(ctl)}
            unit="pts"
            trend={ctl >= 50 ? 'up' : 'down'}
            label={ctl >= 80 ? 'Excellent' : ctl >= 50 ? 'Bon' : ctl >= 25 ? 'Modéré' : 'Début'}
            color="text-brand-red"
          />
          <StatCard
            title="Fatigue (ATL)"
            value={loading ? '—' : String(atl)}
            unit="pts"
            trend={atl > ctl ? 'up' : 'down'}
            label={atl > 80 ? 'Charge haute' : atl > 50 ? 'Charge modérée' : 'Charge faible'}
            color="text-zinc-900"
          />
          <StatCard
            title="Forme (TSB)"
            value={loading ? '—' : String(tsb)}
            unit=""
            trend={tsbInfo.trend}
            label={tsbInfo.label}
            color={tsbInfo.color}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* 2. RÉSUMÉ + VOLUME */}
          <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm">
            <div className="flex justify-between items-center mb-8">
               <h3 className="font-display font-bold text-zinc-900">Résumé Entraînement</h3>
               <div className="flex gap-4 text-xs font-bold">
                  <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-cyan-500"></div>Swim</div>
                  <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-brand-red"></div>Bike</div>
                  <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-amber-400"></div>Run</div>
               </div>
            </div>

            {profile ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div>
                  <p className="text-zinc-400 text-[10px] font-bold uppercase tracking-widest">FTP</p>
                  <p className="text-3xl font-mono font-bold">{ftp ?? '—'}<span className="text-sm text-zinc-300 ml-1">W</span></p>
                </div>
                <div>
                  <p className="text-zinc-400 text-[10px] font-bold uppercase tracking-widest">Allure Seuil</p>
                  <p className="text-3xl font-mono font-bold">
                    {profile.threshold_pace_sec
                      ? `${Math.floor(profile.threshold_pace_sec / 60)}:${(profile.threshold_pace_sec % 60).toString().padStart(2, '0')}`
                      : '—'}
                    <span className="text-sm text-zinc-300 ml-1">/km</span>
                  </p>
                </div>
                <div>
                  <p className="text-zinc-400 text-[10px] font-bold uppercase tracking-widest">FC Max</p>
                  <p className="text-3xl font-mono font-bold">{profile.max_hr ?? '—'}<span className="text-sm text-zinc-300 ml-1">bpm</span></p>
                </div>
                <div>
                  <p className="text-zinc-400 text-[10px] font-bold uppercase tracking-widest">CSS</p>
                  <p className="text-3xl font-mono font-bold">
                    {profile.css_pace_sec
                      ? `${Math.floor(profile.css_pace_sec / 60)}:${(profile.css_pace_sec % 60).toString().padStart(2, '0')}`
                      : '—'}
                    <span className="text-sm text-zinc-300 ml-1">/100m</span>
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-zinc-400 text-sm">{loading ? 'Chargement...' : 'Aucune donnée. Lance une évaluation depuis les réglages.'}</p>
            )}

            {/* Volume hebdo */}
            {profile && (
              <div className="mt-8 pt-6 border-t border-zinc-100">
                <p className="text-zinc-400 text-[10px] font-bold uppercase tracking-widest mb-4">Volume hebdomadaire moyen</p>
                <div className="flex gap-6">
                  {[
                    { label: 'Swim', min: profile.weekly_swim_min, color: 'bg-cyan-500' },
                    { label: 'Bike', min: profile.weekly_bike_min, color: 'bg-brand-red' },
                    { label: 'Run', min: profile.weekly_run_min, color: 'bg-amber-400' },
                  ].map((d, i) => (
                    <div key={i} className="flex-1">
                      <div className="flex justify-between text-xs font-bold mb-1">
                        <span className="text-zinc-500">{d.label}</span>
                        <span className="font-mono">{d.min >= 60 ? `${Math.floor(d.min / 60)}h${Math.round(d.min % 60).toString().padStart(2, '0')}` : `${Math.round(d.min)}min`}</span>
                      </div>
                      <div className="h-3 w-full bg-zinc-100 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(Math.round((d.min / (d.label === 'Bike' ? 600 : 300)) * 100), 100)}%` }}
                          transition={{ duration: 1, ease: "easeOut" }}
                          className={`h-full rounded-full ${d.color}`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 3. DISTRIBUTION DES ZONES HR */}
          <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm">
            <div className="mb-6">
              <h3 className="font-display font-bold text-zinc-900">Zones FC</h3>
              <p className="text-xs text-zinc-400 mt-1">
                {hrDist.some(v => v > 0) ? `Modèle ${detectModel(hrDist)}` : 'Pas de données HR'}
              </p>
            </div>

            <div className="space-y-2">
              {hrDist.map((pct, i) => (
                <ZoneBar
                  key={i}
                  zone={i + 1}
                  range={zoneNames[i]}
                  percent={Math.round(pct)}
                  color={zoneColors[i]}
                />
              ))}
            </div>
          </div>
        </div>

        {/* 4. SEUILS & FORCES/FAIBLESSES */}
        <div className="bg-zinc-900 text-white rounded-[2rem] p-8 shadow-2xl">
           <div className="flex items-center gap-3 mb-8">
              <div className="p-2 bg-yellow-500/20 rounded-lg text-yellow-500">
                 <Award size={20} />
              </div>
              <h3 className="font-display font-bold text-xl">Analyse de l'athlète</h3>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             {/* Forces */}
             <div>
               <p className="text-emerald-400 text-xs font-bold uppercase tracking-widest mb-4">Forces</p>
               {profile?.strengths && profile.strengths.length > 0 ? (
                 <div className="space-y-2">
                   {profile.strengths.map((s, i) => (
                     <div key={i} className="bg-white/10 rounded-2xl p-4 backdrop-blur-sm border border-white/5">
                       <p className="text-sm text-zinc-200">{s}</p>
                     </div>
                   ))}
                 </div>
               ) : (
                 <p className="text-zinc-500 text-sm">Pas encore de données suffisantes</p>
               )}
             </div>

             {/* Faiblesses */}
             <div>
               <p className="text-amber-400 text-xs font-bold uppercase tracking-widest mb-4">Axes d'amélioration</p>
               {profile?.weaknesses && profile.weaknesses.length > 0 ? (
                 <div className="space-y-2">
                   {profile.weaknesses.map((w, i) => (
                     <div key={i} className="bg-white/10 rounded-2xl p-4 backdrop-blur-sm border border-white/5">
                       <p className="text-sm text-zinc-200">{w}</p>
                     </div>
                   ))}
                 </div>
               ) : (
                 <p className="text-zinc-500 text-sm">Aucune faiblesse détectée</p>
               )}
             </div>
           </div>

           {/* Power zone distribution if available */}
           {powerDist && (
             <div className="mt-8 pt-8 border-t border-white/10">
               <p className="text-zinc-400 text-xs font-bold uppercase tracking-widest mb-4">Distribution Zones Puissance</p>
               <div className="grid grid-cols-5 gap-2">
                 {powerDist.slice(0, 5).map((pct: number, i: number) => (
                   <div key={i} className="text-center">
                     <div className="h-24 bg-white/5 rounded-lg relative overflow-hidden">
                       <motion.div
                         initial={{ height: 0 }}
                         animate={{ height: `${pct}%` }}
                         transition={{ duration: 1, ease: "easeOut" }}
                         className={`absolute bottom-0 w-full rounded-t-lg ${zoneColors[i]} opacity-80`}
                       />
                     </div>
                     <p className="text-[10px] text-zinc-400 mt-1 font-mono">Z{i + 1}</p>
                     <p className="text-xs text-white font-bold">{Math.round(pct)}%</p>
                   </div>
                 ))}
               </div>
             </div>
           )}
        </div>

      </div>
    </div>
  );
}