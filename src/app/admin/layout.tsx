import React from 'react';
import Link from 'next/link';
import { requireAdmin } from '../../auth/guards.js';
import { logoutAction } from './owners/actions.js';
import { ShutterMark } from '../../components/brand/ShutterMark';
import { AdminNav } from './AdminNav';
import { CommandPalette } from './CommandPalette';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = await requireAdmin();

  return (
    <div className="min-h-screen bg-stone-25 font-sans text-stone-900 flex flex-col">
      <CommandPalette />

      {/* Top Header */}
      <header className="sticky top-0 z-30 border-b border-stone-200 bg-white/95 backdrop-blur-md px-4 sm:px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/admin/shops" className="flex items-center gap-2">
              <ShutterMark size={24} />
              <div className="flex flex-col">
                <span className="font-display text-xl font-normal text-stone-900 leading-none">
                  shopfront
                </span>
                <span className="text-[10px] font-mono text-stone-500 uppercase tracking-wider mt-0.5">
                  Admin Control Tower
                </span>
              </div>
            </Link>
          </div>

          {/* Navigation Bar */}
          <AdminNav />

          {/* User profile & Sign Out */}
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-block text-xs font-mono text-stone-600 bg-stone-100 px-2.5 py-1 rounded-md">
              {user.display_name} ({user.username})
            </span>
            <form action={logoutAction}>
              <button
                type="submit"
                className="text-xs font-medium px-3 py-1.5 rounded-lg border border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-700 transition-colors shadow-paper"
              >
                Sign Out
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex-1 w-full space-y-6">
        {children}
      </main>
    </div>
  );
}
