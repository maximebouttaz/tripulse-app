'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity, Waves, Bike, Zap, Clock, Moon,
  Play, ChevronRight, Flame, Timer,
} from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import type { WidgetProps, Workout } from './types';

// --- SPORT THEMES ---
const sportThemes: Record<string, {
  bg: string; text: string; border: string; accent: string;
  accentBg: string; icon: typeof Activity; label: string;
}> = {
  swim: {
    bg: 'bg-cyan-50/30', text: 'text-cyan-600', border: 'border-cyan-200',
    accent: 'from-cyan-500 to-cyan-600', accentBg: 'bg-cyan-50',
    icon: Waves, label: 'NATATION',
  },
  bike: {
    bg: 'bg-red-50/30', text: 'text-red-600', border: 'border-red-200',
    accent: 'from-red-500 to-rose-600', accentBg: 'bg-red-50',
    icon: Bike, label: 'VÉLO',
  },
  run: {
    bg: 'bg-amber-50/30', text: 'text-amber-600', border: 'border-amber-200',
    accent: 'from-amber-500 to-orange-500', accentBg: 'bg-amber-50',
    icon: Activity, label: 'COURSE',
  },
  strength: {
    bg: 'bg-purple-50/30', text: 'text-purple-600', border: 'border-purple-200',
    accent: 'from-purple-500 to-violet-600', accentBg: 'bg-purple-50',
    icon: Zap, label: 'FORCE',
  },
};

const defaultTheme = {
  bg: 'bg-zinc-50/30', text: 'text-zinc-500', border: 'border-zinc-200',
  accent: 'from-zinc-400 to-zinc-500', accentBg: 'bg-zinc-50',
  icon: Clock, label: 'ENTRAÎNEMENT',
};

// --- REST DAY QUOTES ---
const REST_QUOTES = [
  'Le repos fait partie de l\'entraînement. — Mark Allen',
  'Ton corps se construit quand tu récupères.',
  'La patience est la clé de la performance.',
  'Chaque jour de repos te rend plus fort.',
  'Récupère aujourd\'hui, performe demain.',
  'Le surentraînement est l\'ennemi du progrès.',
];

// --- ROW TO WORKOUT ---
function rowToWorkout(row: Record<string, unknown>): Workout {
  return {
    id: row.id as number,
    dateKey: row.date as string,
    type: row.type as string,
    title: row.title as string,
    duration: row.duration as string,
    durationMin: row.duration_min as number,
    tss: row.tss as number,
    status: row.status as Workout['status'],
    details: {
      warmup: (row.warmup as string) || '',
      main: (row.main_set as string) || '',
      cooldown: (row.cooldown as string) || '',
    },
    focus: (row.focus as string) || null,
    equipment: (row.equipment as string[]) || null,
    targetZones: (row.target_zones as string) || null,
    coachTip: (row.coach_tip as string) || null,
    purpose: (row.purpose as string) || null,
    nutrition: (row.nutrition as string) || null,
    feelLegs: (row.feel_legs as number) || 0,
    feelCardio: (row.feel_cardio as number) || 0,
    feelMental: (row.feel_mental as number) || 0,
    intensityBlocks: (row.intensity_blocks as Workout['intensityBlocks']) || null,
  };
}

// --- DATE FORMATTER ---
function formatToday(): string {
  return new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).replace(/^\w/, c => c.toUpperCase());
}

export const heroClassName = 'md:col-span-2 md:row-span-2 relative overflow-hidden group border-zinc-300/50 shadow-xl';

export function HeroWidget({ }: WidgetProps) {
  const router = useRouter();
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [workoutLoading, setWorkoutLoading] = useState(true);

  const todayLabel = useMemo(() => formatToday(), []);
  const restQuote = useMemo(() => REST_QUOTES[Math.floor(Math.random() * REST_QUOTES.length)], []);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    supabase
      .from('workouts')
      .select('*')
      .eq('date', today)
      .limit(1)
      .single()
      .then(({ data }) => {
        if (data) setWorkout(rowToWorkout(data));
      })
      .catch(() => {})
      .finally(() => setWorkoutLoading(false));
  }, []);

  const theme = workout ? (sportThemes[workout.type] || defaultTheme) : defaultTheme;
  const SportIcon = theme.icon;

  // --- STRUCTURE BLOCKS ---
  const structureBlocks = workout ? [
    { key: 'warmup', label: 'Échauffement', text: workout.details.warmup, isMain: false },
    { key: 'main', label: 'Série Principale', text: workout.details.main, isMain: true },
    { key: 'cooldown', label: 'Retour au calme', text: workout.details.cooldown, isMain: false },
  ].filter(b => b.text) : [];

  // ======================
  // LOADING STATE
  // ======================
  if (workoutLoading) {
    return (
      <div className="relative z-10 flex flex-col h-full animate-pulse">
        <div className="flex justify-between items-start mb-6">
          <div className="h-6 w-28 bg-zinc-200 rounded-full" />
          <div className="h-4 w-32 bg-zinc-100 rounded" />
        </div>
        <div className="h-8 w-3/4 bg-zinc-200 rounded-lg mb-2" />
        <div className="h-8 w-1/2 bg-zinc-100 rounded-lg mb-6" />
        <div className="flex gap-6 mb-6">
          <div className="h-10 w-20 bg-zinc-100 rounded-lg" />
          <div className="h-10 w-20 bg-zinc-100 rounded-lg" />
        </div>
        <div className="space-y-3 flex-1">
          <div className="h-14 bg-zinc-100 rounded-2xl" />
          <div className="h-16 bg-zinc-200 rounded-2xl" />
          <div className="h-14 bg-zinc-100 rounded-2xl" />
        </div>
        <div className="h-12 bg-zinc-200 rounded-2xl mt-4" />
      </div>
    );
  }

  // ======================
  // REST DAY STATE
  // ======================
  if (!workout) {
    return (
      <>
        <div className="absolute -top-10 -right-10 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity">
          <Moon size={300} strokeWidth={1} />
        </div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 flex flex-col h-full items-center justify-center text-center"
        >
          <div className="w-16 h-16 rounded-2xl bg-zinc-100 flex items-center justify-center mb-6">
            <Moon size={28} className="text-zinc-400" />
          </div>
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">{todayLabel}</p>
          <h2 className="text-3xl font-display font-extrabold tracking-tight text-zinc-900 mb-3">
            Jour de repos
          </h2>
          <p className="text-sm text-zinc-400 font-display italic max-w-xs leading-relaxed mb-8">
            &ldquo;{restQuote}&rdquo;
          </p>
          <Link
            href="/calendar"
            className="px-5 py-2.5 bg-zinc-100 hover:bg-zinc-200 rounded-xl text-xs font-display font-bold text-zinc-600 transition-colors flex items-center gap-2"
          >
            Voir le planning
            <ChevronRight size={14} />
          </Link>
        </motion.div>
      </>
    );
  }

  // ======================
  // WORKOUT STATE
  // ======================
  return (
    <>
      {/* Background sport icon */}
      <div className="absolute -top-10 -right-10 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity">
        <SportIcon size={300} strokeWidth={1} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 flex flex-col h-full"
      >
        {/* Clickable zone → calendar with workout details */}
        <div
          className="flex-1 flex flex-col cursor-pointer"
          onClick={() => router.push(`/calendar?workoutId=${workout.id}`)}
        >
          {/* Header: Badge + Date */}
          <div className="flex justify-between items-start mb-5">
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${theme.accentBg} border ${theme.border}`}>
              <SportIcon size={14} className={theme.text} />
              <span className={`text-[10px] font-bold ${theme.text} tracking-widest uppercase`}>{theme.label}</span>
            </div>
            <p className="text-zinc-400 font-mono text-xs">{todayLabel}</p>
          </div>

          {/* Title */}
          <h2 className="text-3xl font-display font-extrabold tracking-tight text-zinc-900 leading-tight mb-4">
            {workout.title}
          </h2>

          {/* Metrics: Duration + TSS */}
          <div className="flex gap-6 mb-5">
            <div className="flex items-center gap-2">
              <Timer size={14} className="text-zinc-400" />
              <span className="font-mono font-bold text-zinc-900">{workout.duration}</span>
            </div>
            {workout.tss > 0 && (
              <div className="flex items-center gap-2">
                <Flame size={14} className={theme.text} />
                <span className="font-mono font-bold text-zinc-900">{workout.tss}<span className="text-xs text-zinc-400 ml-1">TSS</span></span>
              </div>
            )}
          </div>

          {/* Structure Blocks */}
          <div className="space-y-2 flex-1">
            <AnimatePresence>
              {structureBlocks.map((block, index) => (
                <motion.div
                  key={block.key}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`
                    rounded-2xl px-4 py-3
                    ${block.isMain
                      ? `${theme.bg} border-2 ${theme.border}`
                      : 'bg-zinc-50/50 border border-zinc-100'
                    }
                  `}
                >
                  <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${block.isMain ? theme.text : 'text-zinc-400'}`}>
                    {block.label}
                  </p>
                  <p className={`text-sm leading-snug ${block.isMain ? 'font-bold text-zinc-900' : 'text-zinc-600'}`}>
                    {block.text}
                  </p>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-3 mt-5">
          <motion.button
            whileTap={{ scale: 0.95 }}
            className={`flex-1 py-3 bg-gradient-to-r ${theme.accent} text-white rounded-2xl font-display font-bold text-sm shadow-lg flex items-center justify-center gap-2 hover:shadow-xl transition-shadow`}
          >
            <Play size={16} fill="white" />
            Push to Garmin
          </motion.button>
          <Link
            href={`/calendar?workoutId=${workout.id}`}
            className="px-4 py-3 bg-zinc-100 hover:bg-zinc-200 rounded-2xl text-xs font-display font-bold text-zinc-600 transition-colors flex items-center gap-2"
          >
            En savoir plus
            <ChevronRight size={14} />
          </Link>
        </div>
      </motion.div>
    </>
  );
}
