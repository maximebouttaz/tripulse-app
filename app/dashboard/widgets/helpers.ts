export function tsbColor(tsb: number): string {
  if (tsb > 15) return 'text-blue-500';
  if (tsb > 5) return 'text-cyan-500';
  if (tsb > -10) return 'text-emerald-500';
  if (tsb > -25) return 'text-amber-500';
  return 'text-red-500';
}

export function tsbLabel(tsb: number): { text: string; bgClass: string; textClass: string } {
  if (tsb > 15) return { text: 'DÉSENTRAÎNEMENT', bgClass: 'bg-blue-50 border-blue-100', textClass: 'text-blue-600' };
  if (tsb > 5) return { text: 'BIEN REPOSÉ', bgClass: 'bg-cyan-50 border-cyan-100', textClass: 'text-cyan-600' };
  if (tsb > -10) return { text: 'FORME OPTIMALE', bgClass: 'bg-emerald-50 border-emerald-100', textClass: 'text-emerald-600' };
  if (tsb > -25) return { text: 'ZONE PRODUCTIVE', bgClass: 'bg-amber-50 border-amber-100', textClass: 'text-amber-600' };
  return { text: 'FATIGUE ÉLEVÉE', bgClass: 'bg-red-50 border-red-100', textClass: 'text-red-600' };
}
