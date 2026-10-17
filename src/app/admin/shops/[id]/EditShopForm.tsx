'use client';

import React, { useState, useTransition, useActionState } from 'react';
import Link from 'next/link';
import {
  updateShopAction,
  makeShopLiveAction,
  pauseShopAction,
  deleteShopAction,
  type ShopActionState,
} from '../actions.js';
import type { AdminShopRecord } from '../../../../admin/shop-ops.js';
import type { LocalityOption, OwnerOption } from '../new/NewShopForm.js';

export function EditShopForm({
  shop,
  localities,
  owners,
}: {
  shop: AdminShopRecord;
  localities: LocalityOption[];
  owners: OwnerOption[];
}) {
  const updateActionWithId = updateShopAction.bind(null, shop.id);
  const [state, formAction, isPending] = useActionState<ShopActionState, FormData>(
    updateActionWithId,
    {}
  );

  const [isTransitioning, startTransition] = useTransition();
  const [actionError, setActionError] = useState<string | null>(null);
  const [deleteConfirmationSlug, setDeleteConfirmationSlug] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const handleMakeLive = () => {
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

  const handlePause = () => {
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

  const handleDelete = () => {
    if (deleteConfirmationSlug.trim() !== shop.slug) {
      alert(`Entered slug '${deleteConfirmationSlug}' does not match '${shop.slug}'.`);
      return;
    }

    if (!confirm(`WARNING: Are you absolutely sure you want to permanently delete '${shop.name}'? This cannot be undone.`)) {
      return;
    }

    setActionError(null);
    startTransition(async () => {
      const res = await deleteShopAction(shop.id, deleteConfirmationSlug);
      if (!res.success && res.error) {
        setActionError(res.error);
      }
    });
  };

  return (
    <div style={{ maxWidth: '720px' }}>
      {/* Status banner and quick actions */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          border: '1px solid #e5e7eb',
          padding: '16px 24px',
          marginBottom: '24px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span
            style={{
              padding: '4px 12px',
              borderRadius: '9999px',
              fontSize: '13px',
              fontWeight: '700',
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
            STATUS: {shop.status.toUpperCase()}
          </span>
          {shop.admin_locked && (
            <span style={{ fontSize: '12px', color: '#b91c1c', fontWeight: '600' }}>
              (Admin Locked)
            </span>
          )}
          {shop.status === 'live' && (
            <Link
              href={`/shop/${shop.slug}`}
              target="_blank"
              style={{ fontSize: '13px', color: '#2563eb', textDecoration: 'underline' }}
            >
              View Public Page ↗
            </Link>
          )}
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          {shop.status !== 'live' ? (
            <button
              type="button"
              disabled={isTransitioning}
              onClick={handleMakeLive}
              style={{
                padding: '8px 16px',
                backgroundColor: '#16a34a',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: '600',
                cursor: isTransitioning ? 'not-allowed' : 'pointer',
              }}
            >
              Make Live
            </button>
          ) : (
            <button
              type="button"
              disabled={isTransitioning}
              onClick={handlePause}
              style={{
                padding: '8px 16px',
                backgroundColor: '#d97706',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: '600',
                cursor: isTransitioning ? 'not-allowed' : 'pointer',
              }}
            >
              Pause Listing
            </button>
          )}
          <button
            type="button"
            onClick={() => setShowDeleteModal(true)}
            style={{
              padding: '8px 16px',
              backgroundColor: '#fee2e2',
              color: '#991b1b',
              border: '1px solid #f87171',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
            }}
          >
            Delete Shop
          </button>
        </div>
      </div>

      {(actionError || state.error) && (
        <div
          role="alert"
          style={{
            padding: '12px 16px',
            backgroundColor: '#fee2e2',
            border: '1px solid #f87171',
            borderRadius: '6px',
            color: '#991b1b',
            marginBottom: '20px',
            fontSize: '14px',
            fontWeight: '500',
          }}
        >
          {actionError || state.error}
        </div>
      )}

      {state.success && (
        <div
          style={{
            padding: '12px 16px',
            backgroundColor: '#dcfce7',
            border: '1px solid #86efac',
            borderRadius: '6px',
            color: '#166534',
            marginBottom: '20px',
            fontSize: '14px',
            fontWeight: '600',
          }}
        >
          ✓ Shop details updated successfully!
        </div>
      )}

      {/* Edit details form */}
      <form
        action={formAction}
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          border: '1px solid #e5e7eb',
          padding: '32px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
        }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <label htmlFor="name" style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '6px' }}>
              Shop Name <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              defaultValue={shop.name}
              style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label htmlFor="slug" style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '6px' }}>
              URL Slug <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <input
              id="slug"
              name="slug"
              type="text"
              required
              pattern="^[a-z0-9-]{3,60}$"
              defaultValue={shop.slug}
              style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', fontFamily: 'monospace', boxSizing: 'border-box' }}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <label htmlFor="category" style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '6px' }}>
              Category <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <select
              id="category"
              name="category"
              required
              defaultValue={shop.category}
              style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }}
            >
              <option value="food_beverage">Food & Beverage</option>
              <option value="repair_service">Repair & Service</option>
              <option value="salon_wellness">Salon & Wellness</option>
            </select>
          </div>

          <div>
            <label htmlFor="locality_id" style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '6px' }}>
              Locality <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <select
              id="locality_id"
              name="locality_id"
              required
              defaultValue={shop.locality_id}
              style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }}
            >
              {localities.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="description" style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '6px' }}>
            Description <span style={{ color: '#dc2626' }}>*</span>
          </label>
          <textarea
            id="description"
            name="description"
            required
            minLength={10}
            maxLength={500}
            rows={3}
            defaultValue={shop.description}
            style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }}
          />
        </div>

        <div>
          <label htmlFor="address" style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '6px' }}>
            Street Address <span style={{ color: '#dc2626' }}>*</span>
          </label>
          <input
            id="address"
            name="address"
            type="text"
            required
            minLength={5}
            maxLength={200}
            defaultValue={shop.address}
            style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <label htmlFor="latitude" style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '6px' }}>
              Latitude <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <input
              id="latitude"
              name="latitude"
              type="number"
              step="0.000001"
              required
              defaultValue={shop.latitude}
              style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label htmlFor="longitude" style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '6px' }}>
              Longitude <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <input
              id="longitude"
              name="longitude"
              type="number"
              step="0.000001"
              required
              defaultValue={shop.longitude}
              style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <label htmlFor="phone" style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '6px' }}>
              Phone <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              required
              pattern="^\+91\d{10}$"
              defaultValue={shop.phone}
              style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label htmlFor="whatsapp" style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '6px' }}>
              WhatsApp
            </label>
            <input
              id="whatsapp"
              name="whatsapp"
              type="tel"
              pattern="^\+91[6-9]\d{9}$"
              defaultValue={shop.whatsapp || ''}
              style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <label htmlFor="action_mode" style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '6px' }}>
              Action Mode <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <select
              id="action_mode"
              name="action_mode"
              required
              defaultValue={shop.action_mode}
              style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }}
            >
              <option value="phone_only">Call Phone Only</option>
              <option value="whatsapp">WhatsApp Order / Chat</option>
              <option value="external_url">External Booking / Order Link</option>
            </select>
          </div>

          <div>
            <label htmlFor="owner_id" style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '6px' }}>
              Assign Owner
            </label>
            <select
              id="owner_id"
              name="owner_id"
              defaultValue={shop.owner_id || ''}
              style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }}
            >
              <option value="">No owner assigned</option>
              {owners.map((owner) => (
                <option key={owner.id} value={owner.id}>
                  {owner.display_name} ({owner.username})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <label htmlFor="booking_url" style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '6px' }}>
              Booking URL
            </label>
            <input
              id="booking_url"
              name="booking_url"
              type="url"
              pattern="^https://\S+$"
              defaultValue={shop.booking_url || ''}
              style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label htmlFor="website_url" style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '6px' }}>
              Website URL
            </label>
            <input
              id="website_url"
              name="website_url"
              type="url"
              pattern="^https://\S+$"
              defaultValue={shop.website_url || ''}
              style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }}
            />
          </div>
        </div>

        <div>
          <label htmlFor="action_instructions" style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '6px' }}>
            Action Instructions
          </label>
          <input
            id="action_instructions"
            name="action_instructions"
            type="text"
            maxLength={200}
            defaultValue={shop.action_instructions || ''}
            style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
          <button
            type="submit"
            disabled={isPending}
            style={{
              padding: '12px 24px',
              backgroundColor: isPending ? '#9ca3af' : '#2563eb',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              fontSize: '15px',
              fontWeight: '600',
              cursor: isPending ? 'not-allowed' : 'pointer',
            }}
          >
            {isPending ? 'Saving...' : 'Save Changes'}
          </button>
          <Link
            href="/admin/shops"
            style={{
              display: 'inline-block',
              padding: '12px 20px',
              backgroundColor: '#ffffff',
              color: '#374151',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '15px',
              fontWeight: '600',
              textDecoration: 'none',
            }}
          >
            Back to Shops
          </Link>
        </div>
      </form>

      {/* Delete confirmation modal */}
      {showDeleteModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50,
          }}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '8px',
              padding: '24px',
              maxWidth: '480px',
              width: '90%',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)',
            }}
          >
            <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px', color: '#991b1b' }}>
              Delete Shop Listing
            </h3>
            <p style={{ fontSize: '14px', color: '#4b5563', marginBottom: '16px' }}>
              To confirm deletion of <strong>{shop.name}</strong>, type the shop slug{' '}
              <code style={{ fontWeight: '700', color: '#111827' }}>{shop.slug}</code> below:
            </p>
            <input
              type="text"
              value={deleteConfirmationSlug}
              onChange={(e) => setDeleteConfirmationSlug(e.target.value)}
              placeholder={shop.slug}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                fontFamily: 'monospace',
                marginBottom: '16px',
                boxSizing: 'border-box',
              }}
            />
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                type="button"
                disabled={deleteConfirmationSlug.trim() !== shop.slug || isTransitioning}
                onClick={handleDelete}
                style={{
                  flex: 1,
                  padding: '10px',
                  backgroundColor:
                    deleteConfirmationSlug.trim() === shop.slug ? '#dc2626' : '#9ca3af',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: '600',
                  cursor:
                    deleteConfirmationSlug.trim() === shop.slug ? 'pointer' : 'not-allowed',
                }}
              >
                Permanently Delete
              </button>
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                style={{
                  padding: '10px 16px',
                  backgroundColor: '#f3f4f6',
                  color: '#374151',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
