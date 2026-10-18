import React from 'react';
import { requireOwner } from '../../../auth/guards.js';
import { getOwnerShop } from '../../../owner/shop-ops.js';
import { AccountManager } from './AccountManager.js';

export default async function OwnerAccountPage() {
  const { user } = await requireOwner('/owner/account');

  let shop = null;
  try {
    shop = await getOwnerShop(user.id);
  } catch {
    shop = null;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-normal text-stone-900">
          Account Settings
        </h1>
        <p className="text-xs text-stone-500 font-sans mt-0.5">
          Manage your account credentials and control your public shop listing visibility.
        </p>
      </div>

      <AccountManager user={user} shop={shop} />
    </div>
  );
}
