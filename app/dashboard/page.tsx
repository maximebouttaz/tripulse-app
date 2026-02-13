'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  Activity, Zap, Heart, CloudRain, Wind, 
  CheckCircle2, Watch, ArrowRight, Gauge, 
  TrendingUp, Timer, Trophy 
} from 'lucide-react';
import { TriPulseLogo } from '@/components/TriPulseLogo';

// --- COMPOSANT DE BASE BENTO ---
const BentoCard = ({ children, className = "", delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay }}
    className={`glass-light rounded-4xl p-6 flex flex-col ${className}`}
  >
    {children}
  </motion.div>
);

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-zinc-50 p-6 md:p-10 font-sans selection:bg-brand-red/10">
      <div className="max-w-7xl mx-auto">
        
        {/* HEADER AREA */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
          <TriPulseLogo />
          <div className="flex items-center gap-4 bg-white/50 p-2 rounded-2xl border border-zinc-200">
             <div className="text-right pr-2 border-r border-zinc-200">
                <p className="text-[10px] font-bold text-zinc-400 uppercase">Prochaine Échéance</p>
                <p className="font-display font-bold text-zinc-900 text-sm">Ironman Nice • J-42</p>
             </div>
             <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center overflow-hidden border border-white">
                <div className="w-full h-full bg-gradient-to-tr from-zinc-200 to-zinc-300" />
             </div>
          </div>
        </header>

        {/* BENTO GRID 4 COLONNES */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          
          {/* 1. HERO : FOCUS DU JOUR (2x2) */}
          <BentoCard className="md:col-span-2 md:row-span-2 relative overflow-hidden group border-zinc-300/50 shadow-xl">
            <div className="absolute -top-10 -right-10 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity">
              <Activity size={300} strokeWidth={1} />
            </div>
            
            <div className="relative z-10 flex flex-col h-full">
              <div className="flex justify-between items-start mb-10">
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 border border-red-100">
                  <Watch size={14} className="text-brand-red" />
                  <span className="text-[10px] font-bold text-brand-red tracking-widest uppercase">Bike • Intervals</span>
                </div>
                <p className="text-zinc-400 font-mono text-xs">ID_SESSION: 8429</p>
              </div>
              
              <div className="flex-1">
                <h2 className="text-5xl font-display font-extrabold tracking-tighter text-zinc-900 leading-[0.9]">
                  Seuil Lactique <br/>
                  <span className="text-zinc-300">3x10' @ 105% FTP</span>
                </h2>
                
                <div className="flex gap-8 mt-10">
                  <div>
                    <p className="text-zinc-400 text-[10px] font-bold uppercase tracking-widest">Durée</p>
                    <p className="text-3xl font-mono font-bold">01:15:00</p>
                  </div>
                  <div>
                    <p className="text-zinc-400 text-[10px] font-bold uppercase tracking-widest">TSS Prévu</p>
                    <p className="text-3xl font-mono font-bold text-brand-red">85</p>
                  </div>
                </div>
              </div>

              <div className="mt-12">
                <button className="w-full bg-zinc-900 text-white font-display font-bold py-5 rounded-3xl flex items-center justify-center gap-3 hover:bg-zinc-800 transition-all shadow-lg shadow-zinc-900/20 active:scale-[0.98]">
                   Push to Garmin <ArrowRight size={20} />
                </button>
              </div>
            </div>
          </BentoCard>

          {/* 2. AI COACH INSIGHT (2x1) */}
          <BentoCard className="md:col-span-2 bg-gradient-to-br from-zinc-900 to-zinc-800 border-none shadow-2xl" delay={0.1}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg brand-gradient flex items-center justify-center shadow-lg shadow-red-500/20">
                <Zap size={16} className="text-white" fill="white" />
              </div>
              <h3 className="font-display font-bold text-zinc-100 uppercase tracking-widest text-xs">TriCoach Intelligence</h3>
            </div>
            <p className="text-zinc-200 font-display text-xl leading-snug">
              "Ton HRV est stable (42ms) et ton sommeil de qualité. Le contexte est idéal pour absorber la charge de seuil prévue ce soir."
            </p>
            <div className="mt-6 flex gap-4">
               <span className="text-[10px] font-mono text-zinc-500 bg-white/5 px-2 py-1 rounded border border-white/5">MODE: PERFORMANCE_OPTIMIZED</span>
               <span className="text-[10px] font-mono text-zinc-500 bg-white/5 px-2 py-1 rounded border border-white/5">VFC: 104% VS AVG</span>
            </div>
          </BentoCard>

          {/* 3. SMART WEATHER (1x1) */}
          <BentoCard className="md:col-span-1" delay={0.2}>
            <div className="flex justify-between items-start mb-6">
              <CloudRain className="text-cyan-500" />
              <div className="text-right">
                <p className="text-[10px] font-bold text-zinc-400 uppercase">Nice, FR</p>
                <p className="text-[10px] font-bold text-zinc-400 uppercase">18:00</p>
              </div>
            </div>
            <div className="flex items-baseline gap-2">
               <h4 className="text-4xl font-mono font-bold">14°</h4>
               <span className="text-zinc-400 font-display font-bold">Pluie faible</span>
            </div>
            <div className="flex items-center gap-2 text-zinc-500 text-xs mt-2 border-t border-zinc-100 pt-2">
              <Wind size={14} /> 35km/h • Vent de face
            </div>
            <button className="mt-4 w-full py-3 bg-zinc-50 rounded-2xl text-[10px] font-bold text-zinc-500 uppercase tracking-widest hover:bg-zinc-100 transition border border-zinc-100">
              Passer sur Zwift
            </button>
          </BentoCard>

          {/* 4. BIO-TELEMETRY (1x1) */}
          <BentoCard className="md:col-span-1 border-brand-red/10" delay={0.3}>
            <div className="flex justify-between items-start mb-6">
              <Heart className="text-brand-red animate-pulse" />
              <span className="bg-red-50 text-brand-red text-[10px] px-2 py-1 rounded-md font-bold tracking-tighter border border-red-100">LOW RECOVERY</span>
            </div>
            <div className="flex flex-col">
               <p className="text-zinc-400 text-[10px] font-bold uppercase tracking-widest">HRV Matinal</p>
               <h4 className="text-4xl font-mono font-bold">42<span className="text-sm font-normal text-zinc-300 ml-1">ms</span></h4>
            </div>
            <div className="mt-auto h-1 w-full bg-zinc-100 rounded-full overflow-hidden">
               <motion.div 
                 initial={{ width: 0 }}
                 animate={{ width: '42%' }}
                 className="bg-brand-red h-full" 
               />
            </div>
          </BentoCard>

          {/* 5. YESTERDAY'S DEBRIEF (1x1) */}
          <BentoCard delay={0.4}>
            <div className="flex items-center gap-2 mb-4">
               <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
               <span className="text-[10px] font-bold text-zinc-400 uppercase">Débrief Veille</span>
            </div>
            <p className="font-display font-bold text-zinc-900 leading-tight">Run Endurance 10km :</p>
            <p className="text-xs text-zinc-500 mt-1">Exécution parfaite des zones. TSS collecté : 48 (prévu 45).</p>
            <div className="mt-4 flex items-center gap-1 text-emerald-600 font-mono text-[10px] font-bold">
               <TrendingUp size={12} /> COMPLIANCE 98%
            </div>
          </BentoCard>

          {/* 6. COMPLIANCE GRAPH (1x1) */}
          <BentoCard delay={0.5}>
            <span className="text-[10px] font-bold text-zinc-400 uppercase mb-4">Volume Hebdo</span>
            <div className="flex items-end justify-between flex-1 gap-2">
               {[
                 { color: 'bg-cyan-500', h: '60%' },
                 { color: 'bg-brand-red', h: '30%' },
                 { color: 'bg-amber-400', h: '85%' }
               ].map((bar, i) => (
                 <div key={i} className="flex-1 bg-zinc-50 rounded-t-lg relative group h-20">
                    <motion.div 
                      initial={{ height: 0 }}
                      animate={{ height: bar.h }}
                      className={`absolute bottom-0 w-full ${bar.color} rounded-t-lg opacity-80 group-hover:opacity-100 transition-opacity`}
                    />
                 </div>
               ))}
            </div>
          </BentoCard>

          {/* 7. FORM (TSB) GAUGE (1x1) */}
          <BentoCard delay={0.6} className="items-center justify-center text-center">
            <span className="text-[10px] font-bold text-zinc-400 uppercase mb-2">Forme (TSB)</span>
            <div className="relative">
               <h4 className="text-5xl font-mono font-bold text-emerald-500">-12</h4>
            </div>
            <p className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full mt-2 border border-emerald-100">
               ZONE PRODUCTIVE
            </p>
          </BentoCard>

          {/* 8. MACRO-CYCLE CONTEXT (1x1) */}
          <BentoCard delay={0.7} className="bg-zinc-100/50 border-dashed">
            <div className="flex flex-col h-full justify-between">
               <div>
                  <p className="text-[10px] font-bold text-zinc-400 uppercase">Phase Actuelle</p>
                  <p className="font-display font-bold text-zinc-900 text-xl">Build Phase 2</p>
               </div>
               <div>
                  <div className="flex justify-between text-[10px] font-mono font-bold text-zinc-400 mb-1 uppercase">
                     <span>Semaine 3/4</span>
                     <span>75%</span>
                  </div>
                  <div className="h-1.5 w-full bg-zinc-200 rounded-full overflow-hidden">
                     <div className="h-full bg-zinc-900 w-3/4 rounded-full" />
                  </div>
               </div>
            </div>
          </BentoCard>

        </div>
      </div>
    </div>
  );
}