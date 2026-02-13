'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  Activity, TrendingUp, Zap, BarChart3, 
  ArrowUpRight, ArrowDownRight, Award 
} from 'lucide-react';

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

export default function AnalyticsPage() {
  return (
    <div className="min-h-screen bg-zinc-50 p-6 md:p-10 pb-24">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* EN-TÊTE */}
        <header className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-display font-bold text-zinc-900">Performance</h1>
            <p className="text-zinc-500 text-sm mt-1">Analyse des 42 derniers jours</p>
          </div>
          <button className="hidden md:flex items-center gap-2 px-4 py-2 bg-white border border-zinc-200 rounded-xl text-xs font-bold text-zinc-600 hover:bg-zinc-50 transition">
            <BarChart3 size={16} /> Exporter CSV
          </button>
        </header>

        {/* 1. KPIs PRINCIPAUX */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard 
            title="Fitness (CTL)" 
            value="84" 
            unit="pts" 
            trend="up" 
            label="+2 pts" 
            color="text-brand-red"
          />
          <StatCard 
            title="Fatigue (ATL)" 
            value="102" 
            unit="pts" 
            trend="up" 
            label="Heavy load" 
            color="text-zinc-900"
          />
          <StatCard 
            title="Forme (TSB)" 
            value="-18" 
            unit="" 
            trend="down" 
            label="Zone Rouge" 
            color="text-amber-500"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* 2. GRAPHIQUE DE CHARGE (PMC SIMULÉ) */}
          <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm relative overflow-hidden">
            <div className="flex justify-between items-center mb-8">
               <h3 className="font-display font-bold text-zinc-900">Training Load Management</h3>
               <div className="flex gap-4 text-xs font-bold">
                  <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-blue-500"></div>Fitness</div>
                  <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-rose-500"></div>Fatigue</div>
               </div>
            </div>
            
            {/* Simulation graphique SVG */}
            <div className="h-64 w-full relative">
              <svg viewBox="0 0 100 50" className="w-full h-full overflow-visible" preserveAspectRatio="none">
                {/* Ligne CTL (Bleu - Fitness) - Monte doucement */}
                <path 
                  d="M0 40 Q 25 38, 50 30 T 100 20" 
                  fill="none" 
                  stroke="#3b82f6" 
                  strokeWidth="0.5" 
                  className="drop-shadow-lg"
                />
                <path 
                   d="M0 40 Q 25 38, 50 30 T 100 20 V 50 H 0 Z" 
                   fill="url(#blue-grad)" 
                   className="opacity-20"
                />
                
                {/* Ligne ATL (Rose - Fatigue) - Très volatile */}
                <path 
                  d="M0 45 L 10 30 L 20 40 L 30 20 L 40 35 L 50 15 L 60 40 L 70 10 L 80 30 L 90 25 L 100 5" 
                  fill="none" 
                  stroke="#f43f5e" 
                  strokeWidth="0.5" 
                />

                <defs>
                  <linearGradient id="blue-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.5"/>
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity="0"/>
                  </linearGradient>
                </defs>
              </svg>
              
              {/* Ligne pointillée TSB 0 */}
              <div className="absolute top-1/2 w-full border-t border-dashed border-zinc-300"></div>
            </div>
          </div>

          {/* 3. DISTRIBUTION DES ZONES (POLARIZED) */}
          <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm">
            <div className="mb-6">
              <h3 className="font-display font-bold text-zinc-900">Intensité Hebdo</h3>
              <p className="text-xs text-zinc-400 mt-1">Modèle Polarisé détecté (82/18)</p>
            </div>
            
            <div className="space-y-2">
              <ZoneBar zone="1" range="Récupération" percent={45} color="bg-zinc-300" />
              <ZoneBar zone="2" range="Endurance" percent={37} color="bg-emerald-400" />
              <ZoneBar zone="3" range="Tempo" percent={8} color="bg-yellow-400" />
              <ZoneBar zone="4" range="Seuil" percent={15} color="bg-orange-500" />
              <ZoneBar zone="5" range="VO2 Max" percent={5} color="bg-red-600" />
            </div>
          </div>
        </div>

        {/* 4. RECORDS DE PUISSANCE (MMP) */}
        <div className="bg-zinc-900 text-white rounded-[2rem] p-8 shadow-2xl">
           <div className="flex items-center gap-3 mb-8">
              <div className="p-2 bg-yellow-500/20 rounded-lg text-yellow-500">
                 <Award size={20} />
              </div>
              <h3 className="font-display font-bold text-xl">Nouveaux Records (90 jours)</h3>
           </div>
           
           <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                 { time: '5 sec', watts: '980w', text: 'Sprint Max' },
                 { time: '1 min', watts: '520w', text: 'Anaérobie' },
                 { time: '5 min', watts: '380w', text: 'VO2 Max' },
                 { time: '20 min', watts: '315w', text: 'FTP Test' },
              ].map((record, i) => (
                 <div key={i} className="bg-white/10 rounded-2xl p-4 backdrop-blur-sm border border-white/5 hover:bg-white/20 transition-colors">
                    <p className="text-zinc-400 text-xs font-bold uppercase mb-1">{record.time}</p>
                    <p className="text-3xl font-mono font-bold text-white mb-1">{record.watts}</p>
                    <p className="text-[10px] text-zinc-400">{record.text}</p>
                 </div>
              ))}
           </div>
        </div>

      </div>
    </div>
  );
}