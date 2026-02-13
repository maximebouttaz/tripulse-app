import { CloudRain, Wind } from 'lucide-react';

export const weatherClassName = 'md:col-span-1';

export function WeatherWidget() {
  return (
    <>
      <div className="flex justify-between items-start mb-6">
        <CloudRain className="text-cyan-500" />
        <div className="text-right">
          <p className="text-[10px] font-bold text-zinc-400 uppercase">Nice, FR</p>
          <p className="text-[10px] font-bold text-zinc-400 uppercase">18:00</p>
        </div>
      </div>
      <div className="flex items-baseline gap-2">
        <h4 className="text-4xl font-mono font-bold">14°</h4>
        <span className="text-zinc-400 font-display font-bold">Pluie faible</span>
      </div>
      <div className="flex items-center gap-2 text-zinc-500 text-xs mt-2 border-t border-zinc-100 pt-2">
        <Wind size={14} /> 35km/h • Vent de face
      </div>
      <button className="mt-4 w-full py-3 bg-zinc-50 rounded-2xl text-[10px] font-bold text-zinc-500 uppercase tracking-widest hover:bg-zinc-100 transition border border-zinc-100">
        Passer sur Zwift
      </button>
    </>
  );
}
