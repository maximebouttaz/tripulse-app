export function formatDistance(meters: number | null): string {
  if (!meters) return '—';
  if (meters >= 1000) return `${(meters / 1000).toFixed(meters % 1000 === 0 ? 0 : 1)}km`;
  return `${meters}m`;
}

export function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'Date TBC';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function formatDateLong(dateStr: string | null): string {
  if (!dateStr) return 'Date TBC';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

export function categoryLabel(cat: string): string {
  const map: Record<string, string> = {
    'XS': 'XS', 'S': 'Sprint', 'M': 'Olympique',
    'L': 'Longue Distance', '70.3': '70.3',
    'XL': 'XL', 'Ironman': 'Ironman',
  };
  return map[cat] || cat;
}

export function categoryColor(cat: string): string {
  switch (cat) {
    case 'Ironman': return 'bg-red-600 text-white';
    case 'XL': return 'bg-purple-600 text-white';
    case '70.3': return 'bg-blue-600 text-white';
    case 'L': return 'bg-indigo-600 text-white';
    case 'M': return 'bg-emerald-600 text-white';
    case 'S': return 'bg-amber-600 text-white';
    case 'XS': return 'bg-zinc-600 text-white';
    default: return 'bg-zinc-600 text-white';
  }
}

export function tempLabel(temp: number | null): { label: string; color: string } {
  if (!temp) return { label: '', color: '' };
  if (temp >= 28) return { label: 'Chaud', color: 'bg-red-50 text-red-600' };
  if (temp >= 22) return { label: 'Agréable', color: 'bg-amber-50 text-amber-600' };
  if (temp >= 16) return { label: 'Frais', color: 'bg-blue-50 text-blue-600' };
  return { label: 'Froid', color: 'bg-cyan-50 text-cyan-600' };
}
