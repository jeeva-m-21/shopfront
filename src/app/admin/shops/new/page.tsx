import React from 'react';
import type { Metadata } from 'next';
import { requireAdmin } from '../../../../auth/guards.js';
import { query } from '../../../../db.js';
import { NewShopForm } from './NewShopForm.js';

export const metadata: Metadata = {
  title: 'New Shop — Shopfront Admin',
};

export default async function NewShopPage() {
  await requireAdmin();

  const localitiesRes = await query<{
    id: number;
    name: string;
    lat: number;
    lng: number;
  }>(
    `SELECT id, name, ST_Y(center::geometry) AS lat, ST_X(center::geometry) AS lng
     FROM localities
     ORDER BY name ASC;`
  );

  const ownersRes = await query<{
    id: string;
    username: string;
    display_name: string;
  }>(
    `SELECT u.id, u.username, u.display_name
     FROM users u
     LEFT JOIN shops s ON s.owner_id = u.id
     WHERE u.role = 'owner' AND s.id IS NULL
     ORDER BY u.username ASC;`
  );

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#111827', margin: 0 }}>
          Create New Shop Listing
        </h1>
        <p style={{ fontSize: '14px', color: '#6b7280', margin: '4px 0 0 0' }}>
          Add a verified business listing in Chennai. Saved initially as Draft.
        </p>
      </div>

      <NewShopForm
        localities={localitiesRes.rows}
        availableOwners={ownersRes.rows}
      />
    </div>
  );
}
