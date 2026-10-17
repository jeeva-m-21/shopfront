import React from 'react';
import Link from 'next/link';
import { requireAdmin } from '../../auth/guards.js';
import { logoutAction } from './owners/actions.js';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = await requireAdmin();

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <header
        style={{
          backgroundColor: '#1f2937',
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
            Shopfront Admin
          </span>
          <nav style={{ display: 'flex', gap: '16px' }}>
            <Link
              href="/admin/shops"
              style={{ color: '#d1d5db', textDecoration: 'none', fontSize: '14px', fontWeight: '500' }}
            >
              Shops
            </Link>
            <Link
              href="/admin/owners"
              style={{ color: '#d1d5db', textDecoration: 'none', fontSize: '14px', fontWeight: '500' }}
            >
              Owners
            </Link>
            <Link
              href="/admin/logs"
              style={{ color: '#d1d5db', textDecoration: 'none', fontSize: '14px', fontWeight: '500' }}
            >
              Logs
            </Link>
            <Link
              href="/admin/audit"
              style={{ color: '#d1d5db', textDecoration: 'none', fontSize: '14px', fontWeight: '500' }}
            >
              Audit
            </Link>
          </nav>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ fontSize: '13px', color: '#9ca3af' }}>
            {user.display_name} ({user.username})
          </span>
          <form action={logoutAction}>
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

      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
        {children}
      </main>
    </div>
  );
}
