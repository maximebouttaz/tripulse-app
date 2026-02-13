import { Activity, Gauge } from 'lucide-react';
import type { WidgetProps } from './types';

export const heroClassName = 'md:col-span-2 md:row-span-2 relative overflow-hidden group border-zinc-300/50 shadow-xl';

export function HeroWidget({ profile, loading }: WidgetProps) {
  const ftp = profile?.ftp_watts;

  return (
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
  );
}
