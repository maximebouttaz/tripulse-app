import { Zap } from 'lucide-react';
import type { WidgetProps } from './types';

export const coachClassName = 'md:col-span-2 bg-gradient-to-br from-zinc-900 to-zinc-800 border-none shadow-2xl';

export function CoachWidget({ profile }: WidgetProps) {
  return (
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
  );
}
