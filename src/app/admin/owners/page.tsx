import React from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import { Plus } from 'lucide-react';
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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-normal text-stone-900">
            Shop Owners
          </h1>
          <p className="text-xs text-stone-500 font-sans mt-0.5">
            Manage merchant accounts, credentials, and business assignments.
          </p>
        </div>
        <Link
          href="/admin/owners/new"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-marina-600 hover:bg-marina-700 text-white transition-colors shadow-paper self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Owner</span>
        </Link>
      </div>

      <OwnersTable initialOwners={owners} />
    </div>
  );
}
