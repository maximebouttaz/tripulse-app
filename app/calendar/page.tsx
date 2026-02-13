'use client';

import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import {
  Clock, Zap, X, Shuffle, ChevronLeft, ChevronRight,
  GripHorizontal, MoreHorizontal, Loader2
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

// Mapper une ligne Supabase → Workout
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

// Styles Tailwind mappés
const typeStyles: Record<string, { bg: string; text: string; border: string; accent: string }> = {
  swim: { bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200', accent: 'bg-cyan-500' },
  bike: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', accent: 'bg-red-500' },
  run: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', accent: 'bg-amber-500' },
  strength: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', accent: 'bg-purple-500' },
  rest: { bg: 'bg-zinc-50', text: 'text-zinc-500', border: 'border-zinc-200', accent: 'bg-zinc-400' },
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
        // Optimistic update
        setWorkouts(prev => prev.map(w => w.id === dragState.workoutId ? { ...w, dateKey: dropTarget } : w));
        // Persist dans Supabase
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

  // Navigation semaine
  const goToPrevWeek = () => setWeekOffset(prev => prev - 1);
  const goToNextWeek = () => setWeekOffset(prev => prev + 1);
  const goToToday = () => setWeekOffset(0);

  // Fonction Adapt/Shuffle
  const handleAdapt = async () => {
    setIsAdapting(true);
    const dateKeys = weekDays.map(d => d.dateKey);
    const updates = workouts.map(w => ({
      id: w.id,
      newDate: dateKeys[Math.floor(Math.random() * dateKeys.length)],
    }));

    // Optimistic update
    setWorkouts(prev => prev.map(w => {
      const u = updates.find(u => u.id === w.id);
      return u ? { ...w, dateKey: u.newDate } : w;
    }));

    // Persist en batch
    await Promise.all(
      updates.map(u =>
        supabase.from('workouts').update({ date: u.newDate }).eq('id', u.id)
      )
    );
    setIsAdapting(false);
  };

  const draggingWorkout = dragState?.isDragging ? workouts.find(w => w.id === dragState.workoutId) : null;

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col h-screen overflow-hidden pb-20 md:pb-0">

      {/* HEADER */}
      <header className="flex-none px-6 py-5 flex justify-between items-center bg-white/50 backdrop-blur-sm border-b border-zinc-200">
        <div>
          <h1 className="font-display font-bold text-2xl text-zinc-900">Planning</h1>
          <p className="text-xs font-mono text-zinc-400 mt-1">
            Semaine {weekNumber}
            {weekOffset !== 0 && (
              <button onClick={goToToday} className="ml-2 text-zinc-900 underline underline-offset-2 hover:text-zinc-600 transition">
                Aujourd&apos;hui
              </button>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2 bg-zinc-100 p-1 rounded-xl">
          <button onClick={goToPrevWeek} className="p-2 hover:bg-white rounded-lg text-zinc-500 shadow-sm transition"><ChevronLeft size={16}/></button>
          <span className="font-mono font-bold text-zinc-900 text-sm px-2">{headerTitle}</span>
          <button onClick={goToNextWeek} className="p-2 hover:bg-white rounded-lg text-zinc-500 shadow-sm transition"><ChevronRight size={16}/></button>
        </div>
      </header>

      {/* GRILLE SEMAINE */}
      <div className="flex-1 overflow-auto p-4 md:p-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 size={32} className="animate-spin text-zinc-400" />
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-3 min-w-[900px] h-full">
            {weekDays.map(({ dayLabel, date, dateKey }) => {
              const isToday = dateKey === todayKey;
              const isDropHover = dropTarget === dateKey && dragState?.isDragging;
              const dayWorkouts = workouts.filter(w => w.dateKey === dateKey);

              return (
                <div key={dateKey} className="flex flex-col h-full">
                  {/* En-tête Jour */}
                  <div className="text-center pb-3 border-b border-zinc-200 mb-3">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{dayLabel}</span>
                    <div className={`
                      mx-auto w-8 h-8 flex items-center justify-center rounded-full text-sm font-mono font-bold mt-1 transition-all
                      ${isToday ? 'bg-zinc-900 text-white shadow-lg scale-110' : 'text-zinc-900'}
                    `}>
                      {date.getDate()}
                    </div>
                  </div>

                  {/* Colonne Drop Zone */}
                  <div
                    ref={(el) => setColumnRef(dateKey, el)}
                    className={`
                      flex-1 rounded-2xl p-1 relative transition-all duration-200
                      ${isDropHover ? 'bg-zinc-100 ring-2 ring-zinc-300 ring-dashed' : 'bg-zinc-100/30'}
                    `}
                  >
                    {/* Lignes de fond */}
                    <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-10 p-2">
                      {[...Array(6)].map((_, i) => <div key={i} className="border-t border-zinc-900 w-full" />)}
                    </div>

                    {/* Cartes */}
                    <div className="relative z-10 flex flex-col gap-2">
                      {dayWorkouts.map(workout => {
                        const s = typeStyles[workout.type] || typeStyles.rest;
                        const height = Math.max(58, workout.durationMin * 1.6);
                        const isDragSource = dragState?.isDragging && dragState.workoutId === workout.id;

                        return (
                          <div
                            key={workout.id}
                            ref={el => { if (el) cardRefs.current[workout.id] = el; }}
                            onPointerDown={(e) => handlePointerDown(e, workout.id)}
                            className={`
                              relative w-full rounded-xl p-3 cursor-grab active:cursor-grabbing border-l-[4px] shadow-sm hover:shadow-md transition-all
                              flex flex-col justify-between select-none touch-none
                              ${s.bg} ${s.text} ${s.border} border-l-current
                              ${isDragSource ? 'opacity-30 scale-95 grayscale' : ''}
                            `}
                            style={{ height }}
                          >
                            <div>
                              <div className="flex justify-between items-start">
                                <div className="flex items-center gap-1 opacity-60">
                                  <GripHorizontal size={12} />
                                  <span className="text-[9px] font-black uppercase tracking-widest">{workout.type}</span>
                                </div>
                                {workout.status === 'completed' && <div className="w-2 h-2 rounded-full bg-emerald-500" />}
                              </div>
                              <h4 className="font-display font-bold text-sm leading-tight mt-1">{workout.title}</h4>
                            </div>
                            <div className="flex items-center gap-1 text-[10px] font-mono opacity-80 mt-auto">
                              <Clock size={10} /> {workout.duration}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* GHOST CARD */}
      {draggingWorkout && dragState?.isDragging && (() => {
        const s = typeStyles[draggingWorkout.type] || typeStyles.rest;
        const cardEl = cardRefs.current[draggingWorkout.id];
        const w = cardEl ? cardEl.offsetWidth : 140;
        const h = Math.max(58, draggingWorkout.durationMin * 1.6);
        return (
          <div
            className={`
               fixed z-50 rounded-xl p-3 border-l-[4px] shadow-2xl pointer-events-none flex flex-col justify-between
               ${s.bg} ${s.text} ${s.border} border-l-current
            `}
            style={{
              left: dragState.currentX - w / 2,
              top: dragState.currentY - 30,
              width: w,
              height: h,
              transform: 'rotate(3deg) scale(1.05)',
            }}
          >
             <div>
                <span className="text-[9px] font-black uppercase tracking-widest opacity-60">{draggingWorkout.type}</span>
                <h4 className="font-display font-bold text-sm leading-tight mt-1">{draggingWorkout.title}</h4>
             </div>
             <div className="flex items-center gap-1 text-[10px] font-mono opacity-80">
                <Clock size={10} /> {draggingWorkout.duration}
             </div>
          </div>
        );
      })()}

      {/* BOUTON ADAPT */}
      <button
        onClick={handleAdapt}
        disabled={isAdapting}
        className="fixed bottom-24 right-6 md:bottom-10 md:right-10 px-5 py-4 bg-zinc-900 text-white rounded-2xl font-display font-bold shadow-2xl flex items-center gap-3 z-30 hover:bg-zinc-800 transition-all active:scale-95"
      >
        <Shuffle size={20} className={isAdapting ? 'animate-spin' : ''} />
        {isAdapting ? 'Optimizing...' : 'Adapt Plan'}
      </button>

      {/* OVERLAY & SLIDE OVER */}
      {selectedWorkout && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity" onClick={() => setSelectedWorkout(null)} />
      )}

      <div className={`
         fixed top-0 right-0 h-full w-full md:w-[450px] bg-white shadow-2xl z-50 p-8 overflow-y-auto flex flex-col transition-transform duration-300 ease-spring
         ${selectedWorkout ? 'translate-x-0' : 'translate-x-full'}
      `}>
        {selectedWorkout && (() => {
          const sw = selectedWorkout;
          const s = typeStyles[sw.type] || typeStyles.rest;
          return (
            <>
              <button
                 onClick={() => setSelectedWorkout(null)}
                 className="absolute top-6 right-6 p-2 bg-zinc-100 rounded-full hover:bg-zinc-200 transition"
              >
                 <X size={20} />
              </button>

              <div className="mt-8">
                 <span className={`inline-block px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${s.bg} ${s.text}`}>
                    {sw.type}
                 </span>
                 <h2 className="text-3xl font-display font-black text-zinc-900 mt-4 leading-none">
                    {sw.title}
                 </h2>
                 <div className="flex items-center gap-6 mt-6 text-zinc-500 font-mono text-xs font-bold">
                    <span className="flex items-center gap-2"><Clock size={16} /> {sw.duration}</span>
                    <span className="flex items-center gap-2"><Zap size={16} /> TSS: {sw.tss}</span>
                 </div>
              </div>

              {/* Détails Séance */}
              <div className="mt-10 space-y-8 flex-1">
                 <div className="relative pl-6 border-l-2 border-zinc-200">
                    <div className="absolute -left-[5px] top-0 w-2 h-2 rounded-full bg-emerald-400" />
                    <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1">Warm Up</h3>
                    <p className="font-display font-medium text-zinc-800">{sw.details?.warmup}</p>
                 </div>

                 <div className={`relative pl-6 border-l-2 ${s.text.replace('text', 'border')}`}>
                    <div className={`absolute -left-[5px] top-0 w-2 h-2 rounded-full ${s.accent}`} />
                    <h3 className={`text-xs font-bold uppercase tracking-widest mb-2 ${s.text}`}>Main Set</h3>
                    <div className={`p-4 rounded-xl border ${s.bg} ${s.border}`}>
                       <p className="font-display font-bold text-zinc-900 text-lg leading-tight">{sw.details?.main}</p>
                    </div>
                 </div>

                 <div className="relative pl-6 border-l-2 border-zinc-200">
                    <div className="absolute -left-[5px] top-0 w-2 h-2 rounded-full bg-blue-400" />
                    <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1">Cool Down</h3>
                    <p className="font-display font-medium text-zinc-800">{sw.details?.cooldown}</p>
                 </div>
              </div>

              {/* Footer */}
              <div className="mt-8 pt-6 border-t border-zinc-100 flex gap-4">
                 <button className="flex-1 py-4 bg-zinc-900 text-white font-display font-bold rounded-xl hover:bg-zinc-800 transition shadow-lg shadow-zinc-900/10">
                    Start Workout
                 </button>
                 <button className="p-4 border border-zinc-200 rounded-xl hover:bg-zinc-50 text-zinc-500">
                    <MoreHorizontal />
                 </button>
              </div>
            </>
          );
        })()}
      </div>

    </div>
  );
}
