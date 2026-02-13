'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Activity, Zap, Heart, CloudRain, Wind,
  Gauge, Settings, GripVertical, Check
} from 'lucide-react';
import Link from 'next/link';
import { TriPulseLogo } from '@/components/TriPulseLogo';
import type { AthleteProfile } from '@/lib/types';

// --- HELPERS TSB ---
function tsbColor(tsb: number): string {
  if (tsb > 15) return 'text-blue-500';
  if (tsb > 5) return 'text-cyan-500';
  if (tsb > -10) return 'text-emerald-500';
  if (tsb > -25) return 'text-amber-500';
  return 'text-red-500';
}

function tsbLabel(tsb: number): { text: string; bgClass: string; textClass: string } {
  if (tsb > 15) return { text: 'DÉSENTRAÎNEMENT', bgClass: 'bg-blue-50 border-blue-100', textClass: 'text-blue-600' };
  if (tsb > 5) return { text: 'BIEN REPOSÉ', bgClass: 'bg-cyan-50 border-cyan-100', textClass: 'text-cyan-600' };
  if (tsb > -10) return { text: 'FORME OPTIMALE', bgClass: 'bg-emerald-50 border-emerald-100', textClass: 'text-emerald-600' };
  if (tsb > -25) return { text: 'ZONE PRODUCTIVE', bgClass: 'bg-amber-50 border-amber-100', textClass: 'text-amber-600' };
  return { text: 'FATIGUE ÉLEVÉE', bgClass: 'bg-red-50 border-red-100', textClass: 'text-red-600' };
}

// --- CONSTANTS ---
const DEFAULT_ORDER = ['hero', 'coach', 'weather', 'thresholds', 'weaknesses', 'volume', 'tsb', 'fitness'];
const STORAGE_KEY = 'tricoach-dashboard-order';
const LONG_PRESS_MS = 500;

export default function Dashboard() {
  const [profile, setProfile] = useState<(AthleteProfile & { athlete_photo?: string; athlete_firstname?: string }) | null>(null);
  const [loading, setLoading] = useState(true);

  // --- DRAG & DROP STATE ---
  const [widgetOrder, setWidgetOrder] = useState<string[]>(DEFAULT_ORDER);
  const [editMode, setEditMode] = useState(false);
  const [dragState, setDragState] = useState<{
    widgetId: string;
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
    isDragging: boolean;
  } | null>(null);
  const [dropTarget, setDropTarget] = useState<string | null>(null);

  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const widgetRefs = useRef<Record<string, HTMLElement>>({});

  // Load order from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length === DEFAULT_ORDER.length && DEFAULT_ORDER.every(id => parsed.includes(id))) {
          setWidgetOrder(parsed);
        }
      }
    } catch {}
  }, []);

  // Fetch profile
  useEffect(() => {
    fetch('/api/athlete/metrics?athlete_id=126239815')
      .then(res => res.ok ? res.json() : null)
      .then(data => { if (data && !data.error) setProfile(data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // --- LONG PRESS HANDLERS ---
  const handleLongPressStart = useCallback((e: React.PointerEvent) => {
    if (editMode) return;
    const startX = e.clientX;
    const startY = e.clientY;

    const onMove = (ev: PointerEvent) => {
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      if (Math.sqrt(dx * dx + dy * dy) > 8) {
        clearTimer();
        window.removeEventListener('pointermove', onMove);
      }
    };

    const clearTimer = () => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
      }
    };

    window.addEventListener('pointermove', onMove);

    longPressTimer.current = setTimeout(() => {
      window.removeEventListener('pointermove', onMove);
      setEditMode(true);
      try { navigator.vibrate?.(50); } catch {}
    }, LONG_PRESS_MS);

    const clearOnUp = () => {
      clearTimer();
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', clearOnUp);
    };
    window.addEventListener('pointerup', clearOnUp);
  }, [editMode]);

  // --- DRAG HANDLERS (only in editMode) ---
  const handleDragStart = useCallback((e: React.PointerEvent, widgetId: string) => {
    if (!editMode) return;
    e.preventDefault();
    setDragState({
      widgetId,
      startX: e.clientX,
      startY: e.clientY,
      currentX: e.clientX,
      currentY: e.clientY,
      isDragging: false,
    });
  }, [editMode]);

  const findDropWidget = useCallback((clientX: number, clientY: number): string | null => {
    for (const [id, el] of Object.entries(widgetRefs.current)) {
      const rect = el.getBoundingClientRect();
      if (clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom) {
        return id;
      }
    }
    return null;
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

      setDragState(prev => prev ? { ...prev, currentX: e.clientX, currentY: e.clientY, isDragging: true } : null);
      const target = findDropWidget(e.clientX, e.clientY);
      setDropTarget(target && target !== dragState.widgetId ? target : null);
    };

    const handlePointerUp = () => {
      if (dragState.isDragging && dropTarget) {
        setWidgetOrder(prev => {
          const newOrder = [...prev];
          const fromIdx = newOrder.indexOf(dragState.widgetId);
          const toIdx = newOrder.indexOf(dropTarget);
          if (fromIdx !== -1 && toIdx !== -1) {
            [newOrder[fromIdx], newOrder[toIdx]] = [newOrder[toIdx], newOrder[fromIdx]];
          }
          localStorage.setItem(STORAGE_KEY, JSON.stringify(newOrder));
          return newOrder;
        });
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
  }, [dragState, dropTarget, findDropWidget]);

  // --- COMPUTED DATA ---
  const totalVolume = profile ? (profile.weekly_swim_min + profile.weekly_bike_min + profile.weekly_run_min) : 0;
  const volumeBars = profile && totalVolume > 0
    ? [
        { color: 'bg-cyan-500', h: `${Math.round((profile.weekly_swim_min / totalVolume) * 100)}%`, label: 'Swim', min: Math.round(profile.weekly_swim_min) },
        { color: 'bg-brand-red', h: `${Math.round((profile.weekly_bike_min / totalVolume) * 100)}%`, label: 'Bike', min: Math.round(profile.weekly_bike_min) },
        { color: 'bg-amber-400', h: `${Math.round((profile.weekly_run_min / totalVolume) * 100)}%`, label: 'Run', min: Math.round(profile.weekly_run_min) },
      ]
    : [
        { color: 'bg-cyan-500', h: '33%', label: 'Swim', min: 0 },
        { color: 'bg-brand-red', h: '33%', label: 'Bike', min: 0 },
        { color: 'bg-amber-400', h: '33%', label: 'Run', min: 0 },
      ];

  const tsb = profile?.tsb ?? 0;
  const tsbInfo = tsbLabel(tsb);
  const ftp = profile?.ftp_watts;

  // --- WIDGET REGISTRY ---
  const widgetConfigs: Record<string, { className: string; content: React.ReactNode }> = {
    hero: {
      className: 'md:col-span-2 md:row-span-2 relative overflow-hidden group border-zinc-300/50 shadow-xl',
      content: (
        <>
          <div className="absolute -top-10 -right-10 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity">
            <Activity size={300} strokeWidth={1} />
          </div>
          <div className="relative z-10 flex flex-col h-full">
            <div className="flex justify-between items-start mb-10">
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 border border-red-100">
                <Gauge size={14} className="text-brand-red" />
                <span className="text-[10px] font-bold text-brand-red tracking-widest uppercase">Profil Athlète</span>
              </div>
              {profile?.last_assessed_at && (
                <p className="text-zinc-400 font-mono text-xs">MàJ : {new Date(profile.last_assessed_at).toLocaleDateString('fr-FR')}</p>
              )}
            </div>
            <div className="flex-1">
              <h2 className="text-5xl font-display font-extrabold tracking-tighter text-zinc-900 leading-[0.9]">
                {profile?.assessment_summary
                  ? profile.assessment_summary.split('.').slice(0, 2).join('.\n')
                  : loading ? 'Chargement...' : 'Aucune donnée'}
              </h2>
              <div className="flex gap-8 mt-10">
                {ftp && (
                  <div>
                    <p className="text-zinc-400 text-[10px] font-bold uppercase tracking-widest">FTP</p>
                    <p className="text-3xl font-mono font-bold">{ftp}<span className="text-sm text-zinc-300 ml-1">W</span></p>
                  </div>
                )}
                {profile?.max_hr && (
                  <div>
                    <p className="text-zinc-400 text-[10px] font-bold uppercase tracking-widest">FC Max</p>
                    <p className="text-3xl font-mono font-bold">{profile.max_hr}<span className="text-sm text-zinc-300 ml-1">bpm</span></p>
                  </div>
                )}
                {profile?.threshold_pace_sec && (
                  <div>
                    <p className="text-zinc-400 text-[10px] font-bold uppercase tracking-widest">Allure Seuil</p>
                    <p className="text-3xl font-mono font-bold">
                      {Math.floor(profile.threshold_pace_sec / 60)}:{(profile.threshold_pace_sec % 60).toString().padStart(2, '0')}
                      <span className="text-sm text-zinc-300 ml-1">/km</span>
                    </p>
                  </div>
                )}
              </div>
            </div>
            {profile?.strengths && profile.strengths.length > 0 && (
              <div className="mt-8 flex flex-wrap gap-2">
                {profile.strengths.map((s, i) => (
                  <span key={i} className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                    {s}
                  </span>
                ))}
              </div>
            )}
          </div>
        </>
      ),
    },
    coach: {
      className: 'md:col-span-2 bg-gradient-to-br from-zinc-900 to-zinc-800 border-none shadow-2xl',
      content: (
        <>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg brand-gradient flex items-center justify-center shadow-lg shadow-red-500/20">
              <Zap size={16} className="text-white" fill="white" />
            </div>
            <h3 className="font-display font-bold text-zinc-100 uppercase tracking-widest text-xs">TriCoach Intelligence</h3>
          </div>
          <p className="text-zinc-200 font-display text-xl leading-snug">
            {profile?.assessment_summary
              ? `"${profile.assessment_summary}"`
              : '"Connecte Strava et lance une évaluation pour obtenir ton analyse personnalisée."'}
          </p>
          <div className="mt-6 flex flex-wrap gap-4">
            <span className="text-[10px] font-mono text-zinc-500 bg-white/5 px-2 py-1 rounded border border-white/5">CTL: {profile ? Math.round(profile.ctl) : '—'}</span>
            <span className="text-[10px] font-mono text-zinc-500 bg-white/5 px-2 py-1 rounded border border-white/5">ATL: {profile ? Math.round(profile.atl) : '—'}</span>
            <span className="text-[10px] font-mono text-zinc-500 bg-white/5 px-2 py-1 rounded border border-white/5">TSB: {profile ? Math.round(profile.tsb) : '—'}</span>
          </div>
        </>
      ),
    },
    weather: {
      className: 'md:col-span-1',
      content: (
        <>
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
        </>
      ),
    },
    thresholds: {
      className: 'md:col-span-1 border-brand-red/10',
      content: (
        <>
          <div className="flex justify-between items-start mb-6">
            <Heart className="text-brand-red" />
            <span className="text-[10px] font-bold text-zinc-400 uppercase">Seuils</span>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-baseline">
              <p className="text-zinc-500 text-xs font-bold">LTHR Vélo</p>
              <p className="font-mono font-bold">{profile?.lthr_bike ?? '—'}<span className="text-xs text-zinc-300 ml-1">bpm</span></p>
            </div>
            <div className="flex justify-between items-baseline">
              <p className="text-zinc-500 text-xs font-bold">LTHR Course</p>
              <p className="font-mono font-bold">{profile?.lthr_run ?? '—'}<span className="text-xs text-zinc-300 ml-1">bpm</span></p>
            </div>
            {profile?.css_pace_sec && (
              <div className="flex justify-between items-baseline">
                <p className="text-zinc-500 text-xs font-bold">CSS</p>
                <p className="font-mono font-bold">
                  {Math.floor(profile.css_pace_sec / 60)}:{(profile.css_pace_sec % 60).toString().padStart(2, '0')}
                  <span className="text-xs text-zinc-300 ml-1">/100m</span>
                </p>
              </div>
            )}
          </div>
        </>
      ),
    },
    weaknesses: {
      className: '',
      content: (
        <>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
            <span className="text-[10px] font-bold text-zinc-400 uppercase">Axes d&apos;amélioration</span>
          </div>
          {profile?.weaknesses && profile.weaknesses.length > 0 ? (
            <div className="space-y-2">
              {profile.weaknesses.slice(0, 3).map((w, i) => (
                <p key={i} className="text-xs text-zinc-600 flex items-start gap-2">
                  <span className="text-amber-500 mt-0.5">•</span> {w}
                </p>
              ))}
            </div>
          ) : (
            <p className="text-xs text-zinc-500">Aucune faiblesse détectée</p>
          )}
        </>
      ),
    },
    volume: {
      className: '',
      content: (
        <>
          <span className="text-[10px] font-bold text-zinc-400 uppercase mb-2">Volume Hebdo</span>
          {totalVolume > 0 && (
            <span className="text-[10px] font-mono text-zinc-400 mb-2">{Math.round(totalVolume / 60)}h/sem</span>
          )}
          <div className="flex items-end justify-between flex-1 gap-2">
            {volumeBars.map((bar, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-[9px] font-mono text-zinc-400">{bar.min}min</span>
                <div className="w-full bg-zinc-50 rounded-t-lg relative group h-20">
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: bar.h }}
                    className={`absolute bottom-0 w-full ${bar.color} rounded-t-lg opacity-80 group-hover:opacity-100 transition-opacity`}
                  />
                </div>
                <span className="text-[9px] font-bold text-zinc-400">{bar.label}</span>
              </div>
            ))}
          </div>
        </>
      ),
    },
    tsb: {
      className: 'items-center justify-center text-center',
      content: (
        <>
          <span className="text-[10px] font-bold text-zinc-400 uppercase mb-2">Forme (TSB)</span>
          <div className="relative">
            <h4 className={`text-5xl font-mono font-bold ${tsbColor(tsb)}`}>{profile ? Math.round(tsb) : '—'}</h4>
          </div>
          <p className={`text-[10px] font-bold ${tsbInfo.textClass} ${tsbInfo.bgClass} px-3 py-1 rounded-full mt-2 border`}>
            {tsbInfo.text}
          </p>
        </>
      ),
    },
    fitness: {
      className: 'bg-zinc-100/50 border-dashed',
      content: (
        <div className="flex flex-col h-full justify-between">
          <div>
            <p className="text-[10px] font-bold text-zinc-400 uppercase">Niveau Fitness</p>
            <p className="font-display font-bold text-zinc-900 text-xl">
              {profile ? (
                profile.ctl >= 80 ? 'Excellent' :
                profile.ctl >= 50 ? 'Bon' :
                profile.ctl >= 25 ? 'Modéré' :
                'En développement'
              ) : '—'}
            </p>
          </div>
          <div>
            <div className="flex justify-between text-[10px] font-mono font-bold text-zinc-400 mb-1 uppercase">
              <span>CTL</span>
              <span>{profile ? Math.round(profile.ctl) : 0}/100</span>
            </div>
            <div className="h-1.5 w-full bg-zinc-200 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(profile ? profile.ctl : 0, 100)}%` }}
                className="h-full bg-zinc-900 rounded-full"
              />
            </div>
          </div>
        </div>
      ),
    },
  };

  // --- GHOST CARD ---
  const draggedWidget = dragState?.isDragging ? dragState.widgetId : null;
  const ghostEl = draggedWidget && widgetRefs.current[draggedWidget];
  const ghostRect = ghostEl ? ghostEl.getBoundingClientRect() : null;

  return (
    <div className={`min-h-screen p-6 md:p-10 font-sans selection:bg-brand-red/10 transition-colors duration-300 ${editMode ? 'bg-zinc-100' : 'bg-zinc-50'}`}>

      {/* Wiggle keyframes */}
      {editMode && (
        <style>{`
          @keyframes wiggle {
            0%, 100% { transform: rotate(-0.7deg); }
            50% { transform: rotate(0.7deg); }
          }
          .widget-wiggle { animation: wiggle 0.3s ease-in-out infinite; }
        `}</style>
      )}

      <div className="max-w-7xl mx-auto">

        {/* HEADER AREA */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
          <TriPulseLogo />
          <div className="flex items-center gap-3">

            {/* Bouton Terminé (edit mode) */}
            {editMode && (
              <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={() => setEditMode(false)}
                className="px-5 py-2.5 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-xl font-display font-bold text-sm shadow-lg shadow-red-500/30 flex items-center gap-2 hover:shadow-red-500/40 transition-all"
              >
                <Check size={16} />
                Terminé
              </motion.button>
            )}

            <div className="flex items-center gap-4 bg-white/50 p-2 rounded-2xl border border-zinc-200">
              <Link href="/races" className="text-right pr-2 border-r border-zinc-200 hover:opacity-70 transition-opacity">
                <p className="text-[10px] font-bold text-zinc-400 uppercase">Prochaine Échéance</p>
                <p className="font-display font-bold text-zinc-900 text-sm">Ironman Nice • J-42</p>
              </Link>
              <div className="text-right pr-2 border-r border-zinc-200">
                <p className="text-[10px] font-bold text-zinc-400 uppercase">Fitness (CTL)</p>
                <p className="font-display font-bold text-zinc-900 text-sm">{profile ? Math.round(profile.ctl) : '—'} pts</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center overflow-hidden border border-white">
                {profile?.athlete_photo ? (
                  <img src={profile.athlete_photo} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-tr from-zinc-200 to-zinc-300" />
                )}
              </div>
            </div>
            <Link href="/settings" className="w-10 h-10 rounded-2xl bg-white/50 border border-zinc-200 flex items-center justify-center hover:bg-zinc-100 transition">
              <Settings size={18} className="text-zinc-500" />
            </Link>
          </div>
        </header>

        {/* Hint edit mode */}
        {editMode && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center text-xs font-display font-medium text-zinc-400 mb-4"
          >
            Glisse les widgets pour réorganiser ton dashboard
          </motion.p>
        )}

        {/* BENTO GRID 4 COLONNES */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {widgetOrder.map((id, index) => {
            const config = widgetConfigs[id];
            if (!config) return null;

            const isDragSource = dragState?.isDragging && dragState.widgetId === id;
            const isDropHover = dropTarget === id;

            return (
              <motion.div
                key={id}
                ref={el => { if (el) widgetRefs.current[id] = el; }}
                initial={{ opacity: 0, y: 20 }}
                animate={{
                  opacity: isDragSource ? 0.3 : 1,
                  y: 0,
                  scale: isDragSource ? 0.95 : isDropHover ? 1.02 : 1,
                }}
                transition={{ duration: 0.3, delay: editMode ? 0 : index * 0.08 }}
                onPointerDown={(e) => {
                  handleLongPressStart(e);
                  if (editMode) handleDragStart(e, id);
                }}
                className={`
                  glass-light rounded-4xl p-6 flex flex-col relative
                  ${config.className}
                  ${editMode ? 'widget-wiggle cursor-grab active:cursor-grabbing' : ''}
                  ${isDropHover ? 'ring-2 ring-red-200 ring-dashed shadow-lg' : ''}
                  ${editMode ? 'select-none touch-none' : ''}
                `}
              >
                {/* Drag Handle Overlay (edit mode) */}
                {editMode && (
                  <div className="absolute top-3 right-3 z-20 p-1.5 bg-white/80 backdrop-blur rounded-lg border border-zinc-200 shadow-sm">
                    <GripVertical size={14} className="text-zinc-400" />
                  </div>
                )}

                {config.content}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* GHOST CARD (Drag) */}
      {draggedWidget && dragState?.isDragging && ghostRect && (
        <div
          className="fixed z-50 pointer-events-none backdrop-blur-xl bg-white/80 rounded-4xl p-6 shadow-2xl shadow-zinc-300/50 border border-white/60"
          style={{
            left: dragState.currentX - ghostRect.width / 2,
            top: dragState.currentY - 40,
            width: ghostRect.width,
            height: ghostRect.height,
            transform: 'rotate(2deg) scale(1.03)',
            maxHeight: '300px',
            overflow: 'hidden',
          }}
        >
          <div className="opacity-60">
            {widgetConfigs[draggedWidget]?.content}
          </div>
        </div>
      )}
    </div>
  );
}
