'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { MapPin, Calendar, Plus, Trophy, ArrowRight } from 'lucide-react';

const RaceCard = ({ race, isNext }: any) => (
  <Link href={`/races/${race.id}`} className="block">
    <motion.div 
      whileHover={{ scale: 1.02 }}
      className={`relative rounded-3xl overflow-hidden border ${isNext ? 'border-brand-red shadow-xl shadow-red-500/10' : 'border-zinc-200 shadow-sm'} bg-white mb-6`}
    >
      {/* Image de fond simulée par un dégradé */}
      <div className={`h-32 w-full ${race.imageGradient} relative`}>
        <div className="absolute inset-0 bg-black/20" />
        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-zinc-900 uppercase tracking-wider">
          {race.type}
        </div>
        {race.isA && (
          <div className="absolute top-4 left-4 bg-red-600 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-lg">
            A-Race
          </div>
        )}
      </div>

      <div className="p-6">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-xl font-display font-bold text-zinc-900 leading-tight">{race.name}</h3>
          <ArrowRight className="text-zinc-300" />
        </div>
        
        <div className="flex flex-col gap-2 mt-4">
          <div className="flex items-center gap-2 text-sm text-zinc-500">
            <Calendar size={16} /> 
            <span className="font-mono font-bold text-zinc-700">{race.date}</span>
            <span className="text-xs bg-zinc-100 px-2 py-0.5 rounded text-zinc-500">{race.daysLeft}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-zinc-500">
            <MapPin size={16} /> {race.location}
          </div>
        </div>
      </div>
    </motion.div>
  </Link>
);

export default function RacesPage() {
  const races = [
    { 
      id: 'ironman-nice', 
      name: 'Ironman France Nice', 
      date: '26 Juin 2026', 
      location: 'Nice, France', 
      type: 'Full Distance', 
      isA: true, 
      daysLeft: 'J-42',
      imageGradient: 'bg-gradient-to-r from-blue-600 to-cyan-500' 
    },
    { 
      id: '703-aix', 
      name: 'Ironman 70.3 Aix', 
      date: '12 Mai 2026', 
      location: 'Aix-en-Provence', 
      type: 'Half Distance', 
      isA: false, 
      daysLeft: 'Terminé',
      imageGradient: 'bg-gradient-to-r from-yellow-500 to-orange-500' 
    },
  ];

  return (
    <div className="min-h-screen bg-zinc-50 p-6 md:p-10 pb-24">
      <div className="max-w-3xl mx-auto">
        
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold text-zinc-900">Ma Saison</h1>
            <p className="text-zinc-500 text-sm">Objectifs 2026</p>
          </div>
          <Link href="/races/explore">
            <button className="flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white rounded-xl text-sm font-bold shadow-lg hover:bg-zinc-800 transition">
              <Plus size={16} /> Add Race
            </button>
          </Link>
        </header>

        {/* TIMELINE */}
        <div className="relative border-l-2 border-zinc-200 ml-4 pl-8 space-y-8">
          {races.map((race, i) => (
            <div key={race.id} className="relative">
              {/* Point sur la timeline */}
              <div className={`
                absolute -left-[41px] top-8 w-5 h-5 rounded-full border-4 border-zinc-50 
                ${race.isA ? 'bg-red-600' : 'bg-zinc-300'}
              `} />
              
              <RaceCard race={race} isNext={i === 0} />
            </div>
          ))}

          {/* Empty State / Fin de saison */}
          <div className="relative">
            <div className="absolute -left-[41px] top-2 w-5 h-5 rounded-full border-4 border-zinc-50 bg-zinc-200" />
            <div className="p-6 border-2 border-dashed border-zinc-200 rounded-3xl flex flex-col items-center justify-center text-zinc-400 gap-2 h-40">
               <Trophy size={24} />
               <span className="font-display font-bold text-sm">Saison Terminée</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}