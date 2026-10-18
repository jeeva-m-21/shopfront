'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Store,
  Users,
  Terminal,
  Activity,
  ShieldCheck,
  Search,
} from 'lucide-react';

export function AdminNav() {
  const pathname = usePathname();

  const links = [
    { href: '/admin/shops', label: 'Shops', icon: Store },
    { href: '/admin/owners', label: 'Owners', icon: Users },
    { href: '/admin/search-debugger', label: 'Search Debugger', icon: Terminal },
    { href: '/admin/logs', label: 'Telemetry', icon: Activity },
    { href: '/admin/audit', label: 'Audit', icon: ShieldCheck },
  ];

  const triggerCommandPalette = () => {
    window.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true })
    );
  };

  return (
    <div className="flex items-center gap-3">
      {/* Navigation tabs */}
      <nav className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl border border-stone-200">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                isActive
                  ? 'bg-white text-stone-900 shadow-paper font-semibold'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{link.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Command Palette Trigger */}
      <button
        type="button"
        onClick={triggerCommandPalette}
        className="hidden lg:inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-600 text-xs shadow-paper transition-colors"
      >
        <Search className="w-3.5 h-3.5 text-stone-400" />
        <span>Quick search</span>
        <kbd className="font-mono text-[10px] bg-stone-100 border border-stone-200 px-1.5 py-0.5 rounded text-stone-500">
          ⌘K
        </kbd>
      </button>
    </div>
  );
}
