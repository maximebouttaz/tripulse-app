'use client';

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  MapPin, Target, Activity, ArrowRight, Calendar, Flag
} from 'lucide-react';

/**
 * Composant BentoCard intégré.
 */
const BentoCard = ({ children, className = "" }) => (
  <div className={`bg-white border border-zinc-200 shadow-sm hover:shadow-md transition-shadow rounded-[2rem] p-6 flex flex-col relative overflow-hidden ${className}`}>
    {children}
  </div>
);

// --- CONFIGURATION ---
const RACE_CONFIG = {
  name: "Ironman France Nice",
  raceDate: "2026-06-28",
  startDate: "2026-01-01",
  location: "Nice, FR",
  targetTimeVal: 660, // 11h00
  startTimeVal: 840,  // 14h00
  image: "https://images.unsplash.com/photo-1596726245385-e3669d2eb05b?q=80&w=2070&auto=format&fit=crop"
};

// --- HELPERS ---
const minutesToTime = (minutes) => {
  const h = Math.floor(minutes / 60);
  const m = Math.floor(minutes % 60);
  return `${h}h${m.toString().padStart(2, '0')}`;
};

const getMonthName = (date) => {
  return new Intl.DateTimeFormat('fr-FR', { month: 'short' }).format(date);
};

// Génération déterministe de la courbe de progression
// Retourne un tableau de points {x, y} où y est normalisé (0 à 1)
const generateCurveData = () => {
  const points = [];
  const totalPoints = 20;
  for (let i = 0; i <= totalPoints; i++) {
    const x = (i / totalPoints) * 100;
    // Formule simulant une progression non-linéaire avec des micro-cycles (plateaux/fatigue)
    // Progression de base (logarithmique inversée) + Sinus pour les cycles
    const progress = x / 100;
    const baseCurve = 1 - Math.pow(progress, 0.6); 
    const microCycle = Math.sin(progress * Math.PI * 4) * 0.05 * (1 - progress); // Moins de variation à la fin
    
    // On clamp entre 0 et 1 (1 = Départ/Lent, 0 = Target/Rapide)
    const y = Math.max(0, Math.min(1, baseCurve + microCycle));
    points.push({ x, y });
  }
  return points;
};

export const RacePredictionWidget = () => {
  const [progress, setProgress] = useState(75);
  const [isDragging, setIsDragging] = useState(false);

  // Données de la courbe (stables)
  const chartPoints = useMemo(() => generateCurveData(), []);

  // Conversion des points en chemin SVG "d"
  const chartPath = useMemo(() => {
    // Map x (0-100) -> SVG width (0-100%)
    // Map y (0-1) -> SVG height (0-100%).
    // LOGIQUE INVERSÉE : On veut que le "Départ" (y=1) soit en HAUT (SVG y faible)
    // et "Target" (y=0) soit en BAS (SVG y fort).
    
    const maxY = 40; // Hauteur max du graph utile
    
    const pathPoints = chartPoints.map(p => {
       const svgX = p.x;
       // p.y = 1 (Départ) -> doit être Top (5)
       // p.y = 0 (Target) -> doit être Bottom (45)
       // Formule : (1 - p.y) * maxY + 5  => NON, p.y va de 1 à 0.
       // Si p.y=1 (Départ), on veut Y=5. Si p.y=0 (Target), on veut Y=45.
       // Donc : (1 - p.y) * maxY + 5.
       // Wait: generateCurveData donne 1 au début et 0 à la fin.
       // Si on veut que la courbe DESCENDE :
       // Start (x=0) : p.y=1. On veut Y=5 (Haut).
       // End (x=100) : p.y=0. On veut Y=45 (Bas).
       // Calcul : (1 - p.y) * maxY + 5 ===> (1-1)*40+5 = 5. (1-0)*40+5 = 45.
       // C'est correct. Le code précédent faisait p.y * maxY + 5 (45 -> 5).
       
       const svgY = (1 - p.y) * maxY + 5; 
       return `${svgX},${svgY}`;
    });

    // Création d'une courbe lisse (Catmull-Rom ou simple L pour l'instant)
    const areaPath = `M0,50 L${pathPoints.join(' L')} L100,50 Z`;
    const linePath = `M${pathPoints[0]} L${pathPoints.slice(1).join(' L')}`;

    return { area: areaPath, line: linePath };
  }, [chartPoints]);

  const currentData = useMemo(() => {
    const start = new Date(RACE_CONFIG.startDate).getTime();
    const end = new Date(RACE_CONFIG.raceDate).getTime();
    const currentTimestamp = start + (end - start) * (progress / 100);
    const currentDate = new Date(currentTimestamp);
    
    const daysLeft = Math.ceil((end - currentTimestamp) / (1000 * 60 * 60 * 24));

    // Calcul de la valeur Y pour l'interpolation
    const pVal = progress / 100;
    const baseCurve = 1 - Math.pow(pVal, 0.6);
    const microCycle = Math.sin(pVal * Math.PI * 4) * 0.05 * (1 - pVal);
    const yFactor = Math.max(0, Math.min(1, baseCurve + microCycle));

    // Projection du temps : 1.0 (start) -> 0.0 (target)
    const totalDiff = RACE_CONFIG.startTimeVal - RACE_CONFIG.targetTimeVal;
    const currentFormMinutes = RACE_CONFIG.targetTimeVal + (totalDiff * yFactor);

    // Prédiction légèrement optimiste par rapport à la forme
    const predictedMinutes = currentFormMinutes - (10 * pVal);

    // Calcul du gain par rapport au début (pour afficher "Temps gagné")
    const timeGained = RACE_CONFIG.startTimeVal - currentFormMinutes;

    return {
      dateLabel: getMonthName(currentDate),
      fullDate: currentDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' }),
      daysLeft: Math.max(0, daysLeft),
      formTime: minutesToTime(currentFormMinutes),
      predictedTime: minutesToTime(predictedMinutes),
      timeGainedMinutes: Math.floor(timeGained),
      isPast: progress < 75
    };
  }, [progress]);

  return (
    <div className="p-8 bg-zinc-50 min-h-screen flex items-center justify-center">
      <BentoCard className="max-w-xl w-full md:col-span-2 relative overflow-hidden group min-h-[420px] !p-0 border-0 shadow-2xl">
        
        {/* 1. IMAGE DE FOND */}
        <div className="absolute inset-0 z-0">
          <img 
            src={RACE_CONFIG.image} 
            alt="Fond de course" 
            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105 filter brightness-[0.5]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-zinc-900/60 to-black/30" />
        </div>

        {/* 2. CONTENU */}
        <div className="relative z-10 p-6 flex flex-col h-full justify-between text-white">
          
          {/* HEADER */}
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2 mb-1">
                 <div className="bg-red-600/90 backdrop-blur px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest text-white shadow-lg">
                    A-Race
                 </div>
                 <span className="text-xs font-medium text-zinc-300 flex items-center gap-1">
                    <MapPin size={10} /> {RACE_CONFIG.location}
                 </span>
              </div>
              <h3 className="font-bold text-xl leading-tight uppercase italic">{RACE_CONFIG.name}</h3>
            </div>
            <div className="text-right">
               <div className="text-4xl font-black tracking-tighter text-white tabular-nums">
                  J-{currentData.daysLeft}
               </div>
               <p className="text-[10px] text-zinc-400 uppercase tracking-widest font-bold">
                 {currentData.fullDate}
               </p>
            </div>
          </div>

          {/* MAIN STATS */}
          <div className="flex flex-col items-center justify-center py-4">
             <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">
                  Temps Estimé
                </span>
             </div>
             <motion.span 
               className="text-6xl font-mono font-bold tracking-tighter text-white drop-shadow-xl tabular-nums"
             >
                {currentData.predictedTime}
             </motion.span>
             
             {/* Badge Temps Gagné */}
             <div className="mt-2 flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm">
                <Activity size={12} className="text-emerald-400" />
                <span className="text-xs font-medium text-zinc-300">
                   Gain cumulé : <span className="text-white font-bold">{minutesToTime(currentData.timeGainedMinutes).replace('h', 'h ')}</span>
                </span>
             </div>
          </div>

          {/* ZONE GRAPHIQUE INTERACTIVE */}
          <div className="bg-black/40 backdrop-blur-xl rounded-2xl p-5 border border-white/10 shadow-inner select-none relative">
             
             <div className="flex justify-between text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-4">
               <span>Jan</span>
               <span>Progression (Chrono)</span>
               <span>Juin</span>
             </div>

             {/* CHART CONTAINER */}
             <div className="relative h-24 w-full group cursor-crosshair">
                
                {/* SVG CHART */}
                <svg viewBox="0 0 100 50" preserveAspectRatio="none" className="w-full h-full overflow-visible">
                   <defs>
                      <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                         <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
                         <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                      </linearGradient>
                   </defs>
                   
                   {/* Area Fill */}
                   <path d={chartPath.area} fill="url(#chartGradient)" />
                   
                   {/* Stroke Line */}
                   <path d={chartPath.line} fill="none" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
                   
                   {/* Ligne de Départ (Start) - EN HAUT (Y=5) - Chrono Lent */}
                   <line x1="0" y1="5" x2="100" y2="5" stroke="#71717a" strokeWidth="1" strokeDasharray="2 2" opacity="0.6" vectorEffect="non-scaling-stroke" />
                   
                   {/* Ligne d'objectif (Target) - EN BAS (Y=45) - Chrono Rapide */}
                   <line x1="0" y1="45" x2="100" y2="45" stroke="#fbbf24" strokeWidth="1" strokeDasharray="2 2" opacity="0.5" vectorEffect="non-scaling-stroke" />

                </svg>

                {/* INTERACTIVE CURSOR (VERTICAL LINE) */}
                <motion.div 
                   className="absolute top-0 bottom-0 w-px bg-white/50 pointer-events-none z-10"
                   style={{ left: `${progress}%` }}
                />

                {/* INTERACTIVE DOT ON CURVE */}
                <motion.div
                   className="absolute w-3 h-3 bg-white rounded-full border-2 border-emerald-500 shadow-[0_0_10px_#10b981] z-20 pointer-events-none transform -translate-x-1/2 -translate-y-1/2"
                   style={{ 
                     left: `${progress}%`,
                     // Inversion de la logique de positionnement du point
                     // Gain faible (Début) -> Top (10%). Gain fort (Fin) -> Bottom (90%).
                     top: `${(currentData.timeGainedMinutes / (RACE_CONFIG.startTimeVal - RACE_CONFIG.targetTimeVal)) * 80 + 10}%` 
                   }}
                />

                {/* HIDDEN INPUT FOR INTERACTION */}
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  step="0.1"
                  value={progress} 
                  onChange={(e) => setProgress(Number(e.target.value))}
                  onMouseDown={() => setIsDragging(true)}
                  onMouseUp={() => setIsDragging(false)}
                  onTouchStart={() => setIsDragging(true)}
                  onTouchEnd={() => setIsDragging(false)}
                  className="absolute inset-0 w-full h-full opacity-0 z-30 cursor-crosshair"
                />
             </div>

             {/* Footer Labels - Layout 3 Colonnes */}
             <div className="flex justify-between items-end mt-2 pt-2 border-t border-white/5">
                
                {/* 1. START (Left) - Forme de Départ */}
                <div className="text-left w-1/3">
                   <div className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mb-0.5 flex items-center gap-1">
                      <Flag size={10} /> Départ
                   </div>
                   <div className="font-mono font-bold text-base text-zinc-500 tabular-nums">{minutesToTime(RACE_CONFIG.startTimeVal)}</div>
                </div>

                {/* 2. CURRENT (Middle) - Forme Dynamique */}
                <div className="text-center w-1/3">
                   <div className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider mb-0.5">Forme {currentData.dateLabel}</div>
                   <div className="font-mono font-bold text-base text-zinc-200 tabular-nums">{currentData.formTime}</div>
                </div>

                {/* 3. TARGET (Right) - Objectif */}
                <div className="text-right w-1/3">
                   <div className="text-[10px] text-amber-500/80 uppercase font-bold tracking-wider mb-0.5 flex items-center justify-end gap-1">
                      Target <Target size={10} />
                   </div>
                   <div className="font-mono font-bold text-base text-amber-400 tabular-nums">{minutesToTime(RACE_CONFIG.targetTimeVal)}</div>
                </div>
             </div>

          </div>

        </div>
      </BentoCard>
    </div>
  );
};

export default RacePredictionWidget;