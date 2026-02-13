import type { WidgetProps } from './types';
import { tsbColor, tsbLabel } from './helpers';

export const tsbClassName = 'items-center justify-center text-center';

export function TsbWidget({ profile }: WidgetProps) {
  const tsb = profile?.tsb ?? 0;
  const tsbInfo = tsbLabel(tsb);

  return (
    <>
      <span className="text-[10px] font-bold text-zinc-400 uppercase mb-2">Forme (TSB)</span>
      <div className="relative">
        <h4 className={`text-5xl font-mono font-bold ${tsbColor(tsb)}`}>{profile ? Math.round(tsb) : '—'}</h4>
      </div>
      <p className={`text-[10px] font-bold ${tsbInfo.textClass} ${tsbInfo.bgClass} px-3 py-1 rounded-full mt-2 border`}>
        {tsbInfo.text}
      </p>
    </>
  );
}
