import React from 'react';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { validateSession, deleteSession, SESSION_COOKIE_NAME } from '../../auth/sessions.js';
import { ShutterMark } from '../../components/brand/ShutterMark';
import { OwnerNav } from './OwnerNav';

export const dynamic = 'force-dynamic';

async function ownerLogoutAction(): Promise<void> {
  'use server';
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (token) {
    await deleteSession(token);
    cookieStore.delete(SESSION_COOKIE_NAME);
  }
  redirect('/login');
}

export default async function OwnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    redirect('/login');
  }

  const sessionResult = await validateSession(token);
  if (!sessionResult || sessionResult.user.role !== 'owner' || !sessionResult.user.is_active) {
    redirect('/login');
  }

  const { user } = sessionResult;

  // If user must change password, render without navigation bar to keep user focused
  if (user.must_change_password) {
    return (
      <div className="min-h-screen bg-stone-25 font-sans text-stone-900 flex flex-col">
        <header className="border-b border-stone-200 bg-white px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShutterMark size={22} />
            <span className="font-display text-lg font-normal text-stone-900">
              shopfront merchant
            </span>
          </div>
          <form action={ownerLogoutAction}>
            <button
              type="submit"
              className="text-xs font-medium px-3 py-1.5 rounded-lg border border-stone-300 text-stone-700 hover:bg-stone-50"
            >
              Sign Out
            </button>
          </form>
        </header>
        <main className="max-w-md mx-auto px-4 py-12 flex-1 w-full">
          {children}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-25 font-sans text-stone-900 flex flex-col">
      {/* Top Header */}
      <header className="sticky top-0 z-30 border-b border-stone-200 bg-white/95 backdrop-blur-md px-4 sm:px-6 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/owner" className="flex items-center gap-2">
              <ShutterMark size={24} />
              <div className="flex flex-col">
                <span className="font-display text-xl font-normal text-stone-900 leading-none">
                  shopfront
                </span>
                <span className="text-[10px] font-mono text-stone-500 uppercase tracking-wider mt-0.5">
                  Merchant Control
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:block">
            <OwnerNav />
          </div>

          {/* User profile & Sign Out */}
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-block text-xs font-mono text-stone-600 bg-stone-100 px-2.5 py-1 rounded-md">
              {user.display_name}
            </span>
            <form action={ownerLogoutAction}>
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
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 pb-24 md:pb-12 flex-1 w-full space-y-6">
        {children}
      </main>

      {/* Mobile Fixed Bottom Nav */}
      <OwnerNav />
    </div>
  );
}
