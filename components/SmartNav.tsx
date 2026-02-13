'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutGrid, 
  CalendarDays, 
  BarChart2, 
  MessageSquare, 
  Settings,
  Flag // <--- C'est ici qu'il manquait l'import !
} from 'lucide-react';

export const SmartNav = () => {
  const pathname = usePathname();

  const links = [
    { href: '/dashboard', icon: LayoutGrid, label: 'Dash' },
    { href: '/calendar', icon: CalendarDays, label: 'Planning' },
    { href: '/races', icon: Flag, label: 'Courses' }, // Maintenant "Flag" est connu
    { href: '/analytics', icon: BarChart2, label: 'Stats' },
    { href: '/coach', icon: MessageSquare, label: 'Coach' },
  ];

  return (
    <>
      {/* MOBILE: Barre en bas */}
      <nav className="md:hidden fixed bottom-4 left-4 right-4 h-16 bg-white/80 backdrop-blur-xl border border-white/60 rounded-3xl flex items-center justify-around px-2 z-50 shadow-2xl shadow-zinc-200/50">
        {links.map((link) => {
          const isActive = pathname === link.href || (pathname.startsWith(link.href) && link.href !== '/dashboard');
          return (
            <Link 
              key={link.href}
              href={link.href}
              className={`relative flex flex-col items-center justify-center p-2 rounded-2xl transition-all duration-300 ${isActive ? 'text-red-600' : 'text-zinc-400'}`}
            >
              <link.icon size={24} strokeWidth={isActive ? 2.5 : 2} />
              {isActive && (
                <span className="absolute -bottom-1 w-1 h-1 rounded-full bg-red-600 shadow-lg" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* DESKTOP: Sidebar Gauche */}
      <nav className="hidden md:flex fixed left-0 top-0 h-screen w-24 bg-white border-r border-zinc-100 flex-col items-center py-10 z-40">
        <div className="flex-1 flex flex-col justify-center gap-8">
          {links.map((link) => {
             const isActive = pathname === link.href || (pathname.startsWith(link.href) && link.href !== '/dashboard');
             return (
              <Link 
                key={link.href}
                href={link.href}
                className={`p-3 rounded-2xl transition-all duration-300 group relative ${isActive ? 'bg-red-50 text-red-600' : 'text-zinc-400 hover:bg-zinc-50 hover:text-zinc-900'}`}
              >
                <link.icon size={24} />
                {/* Tooltip au survol */}
                <span className="absolute left-14 bg-zinc-900 text-white text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                  {link.label}
                </span>
              </Link>
             );
          })}
        </div>
      </nav>
    </>
  );
};