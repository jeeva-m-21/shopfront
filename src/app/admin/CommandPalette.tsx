'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  Store,
  Users,
  Terminal,
  ShieldAlert,
  Compass,
  ArrowRight,
  X,
  PlusCircle,
} from 'lucide-react';

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const router = useRouter();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      } else if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const commands = [
    { title: 'All Verified Shops', href: '/admin/shops', icon: Store, category: 'Navigation' },
    { title: 'Create New Shop', href: '/admin/shops/new', icon: PlusCircle, category: 'Actions' },
    { title: 'Owner Accounts', href: '/admin/owners', icon: Users, category: 'Navigation' },
    { title: 'Search Engine Debugger (Two-Stage)', href: '/admin/search-debugger', icon: Terminal, category: 'Diagnostics' },
    { title: 'Search & MCP Telemetry Logs', href: '/admin/logs', icon: Compass, category: 'Observability' },
    { title: 'Security Audit Log', href: '/admin/audit', icon: ShieldAlert, category: 'Security' },
    { title: 'Public Directory (Live View)', href: '/', icon: Store, category: 'External' },
    { title: 'Connect Agent & MCP Guide', href: '/connect', icon: Terminal, category: 'External' },
  ];

  const filteredCommands = query.trim()
    ? commands.filter((c) => c.title.toLowerCase().includes(query.toLowerCase()))
    : commands;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-sm flex items-start justify-center pt-20 px-4">
      <div className="bg-white border border-stone-200 rounded-2xl shadow-paper-lg w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100">
        {/* Search Input Bar */}
        <div className="p-4 border-b border-stone-200 flex items-center gap-3">
          <Search className="w-4 h-4 text-stone-400 shrink-0" />
          <input
            type="text"
            autoFocus
            placeholder="Type a command or navigate... (ESC to close)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none bg-transparent font-sans"
          />
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="p-1 rounded-md text-stone-400 hover:text-stone-600 hover:bg-stone-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Command List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {filteredCommands.length === 0 ? (
            <div className="py-8 text-center text-xs text-stone-400 font-mono">
              No matching commands found
            </div>
          ) : (
            filteredCommands.map((cmd) => {
              const Icon = cmd.icon;
              return (
                <button
                  key={cmd.href}
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    router.push(cmd.href);
                  }}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl text-left hover:bg-stone-50 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-stone-100 flex items-center justify-center text-stone-600 group-hover:text-marina-600 group-hover:bg-marina-50">
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-medium text-stone-800 group-hover:text-marina-800">
                      {cmd.title}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-stone-400 px-1.5 py-0.5 rounded bg-stone-100">
                      {cmd.category}
                    </span>
                    <ArrowRight className="w-3 h-3 text-stone-300 group-hover:text-marina-600 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2.5 bg-stone-50 border-t border-stone-200 flex items-center justify-between text-[11px] font-mono text-stone-500">
          <span>Navigate with mouse or keyboard</span>
          <span>Press ESC to exit</span>
        </div>
      </div>
    </div>
  );
}
