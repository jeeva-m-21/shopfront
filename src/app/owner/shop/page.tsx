import React from 'react';
import { Store } from 'lucide-react';
import { requireOwner } from '../../../auth/guards.js';
import { getOwnerShop } from '../../../owner/shop-ops.js';
import { EditShopForm } from './EditShopForm.js';

export default async function OwnerShopPage() {
  const { user } = await requireOwner('/owner/shop');

  let shop;
  try {
    shop = await getOwnerShop(user.id);
  } catch {
    return (
      <div className="py-8">
        <div className="bg-white rounded-2xl border border-stone-200 p-8 text-center max-w-md mx-auto shadow-paper">
          <Store className="w-10 h-10 text-stone-300 mx-auto mb-3" />
          <h1 className="font-display text-xl text-stone-900 mb-1">Shop Details</h1>
          <p className="text-xs text-stone-500 font-sans">
            No shop is assigned to your account yet. Contact the admin.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-normal text-stone-900">
          Edit Shop Details
        </h1>
        <p className="text-xs text-stone-500 font-sans mt-0.5">
          Update your public store profile, contact numbers, and customer enquiry options.
        </p>
      </div>

      <EditShopForm shop={shop} />
    </div>
  );
}
