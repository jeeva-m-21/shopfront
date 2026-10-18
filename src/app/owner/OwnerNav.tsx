'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Calendar,
  UtensilsCrossed,
  Clock,
  Store,
  Settings,
} from 'lucide-react';

export function OwnerNav() {
  const pathname = usePathname();

  const navItems = [
    { href: '/owner', label: 'Today', icon: Calendar, exact: true },
    { href: '/owner/menu', label: 'Catalog', icon: UtensilsCrossed },
    { href: '/owner/hours', label: 'Hours', icon: Clock },
    { href: '/owner/shop', label: 'Profile', icon: Store },
    { href: '/owner/account', label: 'Account', icon: Settings },
  ];

  return (
    <>
      {/* Desktop Top Nav */}
      <nav className="hidden md:flex items-center gap-1 bg-stone-100 p-1 rounded-xl border border-stone-200">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                isActive
                  ? 'bg-white text-stone-900 shadow-paper font-semibold'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Mobile Fixed Bottom Tab Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-stone-200 px-2 py-1.5 flex items-center justify-around shadow-lg">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center min-w-[56px] min-h-[48px] py-1 px-2 rounded-xl transition-colors ${
                isActive
                  ? 'text-marina-700 font-semibold'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              <Icon className={`w-5 h-5 mb-0.5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
              <span className="text-[10px] leading-none font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
