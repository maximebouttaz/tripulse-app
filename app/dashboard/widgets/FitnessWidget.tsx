import { motion } from 'framer-motion';
import type { WidgetProps } from './types';

export const fitnessClassName = 'bg-zinc-100/50 border-dashed';

export function FitnessWidget({ profile }: WidgetProps) {
  return (
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
  );
}
