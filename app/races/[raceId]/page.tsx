'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  ChevronLeft, Calendar, MapPin, Users, 
  Mountain, Wind, Sun, Timer, Zap
} from 'lucide-react';
import Link from 'next/link';

export default function RaceDetailPage({ params }: { params: { raceId: string } }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [targetWatts, setTargetWatts] = useState(200);

  // Simulation calcul simple : 10W = 2 min sur 180km (c'est faux physiquement mais ok pour UI demo)
  const estimatedTime = () => {
     const baseMinutes = 360; // 6h00
     const gain = (targetWatts - 150) * 0.5; // gain de temps
     const totalMin = baseMinutes - gain;
     const h = Math.floor(totalMin / 60);
     const m = Math.floor(totalMin % 60);
     return `${h}h${m < 10 ? '0'+m : m}`;
  };

  return (
    <div className="min-h-screen bg-zinc-50 pb-24">
      
      {/* HERO IMAGE */}
      <div className="h-64 md:h-80 bg-gradient-to-br from-blue-700 to-indigo-800 relative">
        <div className="absolute inset-0 bg-black/20" />
        <div className="absolute top-6 left-6 z-10">
           <Link href="/races" className="flex items-center gap-2 text-white/80 hover:text-white font-bold bg-black/20 px-4 py-2 rounded-full backdrop-blur transition">
              <ChevronLeft size={18} /> Retour
           </Link>
        </div>
        <div className="absolute bottom-0 w-full p-6 md:p-10 bg-gradient-to-t from-zinc-900/80 to-transparent">
           <div className="max-w-7xl mx-auto">
              <span className="bg-red-600 text-white px-3 py-1 rounded text-xs font-bold uppercase tracking-wider mb-2 inline-block">A-Race • Priority</span>
              <h1 className="text-4xl md:text-5xl font-display font-black text-white tracking-tight">Ironman France Nice</h1>
              <div className="flex flex-wrap gap-6 mt-4 text-white/90 text-sm font-bold">
                 <span className="flex items-center gap-2"><Calendar size={16} /> 26 Juin 2026</span>
                 <span className="flex items-center gap-2"><MapPin size={16} /> Promenade des Anglais</span>
                 <span className="flex items-center gap-2"><Users size={16} /> 2,400 Participants</span>
              </div>
           </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 md:p-10 -mt-6">
         
         {/* TABS NAVIGATION */}
         <div className="flex bg-white rounded-2xl p-1 shadow-sm border border-zinc-200 mb-8 w-full md:w-auto inline-flex overflow-x-auto">
            {['overview', 'strategy', 'squad'].map((tab) => (
               <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-6 py-3 rounded-xl text-sm font-bold font-display capitalize transition-all ${activeTab === tab ? 'bg-zinc-900 text-white shadow-md' : 'text-zinc-500 hover:text-zinc-900'}`}
               >
                  {tab}
               </button>
            ))}
         </div>

         {/* CONTENU DES ONGLETS */}
         
         {/* 1. OVERVIEW */}
         {activeTab === 'overview' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 md:grid-cols-3 gap-6">
               <div className="md:col-span-2 space-y-6">
                  <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm">
                     <h3 className="font-display font-bold text-zinc-900 mb-4 flex items-center gap-2">
                        <Mountain size={18} /> Profil Vélo (2400m D+)
                     </h3>
                     {/* SVG Elevation Graph */}
                     <div className="h-40 w-full relative">
                        <svg viewBox="0 0 100 30" className="w-full h-full" preserveAspectRatio="none">
                           <path d="M0 25 L 10 25 L 30 5 L 50 15 L 70 2 L 90 25 L 100 25" fill="none" stroke="#dc2626" strokeWidth="2" />
                           <path d="M0 25 L 10 25 L 30 5 L 50 15 L 70 2 L 90 25 L 100 25 V 30 H 0 Z" fill="url(#red-grad)" className="opacity-20" />
                           <defs>
                              <linearGradient id="red-grad" x1="0" y1="0" x2="0" y2="1">
                                 <stop offset="0%" stopColor="#dc2626" stopOpacity="0.5"/>
                                 <stop offset="100%" stopColor="#dc2626" stopOpacity="0"/>
                              </linearGradient>
                           </defs>
                        </svg>
                        <div className="flex justify-between text-xs text-zinc-400 font-mono mt-2">
                           <span>0km</span>
                           <span>Col de l'Ecre</span>
                           <span>180km</span>
                        </div>
                     </div>
                  </div>
                  <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm">
                     <h3 className="font-display font-bold text-zinc-900 mb-2">Description</h3>
                     <p className="text-zinc-600 leading-relaxed text-sm">
                        L'un des parcours les plus mythiques au monde. Nage dans la Baie des Anges (Attention : pas de néoprène si eau {'>'} 24°C). Vélo très exigeant dans l'arrière-pays niçois avec le Col de l'Ecre. Marathon plat mais très chaud sur la Promenade.
                     </p>
                  </div>
               </div>
               
               <div className="space-y-6">
                  <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm">
                     <h3 className="font-display font-bold text-zinc-900 mb-4">Météo Moyenne</h3>
                     <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                           <Sun className="text-amber-500" /> <span className="text-2xl font-mono font-bold">28°C</span>
                        </div>
                        <span className="text-xs font-bold bg-amber-50 text-amber-600 px-2 py-1 rounded">Chaud</span>
                     </div>
                     <div className="flex items-center justify-between text-sm text-zinc-500 border-t border-zinc-100 pt-4">
                        <div className="flex items-center gap-1"><Wind size={14} /> 15 km/h</div>
                        <div className="flex items-center gap-1">Eau: 23°C</div>
                     </div>
                  </div>
               </div>
            </motion.div>
         )}

         {/* 2. STRATEGY (CALCULATOR) */}
         {activeTab === 'strategy' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto">
               <div className="bg-zinc-900 text-white rounded-[2rem] p-8 shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-10 opacity-10">
                     <Timer size={150} />
                  </div>
                  
                  <h3 className="text-2xl font-display font-bold mb-8 relative z-10">Bike Split Predictor</h3>
                  
                  <div className="mb-10 relative z-10">
                     <div className="flex justify-between mb-4">
                        <span className="text-zinc-400 font-bold uppercase text-xs tracking-widest">Puissance Cible (NP)</span>
                        <span className="text-3xl font-mono font-bold text-brand-red">{targetWatts} <span className="text-sm text-zinc-400">Watts</span></span>
                     </div>
                     <input 
                        type="range" 
                        min="150" 
                        max="350" 
                        step="5"
                        value={targetWatts}
                        onChange={(e) => setTargetWatts(parseInt(e.target.value))}
                        className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-brand-red"
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
                     Rejoins les 12 autres athlètes TriPulse qui participent à cette course pour partager logistique et conseils.
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