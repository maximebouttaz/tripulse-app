'use client';

import React from 'react';
import Link from 'next/link';
import { Search, Map, Filter, Heart } from 'lucide-react';

const ExploreCard = ({ title, date, location, dist, imgColor }: any) => (
  <div className="group bg-white rounded-2xl overflow-hidden border border-zinc-200 shadow-sm hover:shadow-md transition-all cursor-pointer">
    <div className={`h-40 ${imgColor} relative`}>
       <button className="absolute top-3 right-3 p-2 bg-white/50 backdrop-blur rounded-full hover:bg-white text-zinc-600 hover:text-red-500 transition">
          <Heart size={16} />
       </button>
       <div className="absolute bottom-3 left-3 bg-zinc-900/80 backdrop-blur text-white text-[10px] font-bold px-2 py-1 rounded">
          {dist}
       </div>
    </div>
    <div className="p-4">
       <div className="flex justify-between items-start">
          <h3 className="font-display font-bold text-zinc-900">{title}</h3>
          <span className="text-xs font-mono font-bold text-zinc-400">{date}</span>
       </div>
       <p className="text-sm text-zinc-500 mt-1">{location}</p>
    </div>
  </div>
);

export default function ExplorePage() {
  return (
    <div className="min-h-screen bg-zinc-50 p-6 md:p-10 pb-24">
      <div className="max-w-7xl mx-auto">
         
         {/* HEADER RECHERCHE */}
         <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="flex-1 relative">
               <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={20} />
               <input 
                 type="text" 
                 placeholder="Chercher une course (ex: Nice, Vichy...)" 
                 className="w-full pl-12 pr-4 py-3 rounded-2xl border border-zinc-200 bg-white font-display focus:ring-2 focus:ring-red-500/20 outline-none"
               />
            </div>
            <div className="flex gap-2">
               <button className="px-4 py-3 bg-white border border-zinc-200 rounded-2xl font-bold text-sm text-zinc-600 flex items-center gap-2 hover:bg-zinc-50">
                  <Filter size={18} /> Filtres
               </button>
               <button className="px-4 py-3 bg-zinc-900 text-white rounded-2xl font-bold text-sm flex items-center gap-2">
                  <Map size={18} /> Carte
               </button>
            </div>
         </div>

         {/* GRILLE RESULTATS */}
         <h2 className="text-xl font-display font-bold text-zinc-900 mb-6">Recommandé pour toi</h2>
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <ExploreCard title="Ironman 70.3 Vichy" date="Août 2026" location="Vichy, FR" dist="70.3" imgColor="bg-teal-600" />
            <ExploreCard title="Embrunman" date="15 Août" location="Embrun, FR" dist="XXL" imgColor="bg-indigo-600" />
            <ExploreCard title="Gerardmer XL" date="Sept 2026" location="Vosges, FR" dist="L" imgColor="bg-emerald-600" />
            <ExploreCard title="Ironman Cascais" date="Oct 2026" location="Cascais, PT" dist="140.6" imgColor="bg-orange-500" />
         </div>

      </div>
    </div>
  );
}