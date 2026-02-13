'use client';

import React from 'react';

export const TriPulseLogo = ({ className = "h-8" }) => (
  <div className={`flex items-center gap-3 ${className}`}>
    {/* SVG du Cardiogramme */}
    <svg viewBox="0 0 120 32" className="h-full w-auto" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path 
        d="M0 16 H15 L22 4 L30 24 L40 16 H55 L62 0 L70 32 L80 16 H95 L100 8 L105 16 H120" 
        stroke="url(#pulse-grad)" 
        strokeWidth="4" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      <defs>
        <linearGradient id="pulse-grad" x1="0" y1="16" x2="120" y2="16" gradientUnits="userSpaceOnUse">
          <stop stopColor="#dc2626" />
          <stop offset="1" stopColor="#e11d48" />
        </linearGradient>
      </defs>
    </svg>
    {/* Texte */}
    <div className="flex flex-col -space-y-1">
      <span className="font-display font-extrabold text-xl tracking-tighter text-zinc-900">TriPulse</span>
      <span className="text-[10px] font-display font-bold text-zinc-400 uppercase tracking-widest">
        AI Coach <span className="text-brand-red">TriCoach</span>
      </span>
    </div>
  </div>
);