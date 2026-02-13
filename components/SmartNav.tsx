'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutGrid, 
  CalendarDays, 
  BarChart2, 
  MessageSquare, 
  Settings 
} from 'lucide-react';

const NavItem = ({ href, icon: Icon, label, isActive }: any) => (
  <Link 
    href={href}
    className={`
      relative flex flex-col items-center justify-center p-2 rounded-2xl transition-all duration-300
      ${isActive ? 'text-brand-red' : 'text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100'}
    `}
  >
    <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
    {isActive && (
      <span className="absolute -bottom-1 w-1 h-1 rounded-full bg-brand-red shadow-[0_0_8px_rgba(220,38,38,0.8)]" />
    )}
  </Link>
);

export const SmartNav = () => {
  const pathname = usePathname();

  const links = [
    { href: '/dashboard', icon: LayoutGrid, label: 'Dash' },
    { href: '/calendar', icon: CalendarDays, label: 'Planning' },
    { href: '/analytics', icon: BarChart2, label: 'Stats' },
    { href: '/coach', icon: MessageSquare, label: 'Coach' },
    { href: '/settings', icon: Settings, label: 'Réglages' },
  ];

  return (
    <>
      {/* MOBILE: Barre en bas */}
      <nav className="md:hidden fixed bottom-4 left-4 right-4 h-16 glass-light rounded-3xl flex items-center justify-around px-2 z-50 shadow-2xl shadow-zinc-200/50 bg-white/80 backdrop-blur-xl border border-white/60">
        {links.map((link) => (
          <NavItem 
            key={link.href} 
            {...link} 
            isActive={pathname === link.href} 
          />
        ))}
      </nav>

      {/* DESKTOP: Sidebar Gauche */}
      <nav className="hidden md:flex fixed left-0 top-0 h-screen w-24 bg-white border-r border-zinc-100 flex-col items-center py-10 z-40">
        <div className="flex-1 flex flex-col justify-center gap-8">
          {links.map((link) => (
            <Link 
              key={link.href}
              href={link.href}
              className={`
                p-3 rounded-2xl transition-all duration-300 group relative
                ${pathname === link.href 
                  ? 'bg-red-50 text-brand-red' 
                  : 'text-zinc-400 hover:bg-zinc-50 hover:text-zinc-900'}
              `}
            >
              <link.icon size={24} />
              <span className="absolute left-14 bg-zinc-900 text-white text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                {link.label}
              </span>
            </Link>
          ))}
        </div>
      </nav>
    </>
  );
};