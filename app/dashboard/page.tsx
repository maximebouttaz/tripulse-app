'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Settings, GripVertical, Check } from 'lucide-react';
import Link from 'next/link';
import { TriPulseLogo } from '@/components/TriPulseLogo';
import { WIDGET_CONFIGS, DEFAULT_ORDER } from './widgets';
import type { DashboardProfile } from './widgets';

// --- CONSTANTS ---
const STORAGE_KEY = 'tricoach-dashboard-order';
const LONG_PRESS_MS = 500;

export default function Dashboard() {
  const [profile, setProfile] = useState<DashboardProfile | null>(null);
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
            const config = WIDGET_CONFIGS[id];
            if (!config) return null;

            const isDragSource = dragState?.isDragging && dragState.widgetId === id;
            const isDropHover = dropTarget === id;
            const WidgetComponent = config.component;

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

                <WidgetComponent profile={profile} loading={loading} />
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
            {(() => {
              const GhostWidget = WIDGET_CONFIGS[draggedWidget]?.component;
              return GhostWidget ? <GhostWidget profile={profile} loading={loading} /> : null;
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
