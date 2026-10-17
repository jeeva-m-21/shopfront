import React from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import { requireAdmin } from '../../../auth/guards.js';
import { listAdminShops } from '../../../admin/shop-ops.js';
import { ShopsTable } from './ShopsTable.js';

export const metadata: Metadata = {
  title: 'Shops — Shopfront Admin',
};

export default async function AdminShopsPage() {
  await requireAdmin();
  const shops = await listAdminShops();

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
        }}
      >
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#111827', margin: 0 }}>
            Shop Directory
          </h1>
          <p style={{ fontSize: '14px', color: '#6b7280', margin: '4px 0 0 0' }}>
            Manage listings, categories, publication status, and owner assignments
          </p>
        </div>
        <Link
          href="/admin/shops/new"
          style={{
            display: 'inline-block',
            backgroundColor: '#2563eb',
            color: '#ffffff',
            padding: '10px 16px',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: '600',
            textDecoration: 'none',
          }}
        >
          + New Shop
        </Link>
      </div>

      <ShopsTable initialShops={shops} />
    </div>
  );
}
