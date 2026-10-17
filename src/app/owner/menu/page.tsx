import React from 'react';
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
            Menu & Catalog
          </h1>
          <p style={{ color: '#6b7280', fontSize: '15px' }}>
            No shop is assigned to your account yet. Contact the admin.
          </p>
        </div>
      </div>
    );
  }

  const { shop, items } = result;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#111827', margin: 0 }}>
          Manage Menu & Services
        </h1>
        <p style={{ margin: '4px 0 0 0', color: '#6b7280', fontSize: '14px' }}>
          Add, organize, and price your items. Customers see only items marked available.
        </p>
      </div>

      <MenuManager shop={shop} initialItems={items} />
    </div>
  );
}
