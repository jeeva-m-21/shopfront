'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import { makeShopLiveAction, pauseShopAction } from './actions.js';
import type { AdminShopListItem } from '../../../admin/shop-ops.js';

export function ShopsTable({ initialShops }: { initialShops: AdminShopListItem[] }) {
  const [shops] = useState<AdminShopListItem[]>(initialShops);
  const [isPending, startTransition] = useTransition();
  const [actionError, setActionError] = useState<string | null>(null);

  const handleMakeLive = (shop: AdminShopListItem) => {
    if (shop.available_items_count < 1) {
      alert('Add at least one available menu item first');
      return;
    }
    if (!confirm(`Publish '${shop.name}' and set status to Live?`)) return;

    setActionError(null);
    startTransition(async () => {
      const res = await makeShopLiveAction(shop.id);
      if (!res.success && res.error) {
        setActionError(res.error);
      } else {
        window.location.reload();
      }
    });
  };

  const handlePause = (shop: AdminShopListItem) => {
    if (!confirm(`Pause '${shop.name}'? Listing will be hidden and locked by admin.`)) return;

    setActionError(null);
    startTransition(async () => {
      const res = await pauseShopAction(shop.id);
      if (!res.success && res.error) {
        setActionError(res.error);
      } else {
        window.location.reload();
      }
    });
  };

  return (
    <div>
      {actionError && (
        <div
          role="alert"
          style={{
            padding: '12px',
            backgroundColor: '#fee2e2',
            border: '1px solid #f87171',
            borderRadius: '6px',
            color: '#991b1b',
            marginBottom: '16px',
            fontSize: '14px',
          }}
        >
          {actionError}
        </div>
      )}

      <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e5e7eb', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
          <thead>
            <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb', color: '#4b5563' }}>
              <th style={{ padding: '12px 16px', fontWeight: '600' }}>Shop Name & Slug</th>
              <th style={{ padding: '12px 16px', fontWeight: '600' }}>Category</th>
              <th style={{ padding: '12px 16px', fontWeight: '600' }}>Locality</th>
              <th style={{ padding: '12px 16px', fontWeight: '600' }}>Status</th>
              <th style={{ padding: '12px 16px', fontWeight: '600' }}>Owner</th>
              <th style={{ padding: '12px 16px', fontWeight: '600' }}>Items (Avail/Total)</th>
              <th style={{ padding: '12px 16px', fontWeight: '600', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {shops.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: '32px', textAlign: 'center', color: '#6b7280' }}>
                  No shops found.
                </td>
              </tr>
            ) : (
              shops.map((shop) => (
                <tr key={shop.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ fontWeight: '600', color: '#111827' }}>{shop.name}</div>
                    <div style={{ fontSize: '12px', color: '#6b7280', fontFamily: 'monospace' }}>
                      /{shop.slug}
                      {shop.is_sample_data && (
                        <span
                          style={{
                            marginLeft: '6px',
                            backgroundColor: '#e0e7ff',
                            color: '#3730a3',
                            fontSize: '10px',
                            padding: '1px 5px',
                            borderRadius: '4px',
                            fontWeight: '600',
                          }}
                        >
                          SAMPLE
                        </span>
                      )}
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px', color: '#374151', textTransform: 'capitalize' }}>
                    {shop.category.replace('_', ' ')}
                  </td>
                  <td style={{ padding: '12px 16px', color: '#374151' }}>
                    {shop.locality_name}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '2px 8px',
                        borderRadius: '9999px',
                        fontSize: '12px',
                        fontWeight: '600',
                        backgroundColor:
                          shop.status === 'live'
                            ? '#dcfce7'
                            : shop.status === 'paused'
                            ? '#fef3c7'
                            : '#f3f4f6',
                        color:
                          shop.status === 'live'
                            ? '#15803d'
                            : shop.status === 'paused'
                            ? '#92400e'
                            : '#4b5563',
                      }}
                    >
                      {shop.status.toUpperCase()}
                    </span>
                    {shop.admin_locked && shop.status === 'paused' && (
                      <span
                        style={{
                          display: 'block',
                          fontSize: '10px',
                          color: '#b91c1c',
                          fontWeight: '600',
                          marginTop: '2px',
                        }}
                      >
                        Admin Locked
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '12px 16px', color: '#4b5563' }}>
                    {shop.owner_username ? (
                      <span>{shop.owner_display_name} ({shop.owner_username})</span>
                    ) : (
                      <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>Unassigned</span>
                    )}
                  </td>
                  <td style={{ padding: '12px 16px', color: '#374151' }}>
                    <span
                      style={{
                        fontWeight: '600',
                        color: shop.available_items_count > 0 ? '#15803d' : '#dc2626',
                      }}
                    >
                      {shop.available_items_count}
                    </span>{' '}
                    / {shop.total_items_count}
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '8px' }}>
                      <Link
                        href={`/admin/shops/${shop.id}`}
                        style={{
                          padding: '4px 8px',
                          backgroundColor: '#f3f4f6',
                          border: '1px solid #d1d5db',
                          borderRadius: '4px',
                          fontSize: '12px',
                          color: '#1f2937',
                          textDecoration: 'none',
                        }}
                      >
                        Manage
                      </Link>
                      {shop.status !== 'live' ? (
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => handleMakeLive(shop)}
                          style={{
                            padding: '4px 8px',
                            backgroundColor: '#dcfce7',
                            border: '1px solid #86efac',
                            borderRadius: '4px',
                            fontSize: '12px',
                            color: '#166534',
                            fontWeight: '600',
                            cursor: isPending ? 'not-allowed' : 'pointer',
                          }}
                        >
                          Make Live
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => handlePause(shop)}
                          style={{
                            padding: '4px 8px',
                            backgroundColor: '#fef3c7',
                            border: '1px solid #fcd34d',
                            borderRadius: '4px',
                            fontSize: '12px',
                            color: '#92400e',
                            fontWeight: '600',
                            cursor: isPending ? 'not-allowed' : 'pointer',
                          }}
                        >
                          Pause
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
