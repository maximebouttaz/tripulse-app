import { motion } from 'framer-motion';
import type { WidgetProps } from './types';

export const volumeClassName = '';

export function VolumeWidget({ profile }: WidgetProps) {
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

  return (
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
  );
}
