import React from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import { requireAdmin } from '../../../auth/guards.js';
import { listOwnersWithShops } from '../../../auth/owner-ops.js';
import { OwnersTable } from './OwnersTable.js';

export const metadata: Metadata = {
  title: 'Owners — Shopfront Admin',
};

export default async function AdminOwnersPage() {
  await requireAdmin();
  const owners = await listOwnersWithShops();

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
            Shop Owners
          </h1>
          <p style={{ fontSize: '14px', color: '#6b7280', margin: '4px 0 0 0' }}>
            Manage owner accounts, passwords, and listing assignments
          </p>
        </div>
        <Link
          href="/admin/owners/new"
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
          + New Owner
        </Link>
      </div>

      <OwnersTable initialOwners={owners} />
    </div>
  );
}
