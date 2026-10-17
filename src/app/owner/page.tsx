import React from 'react';
import Link from 'next/link';
import { requireOwner } from '../../auth/guards.js';
import { getOwnerDashboard } from '../../owner/shop-ops.js';

export default async function OwnerDashboardPage() {
  const { user } = await requireOwner('/owner');
  const dashboard = await getOwnerDashboard(user.id);

  if (!dashboard) {
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
            Owner Dashboard
          </h1>
          <p style={{ color: '#6b7280', fontSize: '15px' }}>
            No shop is assigned to your account yet. Contact the admin.
          </p>
        </div>
      </div>
    );
  }

  const { shop, available_items_count, total_items_count, menu_updated_text, banners } = dashboard;

  const statusColors = {
    draft: { bg: '#fef3c7', text: '#92400e', label: 'Draft' },
    live: { bg: '#dcfce7', text: '#15803d', label: 'Live' },
    paused: { bg: '#fee2e2', text: '#b91c1c', label: 'Paused' },
  }[shop.status];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Banner Alerts */}
      {banners.showUnknownHoursBanner && (
        <div
          role="status"
          style={{
            backgroundColor: '#eff6ff',
            border: '1px solid #bfdbfe',
            color: '#1e40af',
            padding: '12px 16px',
            borderRadius: '6px',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span>Add opening hours so customers can find you when you are open</span>
          <Link
            href="/owner/hours"
            style={{
              fontWeight: '600',
              textDecoration: 'underline',
              color: '#1d4ed8',
              marginLeft: '12px',
            }}
          >
            Set Hours
          </Link>
        </div>
      )}

      {banners.showDraftBanner && (
        <div
          role="status"
          style={{
            backgroundColor: '#fffbeb',
            border: '1px solid #fde68a',
            color: '#92400e',
            padding: '12px 16px',
            borderRadius: '6px',
            fontSize: '14px',
          }}
        >
          Your listing is a draft. Contact the admin to publish it.
        </div>
      )}

      {banners.showAdminLockedBanner && (
        <div
          role="alert"
          style={{
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#b91c1c',
            padding: '12px 16px',
            borderRadius: '6px',
            fontSize: '14px',
          }}
        >
          Paused by admin. Contact the admin to resume.
        </div>
      )}

      {/* Header with Shop Name & Status */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          border: '1px solid #e5e7eb',
          padding: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#111827', margin: 0 }}>
              {shop.name}
            </h1>
            <span
              style={{
                display: 'inline-block',
                padding: '4px 10px',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: '600',
                backgroundColor: statusColors.bg,
                color: statusColors.text,
              }}
            >
              {statusColors.label}
            </span>
          </div>
          <p style={{ margin: '4px 0 0 0', color: '#6b7280', fontSize: '14px' }}>
            {shop.locality_name} • {shop.address}
          </p>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>
            {available_items_count} of {total_items_count} items available
          </div>
          <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '2px' }}>
            {menu_updated_text}
          </div>
        </div>
      </div>

      {/* Navigation Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
        }}
      >
        <Link
          href="/owner/shop"
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            border: '1px solid #e5e7eb',
            padding: '20px',
            textDecoration: 'none',
            color: 'inherit',
            transition: 'border-color 0.2s',
          }}
        >
          <div style={{ fontWeight: '600', fontSize: '16px', color: '#111827', marginBottom: '6px' }}>
            Shop Details
          </div>
          <div style={{ fontSize: '13px', color: '#6b7280' }}>
            Edit name, contact phone, WhatsApp, and booking links.
          </div>
        </Link>

        <Link
          href="/owner/menu"
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            border: '1px solid #e5e7eb',
            padding: '20px',
            textDecoration: 'none',
            color: 'inherit',
            transition: 'border-color 0.2s',
          }}
        >
          <div style={{ fontWeight: '600', fontSize: '16px', color: '#111827', marginBottom: '6px' }}>
            Menu & Catalog
          </div>
          <div style={{ fontSize: '13px', color: '#6b7280' }}>
            Manage services or items, pricing, tags, and item availability.
          </div>
        </Link>

        <Link
          href="/owner/hours"
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            border: '1px solid #e5e7eb',
            padding: '20px',
            textDecoration: 'none',
            color: 'inherit',
            transition: 'border-color 0.2s',
          }}
        >
          <div style={{ fontWeight: '600', fontSize: '16px', color: '#111827', marginBottom: '6px' }}>
            Opening Hours
          </div>
          <div style={{ fontSize: '13px', color: '#6b7280' }}>
            Configure weekly business schedules and planned holiday closures.
          </div>
        </Link>

        <Link
          href="/owner/account"
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            border: '1px solid #e5e7eb',
            padding: '20px',
            textDecoration: 'none',
            color: 'inherit',
            transition: 'border-color 0.2s',
          }}
        >
          <div style={{ fontWeight: '600', fontSize: '16px', color: '#111827', marginBottom: '6px' }}>
            Account & Listing Status
          </div>
          <div style={{ fontSize: '13px', color: '#6b7280' }}>
            Update your password or pause/resume your shop listing.
          </div>
        </Link>
      </div>
    </div>
  );
}
