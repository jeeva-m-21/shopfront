import React from 'react';
import { Store } from 'lucide-react';
import { requireOwner } from '../../../auth/guards.js';
import { listOwnerMenuItems } from '../../../owner/menu-ops.js';
import { MenuManager } from './MenuManager.js';

export default async function OwnerMenuPage() {
  const { user } = await requireOwner('/owner/menu');

  let result;
  try {
    result = await listOwnerMenuItems(user.id);
  } catch {
    return (
      <div className="py-8">
        <div className="bg-white rounded-2xl border border-stone-200 p-8 text-center max-w-md mx-auto shadow-paper">
          <Store className="w-10 h-10 text-stone-300 mx-auto mb-3" />
          <h1 className="font-display text-xl text-stone-900 mb-1">Menu & Catalog</h1>
          <p className="text-xs text-stone-500 font-sans">
            No shop is assigned to your account yet. Contact the admin.
          </p>
        </div>
      </div>
    );
  }

  const { shop, items } = result;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-normal text-stone-900">
          Manage Menu & Services
        </h1>
        <p className="text-xs text-stone-500 font-sans mt-0.5">
          Add, organize, and price your items. Customers and AI agents see only items marked available.
        </p>
      </div>

      <MenuManager shop={shop} initialItems={items} />
    </div>
  );
}
