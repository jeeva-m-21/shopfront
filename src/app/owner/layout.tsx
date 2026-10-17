import React from 'react';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { validateSession, deleteSession, SESSION_COOKIE_NAME } from '../../auth/sessions.js';

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
      <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        <header
          style={{
            backgroundColor: '#111827',
            color: '#ffffff',
            padding: '12px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span style={{ fontWeight: '700', fontSize: '18px' }}>Shopfront Owner Portal</span>
          <form action={ownerLogoutAction}>
            <button
              type="submit"
              style={{
                backgroundColor: '#374151',
                color: '#f3f4f6',
                border: '1px solid #4b5563',
                padding: '6px 12px',
                borderRadius: '4px',
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              Sign Out
            </button>
          </form>
        </header>
        <main style={{ maxWidth: '1000px', margin: '0 auto', padding: '24px' }}>
          {children}
        </main>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <header
        style={{
          backgroundColor: '#111827',
          color: '#ffffff',
          padding: '12px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          borderBottom: '1px solid #374151',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <span style={{ fontWeight: '700', fontSize: '18px', letterSpacing: '-0.02em' }}>
            Shopfront Owner
          </span>
          <nav style={{ display: 'flex', gap: '16px' }}>
            <Link href="/owner" style={{ color: '#d1d5db', textDecoration: 'none', fontSize: '14px', fontWeight: '500' }}>
              Dashboard
            </Link>
            <Link href="/owner/shop" style={{ color: '#d1d5db', textDecoration: 'none', fontSize: '14px', fontWeight: '500' }}>
              Shop Details
            </Link>
            <Link href="/owner/menu" style={{ color: '#d1d5db', textDecoration: 'none', fontSize: '14px', fontWeight: '500' }}>
              Menu
            </Link>
            <Link href="/owner/hours" style={{ color: '#d1d5db', textDecoration: 'none', fontSize: '14px', fontWeight: '500' }}>
              Hours
            </Link>
            <Link href="/owner/account" style={{ color: '#d1d5db', textDecoration: 'none', fontSize: '14px', fontWeight: '500' }}>
              Account
            </Link>
          </nav>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ fontSize: '13px', color: '#9ca3af' }}>
            {user.display_name} ({user.username})
          </span>
          <form action={ownerLogoutAction}>
            <button
              type="submit"
              style={{
                backgroundColor: '#374151',
                color: '#f3f4f6',
                border: '1px solid #4b5563',
                padding: '6px 12px',
                borderRadius: '4px',
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              Sign Out
            </button>
          </form>
        </div>
      </header>

      <main style={{ maxWidth: '1000px', margin: '0 auto', padding: '24px' }}>
        {children}
      </main>
    </div>
  );
}
