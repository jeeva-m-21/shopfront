import React from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import { Plus } from 'lucide-react';
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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-normal text-stone-900">
            Shop Directory
          </h1>
          <p className="text-xs text-stone-500 font-sans mt-0.5">
            Manage merchant listings, categories, publication status, and owner assignments across Chennai.
          </p>
        </div>
        <Link
          href="/admin/shops/new"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-marina-600 hover:bg-marina-700 text-white transition-colors shadow-paper self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Shop</span>
        </Link>
      </div>

      <ShopsTable initialShops={shops} />
    </div>
  );
}
