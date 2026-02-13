'use client';

import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Clock, Zap, X, Shuffle, ChevronLeft, ChevronRight,
  GripVertical, MoreHorizontal, Loader2, Activity,
  Waves, Bike, CalendarDays
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

// --- HELPERS DATES ---
const DAY_LABELS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const MONTH_NAMES = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
const MONTH_NAMES_FULL = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

function getMonday(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

function addDays(d: Date, n: number): Date {
  const date = new Date(d);
  date.setDate(date.getDate() + n);
  return date;
}

function toDateKey(d: Date): string {
  return d.toISOString().split('T')[0];
}

function getWeekNumber(d: Date): number {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

function getWeekDays(weekOffset: number): { dayLabel: string; date: Date; dateKey: string }[] {
  const today = new Date();
  const monday = getMonday(today);
  const weekStart = addDays(monday, weekOffset * 7);
  return DAY_LABELS.map((label, i) => {
    const date = addDays(weekStart, i);
    return { dayLabel: label, date, dateKey: toDateKey(date) };
  });
}

// --- TYPES ---
type Workout = {
  id: number;
  dateKey: string;
  type: string;
  title: string;
  duration: string;
  durationMin: number;
  tss: number;
  status: 'completed' | 'upcoming' | 'planned';
  details: { warmup: string; main: string; cooldown: string };
};

function rowToWorkout(row: any): Workout {
  return {
    id: row.id,
    dateKey: row.date,
    type: row.type,
    title: row.title,
    duration: row.duration,
    durationMin: row.duration_min,
    tss: row.tss,
    status: row.status,
    details: {
      warmup: row.warmup || '',
      main: row.main_set || '',
      cooldown: row.cooldown || '',
    },
  };
}

// --- STYLES PAR SPORT (cohérent avec le guide page.tsx) ---
const typeStyles: Record<string, { bg: string; text: string; border: string; accent: string; icon: any; label: string }> = {
  swim: { bg: 'bg-cyan-50', text: 'text-cyan-600', border: 'border-cyan-100', accent: 'bg-cyan-500', icon: Waves, label: 'SWIM' },
  bike: { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-100', accent: 'bg-red-500', icon: Bike, label: 'BIKE' },
  run: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-100', accent: 'bg-amber-500', icon: Activity, label: 'RUN' },
  strength: { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-100', accent: 'bg-purple-500', icon: Zap, label: 'FORCE' },
  rest: { bg: 'bg-zinc-50', text: 'text-zinc-400', border: 'border-zinc-200', accent: 'bg-zinc-300', icon: Clock, label: 'REPOS' },
};

// --- SPORT BADGE (identique au guide) ---
const SportBadge = ({ type }: { type: string }) => {
  const s = typeStyles[type] || typeStyles.rest;
  const Icon = s.icon;
  return (
    <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-lg ${s.bg} border ${s.border}`}>
      <Icon size={10} className={s.text} />
      <span className={`text-[8px] font-mono font-bold tracking-widest ${s.text}`}>{s.label}</span>
    </div>
  );
};

export default function CalendarElitePage() {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null);
  const [isAdapting, setIsAdapting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const todayKey = useMemo(() => toDateKey(today), [today]);
  const weekDays = useMemo(() => getWeekDays(weekOffset), [weekOffset]);
  const weekNumber = useMemo(() => getWeekNumber(weekDays[0].date), [weekDays]);

  const headerTitle = useMemo(() => {
    const firstMonth = weekDays[0].date.getMonth();
    const lastMonth = weekDays[6].date.getMonth();
    const year = weekDays[6].date.getFullYear();
    if (firstMonth === lastMonth) {
      return `${MONTH_NAMES_FULL[firstMonth]} ${year}`;
    }
    return `${MONTH_NAMES[firstMonth]} – ${MONTH_NAMES[lastMonth]} ${year}`;
  }, [weekDays]);

  // Stats de la semaine
  const weekStats = useMemo(() => {
    const totalTSS = workouts.reduce((sum, w) => sum + (w.tss || 0), 0);
    const totalMin = workouts.reduce((sum, w) => sum + (w.durationMin || 0), 0);
    const count = workouts.length;
    return { totalTSS, totalMin, count };
  }, [workouts]);

  // --- FETCH WORKOUTS DEPUIS SUPABASE ---
  useEffect(() => {
    const fetchWorkouts = async () => {
      setIsLoading(true);
      const startDate = weekDays[0].dateKey;
      const endDate = weekDays[6].dateKey;

      const { data, error } = await supabase
        .from('workouts')
        .select('*')
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date');

      if (error) {
        console.error('Erreur fetch workouts:', error);
      } else {
        setWorkouts((data || []).map(rowToWorkout));
      }
      setIsLoading(false);
    };

    fetchWorkouts();
  }, [weekDays]);

  // --- LOGIQUE DRAG & DROP ---
  const [dragState, setDragState] = useState<any>(null);
  const [dropTarget, setDropTarget] = useState<string | null>(null);
  const columnRefs = useRef<Record<string, HTMLElement>>({});
  const cardRefs = useRef<Record<number, HTMLElement>>({});

  const setColumnRef = useCallback((dateKey: string, el: HTMLElement | null) => {
    if (el) columnRefs.current[dateKey] = el;
  }, []);

  const findDropTarget = useCallback((clientX: number, clientY: number) => {
    for (const [dateKey, el] of Object.entries(columnRefs.current)) {
      const rect = el.getBoundingClientRect();
      if (clientX >= rect.left && clientX <= rect.right && clientY >= rect.top - 40 && clientY <= rect.bottom + 40) {
        return dateKey;
      }
    }
    return null;
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent, workoutId: number) => {
    e.preventDefault();
    const startX = e.clientX;
    const startY = e.clientY;
    setDragState({ workoutId, startX, startY, currentX: startX, currentY: startY, isDragging: false });
  }, []);

  useEffect(() => {
    if (!dragState) return;
    const DRAG_THRESHOLD = 5;

    const handlePointerMove = (e: PointerEvent) => {
      e.preventDefault();
      const dx = e.clientX - dragState.startX;
      const dy = e.clientY - dragState.startY;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (!dragState.isDragging && distance < DRAG_THRESHOLD) return;

      setDragState((prev: any) => ({ ...prev, currentX: e.clientX, currentY: e.clientY, isDragging: true }));
      const target = findDropTarget(e.clientX, e.clientY);
      setDropTarget(target);
    };

    const handlePointerUp = async () => {
      if (dragState.isDragging && dropTarget) {
        setWorkouts(prev => prev.map(w => w.id === dragState.workoutId ? { ...w, dateKey: dropTarget } : w));
        const { error } = await supabase
          .from('workouts')
          .update({ date: dropTarget })
          .eq('id', dragState.workoutId);
        if (error) console.error('Erreur update workout:', error);
      } else if (!dragState.isDragging) {
        const w = workouts.find(w => w.id === dragState.workoutId);
        if (w) setSelectedWorkout(w);
      }
      setDragState(null);
      setDropTarget(null);
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: false });
    window.addEventListener('pointerup', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [dragState, dropTarget, findDropTarget, workouts]);

  const goToPrevWeek = () => setWeekOffset(prev => prev - 1);
  const goToNextWeek = () => setWeekOffset(prev => prev + 1);
  const goToToday = () => setWeekOffset(0);

  const handleAdapt = async () => {
    setIsAdapting(true);
    const dateKeys = weekDays.map(d => d.dateKey);
    const updates = workouts.map(w => ({
      id: w.id,
      newDate: dateKeys[Math.floor(Math.random() * dateKeys.length)],
    }));

    setWorkouts(prev => prev.map(w => {
      const u = updates.find(u => u.id === w.id);
      return u ? { ...w, dateKey: u.newDate } : w;
    }));

    await Promise.all(
      updates.map(u =>
        supabase.from('workouts').update({ date: u.newDate }).eq('id', u.id)
      )
    );
    setIsAdapting(false);
  };

  const draggingWorkout = dragState?.isDragging ? workouts.find(w => w.id === dragState.workoutId) : null;

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col h-screen overflow-hidden pb-20 md:pb-0 relative">

      {/* Background Orbs (comme le showcase du guide) */}
      <div className="fixed top-[-15%] left-[-5%] w-[400px] h-[400px] bg-red-500/[0.03] blur-[100px] rounded-full pointer-events-none" />
      <div className="fixed bottom-[-15%] right-[-5%] w-[400px] h-[400px] bg-cyan-500/[0.03] blur-[100px] rounded-full pointer-events-none" />

      {/* HEADER — Glass style cohérent */}
      <header className="flex-none px-6 py-5 flex justify-between items-center backdrop-blur-xl bg-white/70 border-b border-white/60 relative z-10">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-gradient-to-br from-red-600 to-rose-600 rounded-xl shadow-lg shadow-red-500/20">
            <CalendarDays size={18} className="text-white" />
          </div>
          <div>
            <h1 className="font-display font-bold text-2xl tracking-tight text-zinc-900">Planning</h1>
            <p className="text-xs font-mono text-zinc-400 mt-0.5">
              Semaine {weekNumber}
              {weekOffset !== 0 && (
                <button onClick={goToToday} className="ml-2 text-red-600 font-bold hover:underline underline-offset-2 transition">
                  Aujourd&apos;hui
                </button>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Week Stats Pills */}
          {!isLoading && weekStats.count > 0 && (
            <div className="hidden md:flex items-center gap-3">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/50 border border-zinc-200 text-xs">
                <Zap size={12} className="text-amber-500" />
                <span className="font-mono font-bold text-zinc-700">{weekStats.totalTSS}</span>
                <span className="text-zinc-400 font-medium">TSS</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/50 border border-zinc-200 text-xs">
                <Clock size={12} className="text-zinc-400" />
                <span className="font-mono font-bold text-zinc-700">
                  {weekStats.totalMin >= 60 ? `${Math.floor(weekStats.totalMin / 60)}h${(weekStats.totalMin % 60).toString().padStart(2, '0')}` : `${weekStats.totalMin}min`}
                </span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/50 border border-zinc-200 text-xs">
                <span className="font-mono font-bold text-zinc-700">{weekStats.count}</span>
                <span className="text-zinc-400 font-medium">séances</span>
              </div>
            </div>
          )}

          {/* Navigation semaine */}
          <div className="flex items-center gap-1 bg-white/50 border border-zinc-200 p-1 rounded-2xl shadow-sm">
            <button onClick={goToPrevWeek} className="p-2 hover:bg-zinc-100 rounded-xl text-zinc-500 transition">
              <ChevronLeft size={16}/>
            </button>
            <span className="font-display font-bold text-zinc-900 text-sm px-3">{headerTitle}</span>
            <button onClick={goToNextWeek} className="p-2 hover:bg-zinc-100 rounded-xl text-zinc-500 transition">
              <ChevronRight size={16}/>
            </button>
          </div>
        </div>
      </header>

      {/* GRILLE SEMAINE */}
      <div className="flex-1 overflow-auto p-4 md:p-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full gap-3">
            <Loader2 size={28} className="animate-spin text-zinc-300" />
            <span className="text-xs font-display font-medium text-zinc-400">Chargement du planning...</span>
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-3 min-w-[900px] h-full">
            {weekDays.map(({ dayLabel, date, dateKey }) => {
              const isToday = dateKey === todayKey;
              const isDropHover = dropTarget === dateKey && dragState?.isDragging;
              const dayWorkouts = workouts.filter(w => w.dateKey === dateKey);
              const dayTSS = dayWorkouts.reduce((s, w) => s + (w.tss || 0), 0);

              return (
                <div key={dateKey} className="flex flex-col h-full">

                  {/* En-tête Jour — Style Glass */}
                  <div className={`
                    text-center pb-3 mb-3 rounded-2xl px-2 pt-2 transition-all
                    ${isToday ? 'bg-zinc-900 shadow-lg shadow-zinc-900/20' : ''}
                  `}>
                    <span className={`text-[10px] font-bold uppercase tracking-widest ${isToday ? 'text-zinc-400' : 'text-zinc-400'}`}>
                      {dayLabel}
                    </span>
                    <div className={`
                      mx-auto w-9 h-9 flex items-center justify-center rounded-xl text-sm font-mono font-bold mt-1 transition-all
                      ${isToday ? 'bg-gradient-to-br from-red-600 to-rose-600 text-white shadow-md shadow-red-500/30' : 'text-zinc-900'}
                    `}>
                      {date.getDate()}
                    </div>
                    {dayTSS > 0 && (
                      <p className={`text-[9px] font-mono font-bold mt-1 ${isToday ? 'text-zinc-500' : 'text-zinc-300'}`}>
                        {dayTSS} TSS
                      </p>
                    )}
                  </div>

                  {/* Colonne Drop Zone — Glass Card */}
                  <div
                    ref={(el) => setColumnRef(dateKey, el)}
                    className={`
                      flex-1 rounded-2xl p-1.5 relative transition-all duration-200
                      ${isDropHover
                        ? 'bg-red-50/50 ring-2 ring-red-200 ring-dashed shadow-inner'
                        : 'bg-white/30 backdrop-blur-sm border border-white/40'
                      }
                    `}
                  >
                    {/* Cartes Workout */}
                    <div className="relative z-10 flex flex-col gap-2">
                      {dayWorkouts.map(workout => {
                        const s = typeStyles[workout.type] || typeStyles.rest;
                        const height = Math.max(64, workout.durationMin * 1.6);
                        const isDragSource = dragState?.isDragging && dragState.workoutId === workout.id;

                        return (
                          <motion.div
                            key={workout.id}
                            ref={el => { if (el) cardRefs.current[workout.id] = el; }}
                            onPointerDown={(e) => handlePointerDown(e, workout.id)}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: isDragSource ? 0.3 : 1, y: 0, scale: isDragSource ? 0.95 : 1 }}
                            transition={{ duration: 0.3 }}
                            className={`
                              relative w-full rounded-2xl p-3 cursor-grab active:cursor-grabbing
                              backdrop-blur-xl bg-white/70 border shadow-sm shadow-zinc-200/50
                              hover:shadow-md hover:border-zinc-200 transition-all
                              flex flex-col justify-between select-none touch-none
                              ${s.border}
                              ${isDragSource ? 'grayscale' : ''}
                            `}
                            style={{ minHeight: height }}
                          >
                            {/* Barre couleur sport en haut */}
                            <div className={`absolute top-0 left-3 right-3 h-[3px] rounded-b-full ${s.accent} opacity-60`} />

                            <div className="mt-1">
                              <div className="flex justify-between items-start">
                                <SportBadge type={workout.type} />
                                <div className="flex items-center gap-1">
                                  {workout.status === 'completed' && (
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
                                  )}
                                  <GripVertical size={12} className="text-zinc-300" />
                                </div>
                              </div>
                              <h4 className="font-display font-bold text-sm text-zinc-900 leading-tight mt-2">
                                {workout.title}
                              </h4>
                            </div>

                            <div className="flex items-center justify-between mt-auto pt-2">
                              <div className="flex items-center gap-1 text-[10px] font-mono text-zinc-400">
                                <Clock size={10} /> {workout.duration}
                              </div>
                              {workout.tss > 0 && (
                                <span className="text-[10px] font-mono font-bold text-zinc-300">
                                  {workout.tss} TSS
                                </span>
                              )}
                            </div>
                          </motion.div>
                        );
                      })}

                      {/* Empty day hint */}
                      {dayWorkouts.length === 0 && (
                        <div className="flex-1 flex items-center justify-center min-h-[80px]">
                          <span className="text-zinc-200 text-[10px] font-display font-medium">Repos</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* GHOST CARD (Drag) — Glass style */}
      {draggingWorkout && dragState?.isDragging && (() => {
        const s = typeStyles[draggingWorkout.type] || typeStyles.rest;
        const cardEl = cardRefs.current[draggingWorkout.id];
        const w = cardEl ? cardEl.offsetWidth : 140;
        const h = Math.max(64, draggingWorkout.durationMin * 1.6);
        return (
          <div
            className={`
              fixed z-50 rounded-2xl p-3 pointer-events-none flex flex-col justify-between
              backdrop-blur-xl bg-white/90 border shadow-2xl shadow-zinc-300/50
              ${s.border}
            `}
            style={{
              left: dragState.currentX - w / 2,
              top: dragState.currentY - 30,
              width: w,
              minHeight: h,
              transform: 'rotate(2deg) scale(1.05)',
            }}
          >
            <div className={`absolute top-0 left-3 right-3 h-[3px] rounded-b-full ${s.accent}`} />
            <div className="mt-1">
              <SportBadge type={draggingWorkout.type} />
              <h4 className="font-display font-bold text-sm text-zinc-900 leading-tight mt-2">{draggingWorkout.title}</h4>
            </div>
            <div className="flex items-center gap-1 text-[10px] font-mono text-zinc-400 mt-auto pt-2">
              <Clock size={10} /> {draggingWorkout.duration}
            </div>
          </div>
        );
      })()}

      {/* BOUTON ADAPT — Brand Gradient */}
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={handleAdapt}
        disabled={isAdapting}
        className="fixed bottom-24 right-6 md:bottom-10 md:right-10 px-5 py-4 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-2xl font-display font-bold shadow-2xl shadow-red-500/30 flex items-center gap-3 z-30 hover:shadow-red-500/40 transition-all"
      >
        <Shuffle size={18} className={isAdapting ? 'animate-spin' : ''} />
        {isAdapting ? 'Optimisation...' : 'Adapter le Plan'}
      </motion.button>

      {/* OVERLAY */}
      {selectedWorkout && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
          onClick={() => setSelectedWorkout(null)}
        />
      )}

      {/* SLIDE OVER — Glass Panel */}
      <div className={`
        fixed top-0 right-0 h-full w-full md:w-[480px]
        backdrop-blur-xl bg-white/95 border-l border-white/60
        shadow-2xl shadow-zinc-200/50 z-50 overflow-y-auto flex flex-col
        transition-transform duration-300 ease-out
        ${selectedWorkout ? 'translate-x-0' : 'translate-x-full'}
      `}>
        {selectedWorkout && (() => {
          const sw = selectedWorkout;
          const s = typeStyles[sw.type] || typeStyles.rest;
          const Icon = s.icon;
          return (
            <div className="p-8 flex flex-col h-full">
              {/* Close */}
              <button
                onClick={() => setSelectedWorkout(null)}
                className="absolute top-6 right-6 p-2.5 bg-zinc-100 rounded-xl hover:bg-zinc-200 transition"
              >
                <X size={18} />
              </button>

              {/* Header */}
              <div className="mt-6">
                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl ${s.bg} border ${s.border}`}>
                  <Icon size={14} className={s.text} />
                  <span className={`text-[10px] font-mono font-bold tracking-widest ${s.text}`}>{s.label}</span>
                </div>
                <h2 className="text-3xl font-display font-extrabold text-zinc-900 mt-4 tracking-tight leading-none">
                  {sw.title}
                </h2>
                <div className="flex items-center gap-4 mt-6">
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-zinc-50 border border-zinc-100">
                    <Clock size={14} className="text-zinc-400" />
                    <span className="font-mono font-bold text-sm text-zinc-700">{sw.duration}</span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-zinc-50 border border-zinc-100">
                    <Zap size={14} className="text-amber-500" />
                    <span className="font-mono font-bold text-sm text-zinc-700">{sw.tss} TSS</span>
                  </div>
                </div>
              </div>

              {/* Détails Séance */}
              <div className="mt-10 space-y-6 flex-1">
                {/* Warm Up */}
                {sw.details?.warmup && (
                  <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-400" />
                      <h3 className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Warm Up</h3>
                    </div>
                    <p className="font-display font-medium text-zinc-700 text-sm">{sw.details.warmup}</p>
                  </div>
                )}

                {/* Main Set */}
                {sw.details?.main && (
                  <div className={`p-5 rounded-2xl border-2 ${s.border} ${s.bg}`}>
                    <div className="flex items-center gap-2 mb-3">
                      <div className={`w-2 h-2 rounded-full ${s.accent}`} />
                      <h3 className={`text-[10px] font-bold uppercase tracking-widest ${s.text}`}>Main Set</h3>
                    </div>
                    <p className="font-display font-bold text-zinc-900 text-lg leading-snug">{sw.details.main}</p>
                  </div>
                )}

                {/* Cool Down */}
                {sw.details?.cooldown && (
                  <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 rounded-full bg-blue-400" />
                      <h3 className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Cool Down</h3>
                    </div>
                    <p className="font-display font-medium text-zinc-700 text-sm">{sw.details.cooldown}</p>
                  </div>
                )}
              </div>

              {/* Footer — Primary button style du guide */}
              <div className="mt-8 pt-6 border-t border-zinc-100 flex gap-3">
                <button className="flex-1 py-4 bg-zinc-900 text-white font-display font-bold rounded-2xl hover:bg-zinc-800 transition shadow-lg shadow-zinc-900/10 flex items-center justify-center gap-2">
                  <Activity size={18} />
                  Démarrer
                </button>
                <button className="p-4 border border-zinc-200 rounded-2xl hover:bg-zinc-50 text-zinc-400 transition">
                  <MoreHorizontal size={18} />
                </button>
              </div>
            </div>
          );
        })()}
      </div>

    </div>
  );
}
