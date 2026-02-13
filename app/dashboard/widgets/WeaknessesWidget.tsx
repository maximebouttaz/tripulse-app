import type { WidgetProps } from './types';

export const weaknessesClassName = '';

export function WeaknessesWidget({ profile }: WidgetProps) {
  return (
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
  );
}
