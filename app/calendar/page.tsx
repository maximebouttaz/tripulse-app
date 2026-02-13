'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  ChevronLeft, ChevronRight, MoreHorizontal, 
  CheckCircle2, Circle, Clock, MapPin
} from 'lucide-react';

// --- DONNÉES FICTIVES (SEMAINE TYPE) ---
const weekDays = [
  { day: 'Lun', date: '12', isToday: false },
  { day: 'Mar', date: '13', isToday: false },
  { day: 'Mer', date: '14', isToday: true }, // Aujourd'hui
  { day: 'Jeu', date: '15', isToday: false },
  { day: 'Ven', date: '16', isToday: false },
  { day: 'Sam', date: '17', isToday: false },
  { day: 'Dim', date: '18', isToday: false },
];

const workouts = [
  { 
    id: 1, day: 'Lun', type: 'swim', title: 'Technique Drills', 
    duration: '45min', tss: '30', status: 'completed' 
  },
  { 
    id: 2, day: 'Mar', type: 'run', title: 'VMA Courte', 
    duration: '1h00', tss: '65', status: 'completed' 
  },
  { 
    id: 3, day: 'Mer', type: 'bike', title: 'Threshold Intervals', 
    duration: '1h30', tss: '90', status: 'upcoming' // La séance du jour
  },
  { 
    id: 4, day: 'Jeu', type: 'swim', title: 'Endurance Aéro', 
    duration: '1h15', tss: '55', status: 'planned' 
  },
  { 
    id: 5, day: 'Ven', type: 'rest', title: 'Récupération Active', 
    duration: '30min', tss: '5', status: 'planned' 
  },
  { 
    id: 6, day: 'Sam', type: 'bike', title: 'Long Ride Hills', 
    duration: '3h30', tss: '180', status: 'planned' 
  },
  { 
    id: 7, day: 'Sam', type: 'run', title: 'Brick Run (Enchaînement)', 
    duration: '30min', tss: '25', status: 'planned' 
  },
  { 
    id: 8, day: 'Dim', type: 'run', title: 'Sortie Longue', 
    duration: '1h45', tss: '110', status: 'planned' 
  },
];

// --- COMPOSANT CARTE SÉANCE ---
const WorkoutCard = ({ workout }: any) => {
  // Définition des styles selon le sport
  const styles: any = {
    swim: { bg: 'bg-cyan-50', border: 'border-cyan-100', text: 'text-cyan-700', bar: 'bg-cyan-500' },
    bike: { bg: 'bg-red-50', border: 'border-red-100', text: 'text-red-700', bar: 'bg-red-500' },
    run:  { bg: 'bg-amber-50', border: 'border-amber-100', text: 'text-amber-700', bar: 'bg-amber-500' },
    rest: { bg: 'bg-zinc-100', border: 'border-zinc-200', text: 'text-zinc-500', bar: 'bg-zinc-400' },
  };

  const style = styles[workout.type];
  const isCompleted = workout.status === 'completed';

  return (
    <motion.div 
      whileHover={{ y: -2, scale: 1.02 }}
      className={`
        relative p-3 rounded-2xl mb-3 border transition-all cursor-pointer group
        ${isCompleted ? 'opacity-60 grayscale-[0.5] hover:opacity-100 hover:grayscale-0' : 'shadow-sm'}
        ${style.bg} ${style.border}
      `}
    >
      {/* Barre de couleur latérale */}
      <div className={`absolute left-0 top-3 bottom-3 w-1 rounded-r-full ${style.bar}`} />
      
      <div className="pl-3">
        <div className="flex justify-between items-start mb-1">
          <span className={`text-[10px] font-bold uppercase tracking-wider ${style.text}`}>
            {workout.type}
          </span>
          {isCompleted && <CheckCircle2 size={12} className="text-emerald-500" />}
        </div>
        
        <h4 className="font-display font-bold text-zinc-900 text-sm leading-tight mb-2">
          {workout.title}
        </h4>
        
        <div className="flex items-center gap-3 text-zinc-500">
           <div className="flex items-center gap-1 text-[10px] font-mono">
             <Clock size={10} /> {workout.duration}
           </div>
           <div className="flex items-center gap-1 text-[10px] font-mono">
             <span className="font-bold">TSS</span> {workout.tss}
           </div>
        </div>
      </div>
    </motion.div>
  );
};

export default function CalendarPage() {
  return (
    <div className="min-h-screen bg-zinc-50 p-6 md:p-10 pb-24">
      <div className="max-w-7xl mx-auto h-full flex flex-col">
        
        {/* HEADER DU PLANNING */}
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold text-zinc-900">Planning</h1>
            <p className="text-zinc-500 text-sm">Février 2026 • Semaine 7 (Build)</p>
          </div>
          
          <div className="flex gap-2">
            <button className="p-2 rounded-full hover:bg-zinc-200 text-zinc-500">
              <ChevronLeft size={20} />
            </button>
            <button className="px-4 py-2 bg-zinc-900 text-white rounded-full text-sm font-bold shadow-lg">
              Aujourd'hui
            </button>
            <button className="p-2 rounded-full hover:bg-zinc-200 text-zinc-500">
              <ChevronRight size={20} />
            </button>
          </div>
        </header>

        {/* GRILLE SEMAINE (Desktop: 7 colonnes / Mobile: Stack vertical) */}
        <div className="grid grid-cols-1 md:grid-cols-7 gap-4 h-full">
          {weekDays.map((day, index) => (
            <div key={index} className="flex flex-col h-full min-h-[300px]">
              
              {/* En-tête du jour */}
              <div className={`
                flex flex-col items-center justify-center py-4 rounded-t-2xl border-x border-t border-zinc-200
                ${day.isToday ? 'bg-zinc-900 text-white shadow-lg z-10 scale-105 rounded-b-lg' : 'bg-white text-zinc-400'}
              `}>
                <span className="text-xs font-bold uppercase tracking-widest opacity-80">{day.day}</span>
                <span className="text-xl font-mono font-bold">{day.date}</span>
              </div>

              {/* Colonne du jour (Zone de drop des séances) */}
              <div className={`
                flex-1 p-2 border-x border-b border-zinc-200/50 rounded-b-2xl bg-white/40
                ${day.isToday ? 'bg-blue-50/30 border-blue-100' : ''}
              `}>
                {/* On filtre les séances de ce jour */}
                {workouts
                  .filter(w => w.day === day.day)
                  .map(workout => (
                    <WorkoutCard key={workout.id} workout={workout} />
                  ))
                }
                
                {/* Bouton "+" pour ajouter (visible au survol sur Desktop) */}
                <div className="h-full min-h-[50px] flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity group cursor-pointer">
                  <div className="w-8 h-8 rounded-full bg-zinc-100 text-zinc-400 flex items-center justify-center hover:bg-brand-red hover:text-white transition-colors">
                    +
                  </div>
                </div>
              </div>

            </div>
          ))}
        </div>

      </div>
    </div>
  );
}