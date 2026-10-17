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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#111827', margin: 0 }}>
          Account Settings
        </h1>
        <p style={{ margin: '4px 0 0 0', color: '#6b7280', fontSize: '14px' }}>
          Manage your account credentials and control your public shop listing visibility.
        </p>
      </div>

      <AccountManager user={user} shop={shop} />
    </div>
  );
}
