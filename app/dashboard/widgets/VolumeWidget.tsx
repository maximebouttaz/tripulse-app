'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Activity, Waves, Bike, Footprints, AlertCircle, CheckCircle2 } from 'lucide-react';

// --- COMPOSANTS DE BASE ---

/**
 * Composant BentoCard intégré pour éviter les erreurs de résolution de fichiers externes.
 * Définit la structure visuelle standard pour les widgets TriCoach AI.
 */
const BentoCard = ({ children, className = "" }) => (
  <div className={`bg-white border border-zinc-200 shadow-sm hover:shadow-md transition-shadow rounded-[2rem] p-6 flex flex-col relative overflow-hidden ${className}`}>
    {children}
  </div>
);

// --- TYPES & DONNÉES ---

const weeklyData = [
  { sport: 'swim', planned: 120, completed: 100, color: '#06b6d4' }, // 83% (Cyan)
  { sport: 'bike', planned: 300, completed: 310, color: '#ef4444' }, // 103% (Rouge)
  { sport: 'run', planned: 180, completed: 90, color: '#f59e0b' },  // 50% (Ambre)
];

// --- COMPOSANT ANNEAU SVG ---

const Ring = ({ radius, stroke, progress, color, delay }) => {
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (Math.min(progress, 100) / 100) * circumference;

  return (
    <>
      {/* Fond de l'anneau (Gris très clair) */}
      <circle
        stroke="#f4f4f5"
        strokeWidth={stroke}
        fill="transparent"
        r={normalizedRadius}
        cx="50%"
        cy="50%"
      />
      {/* Anneau de progression coloré */}
      <motion.circle
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        fill="transparent"
        r={normalizedRadius}
        cx="50%"
        cy="50%"
        style={{ strokeDasharray: circumference + ' ' + circumference }}
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset }}
        transition={{ duration: 1.5, delay, ease: "easeOut" }}
      />
    </>
  );
};

// --- WIDGET DE DISCIPLINE ---

export function ComplianceWidget() {
  const totalPlanned = weeklyData.reduce((acc, curr) => acc + curr.planned, 0);
  const totalCompleted = weeklyData.reduce((acc, curr) => acc + curr.completed, 0);
  const globalScore = Math.round((totalCompleted / totalPlanned) * 100);

  const getMessage = (score) => {
    if (score >= 90) return { text: "Discipline de Fer", icon: CheckCircle2, color: "text-emerald-500" };
    if (score >= 75) return { text: "Bonne semaine", icon: Activity, color: "text-zinc-500" };
    return { text: "Relâchement détecté", icon: AlertCircle, color: "text-rose-500" };
  };

  const status = getMessage(globalScore);
  const StatusIcon = status.icon;

  return (
    <BentoCard className="flex flex-col justify-between relative overflow-hidden max-w-md">
      {/* En-tête du Widget */}
      <div className="flex justify-between items-start mb-2 z-10">
         <div>
            <h3 className="font-bold text-zinc-900 text-sm italic uppercase tracking-tight">Discipline</h3>
            <p className="text-[10px] text-zinc-400 font-mono font-bold uppercase">Respect du plan</p>
         </div>
         <div className={`flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-1 rounded-full bg-white border border-zinc-100 shadow-sm ${status.color}`}>
            <StatusIcon size={12} />
            {status.text}
         </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-6 mt-4">
        
        {/* Graphique des Anneaux */}
        <div className="relative w-28 h-28 flex-shrink-0">
           <svg height="100%" width="100%" className="-rotate-90">
              <Ring radius={54} stroke={4} progress={(weeklyData[1].completed / weeklyData[1].planned) * 100} color={weeklyData[1].color} delay={0.2} />
              <Ring radius={42} stroke={4} progress={(weeklyData[2].completed / weeklyData[2].planned) * 100} color={weeklyData[2].color} delay={0.4} />
              <Ring radius={30} stroke={4} progress={(weeklyData[0].completed / weeklyData[0].planned) * 100} color={weeklyData[0].color} delay={0.6} />
           </svg>
           
           <div className="absolute inset-0 flex items-center justify-center flex-col">
              {/* L'affichage du score central a été retiré pour un look plus épuré */}
           </div>
        </div>

        {/* Légende et Détails */}
        <div className="flex-1 w-full space-y-3">
           {weeklyData.map((d) => {
              const percent = Math.round((d.completed / d.planned) * 100);
              const Icons = { swim: Waves, bike: Bike, run: Footprints };
              const Icon = Icons[d.sport];
              
              return (
                 <div key={d.sport} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                       <div className={`p-1.5 rounded-lg bg-zinc-50 text-zinc-400 border border-zinc-100`}>
                          <Icon size={12} />
                       </div>
                       <span className="font-bold text-zinc-700 capitalize italic uppercase text-[10px] tracking-wider">{d.sport}</span>
                    </div>
                    <div className="flex items-center gap-2">
                       <span className="text-[9px] text-zinc-400 font-mono font-bold">{d.completed}/{d.planned}min</span>
                       <span className={`font-mono font-black w-8 text-right ${percent < 80 ? 'text-zinc-400' : 'text-zinc-900'}`}>
                          {percent}%
                       </span>
                    </div>
                 </div>
              )
           })}
        </div>
      </div>
    </BentoCard>
  );
}

// --- POINT D'ENTRÉE DE L'APPLICATION ---

export default function App() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6">
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-6">
        <ComplianceWidget />
        {/* Placeholder pour d'autres widgets du Design System */}
        <div className="hidden md:flex items-center justify-center border-2 border-dashed border-zinc-100 rounded-[2rem] text-zinc-300 font-bold uppercase italic text-sm tracking-widest">
          Widget Space
        </div>
      </div>
    </div>
  );
}