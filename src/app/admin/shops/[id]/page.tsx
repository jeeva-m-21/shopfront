import React from 'react';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { requireAdmin } from '../../../../auth/guards.js';
import { query } from '../../../../db.js';
import { getAdminShopById } from '../../../../admin/shop-ops.js';
import { EditShopForm } from './EditShopForm.js';

export const metadata: Metadata = {
  title: 'Edit Shop — Shopfront Admin',
};

export default async function AdminEditShopPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;

  const shop = await getAdminShopById(id);
  if (!shop) {
    notFound();
  }

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
     WHERE u.role = 'owner' AND (s.id IS NULL OR s.id = $1)
     ORDER BY u.username ASC;`,
    [shop.id]
  );

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#111827', margin: 0 }}>
          Manage Listing: {shop.name}
        </h1>
        <p style={{ fontSize: '14px', color: '#6b7280', margin: '4px 0 0 0' }}>
          Edit listing details, publication status, and store location
        </p>
      </div>

      <EditShopForm
        shop={shop}
        localities={localitiesRes.rows}
        owners={ownersRes.rows}
      />
    </div>
  );
}
