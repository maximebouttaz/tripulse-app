import { Heart } from 'lucide-react';
import type { WidgetProps } from './types';

export const thresholdsClassName = 'md:col-span-1 border-brand-red/10';

export function ThresholdsWidget({ profile }: WidgetProps) {
  return (
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
  );
}
