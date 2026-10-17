import React from 'react';
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
      <div style={{ padding: '32px 0' }}>
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            border: '1px solid #e5e7eb',
            padding: '32px',
            textAlign: 'center',
          }}
        >
          <h1 style={{ fontSize: '20px', fontWeight: '700', color: '#111827', marginBottom: '8px' }}>
            Shop Details
          </h1>
          <p style={{ color: '#6b7280', fontSize: '15px' }}>
            No shop is assigned to your account yet. Contact the admin.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#111827', margin: 0 }}>
          Edit Shop Details
        </h1>
        <p style={{ margin: '4px 0 0 0', color: '#6b7280', fontSize: '14px' }}>
          Update your public store profile, contact numbers, and customer enquiry options.
        </p>
      </div>

      <EditShopForm shop={shop} />
    </div>
  );
}
