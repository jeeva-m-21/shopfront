'use client';

import React, { useActionState, useState } from 'react';
import { updateOwnerShopAction, type UpdateOwnerShopState } from './actions.js';
import type { OwnerShopRecord } from '../../../owner/shop-ops.js';
import type { ActionMode } from '../../../admin/shop-ops.js';

interface EditShopFormProps {
  shop: OwnerShopRecord;
}

export function EditShopForm({ shop }: EditShopFormProps) {
  const [state, formAction, isPending] = useActionState<UpdateOwnerShopState | null, FormData>(
    updateOwnerShopAction,
    null
  );

  const [actionMode, setActionMode] = useState<ActionMode>(shop.action_mode);

  const categoryLabels = {
    repair_service: 'Repair & Technical',
    salon_wellness: 'Salons & Personal Care',
    food_beverage: 'Food & Cafes',
  };

  return (
    <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e5e7eb', padding: '24px' }}>
      <form action={formAction} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {state?.error && (
          <div
            role="alert"
            style={{
              padding: '12px',
              backgroundColor: '#fee2e2',
              color: '#b91c1c',
              borderRadius: '6px',
              fontSize: '14px',
            }}
          >
            {state.error}
          </div>
        )}

        {state?.success && (
          <div
            role="status"
            style={{
              padding: '12px',
              backgroundColor: '#dcfce7',
              color: '#15803d',
              borderRadius: '6px',
              fontSize: '14px',
            }}
          >
            Shop details updated successfully!
          </div>
        )}

        {/* Read-Only Restricted Section */}
        <div style={{ backgroundColor: '#f9fafb', padding: '16px', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
          <h2 style={{ fontSize: '15px', fontWeight: '600', color: '#374151', margin: '0 0 12px 0' }}>
            Listing Configuration (Restricted)
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', fontSize: '13px' }}>
            <div>
              <span style={{ color: '#6b7280', display: 'block' }}>Category</span>
              <strong style={{ color: '#111827' }}>{categoryLabels[shop.category]}</strong>
              <span style={{ display: 'block', fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>
                Ask the admin to change this
              </span>
            </div>

            <div>
              <span style={{ color: '#6b7280', display: 'block' }}>Locality</span>
              <strong style={{ color: '#111827' }}>{shop.locality_name}</strong>
              <span style={{ display: 'block', fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>
                Ask the admin to change this
              </span>
            </div>

            <div>
              <span style={{ color: '#6b7280', display: 'block' }}>Map Position</span>
              <strong style={{ color: '#111827' }}>
                {shop.latitude.toFixed(4)}, {shop.longitude.toFixed(4)}
              </strong>
              <span style={{ display: 'block', fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>
                Ask the admin to change this
              </span>
            </div>

            <div>
              <span style={{ color: '#6b7280', display: 'block' }}>URL Slug</span>
              <code style={{ color: '#111827', fontFamily: 'monospace' }}>{shop.slug}</code>
              <span style={{ display: 'block', fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>
                Ask the admin to change this
              </span>
            </div>

            <div>
              <span style={{ color: '#6b7280', display: 'block' }}>Sample Listing</span>
              <strong style={{ color: '#111827' }}>{shop.is_sample_data ? 'Yes (Sample)' : 'No (Real Business)'}</strong>
              <span style={{ display: 'block', fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>
                Ask the admin to change this
              </span>
            </div>
          </div>
        </div>

        {/* Editable Fields Section */}
        <div>
          <label htmlFor="name" style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '6px', color: '#374151' }}>
            Shop Name *
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            minLength={2}
            maxLength={80}
            defaultValue={shop.name}
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: '6px',
              border: '1px solid #d1d5db',
              fontSize: '14px',
              boxSizing: 'border-box',
            }}
          />
        </div>

        <div>
          <label htmlFor="description" style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '6px', color: '#374151' }}>
            Description *
          </label>
          <textarea
            id="description"
            name="description"
            required
            rows={3}
            minLength={10}
            maxLength={500}
            defaultValue={shop.description}
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: '6px',
              border: '1px solid #d1d5db',
              fontSize: '14px',
              boxSizing: 'border-box',
            }}
          />
        </div>

        <div>
          <label htmlFor="address" style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '6px', color: '#374151' }}>
            Street Address *
          </label>
          <input
            id="address"
            name="address"
            type="text"
            required
            minLength={5}
            maxLength={200}
            defaultValue={shop.address}
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: '6px',
              border: '1px solid #d1d5db',
              fontSize: '14px',
              boxSizing: 'border-box',
            }}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
          <div>
            <label htmlFor="phone" style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '6px', color: '#374151' }}>
              Primary Phone (+91XXXXXXXXXX) *
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              required
              pattern="^\+91\d{10}$"
              defaultValue={shop.phone}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '6px',
                border: '1px solid #d1d5db',
                fontSize: '14px',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div>
            <label htmlFor="whatsapp" style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '6px', color: '#374151' }}>
              WhatsApp (+91[6-9]XXXXXXXXX)
            </label>
            <input
              id="whatsapp"
              name="whatsapp"
              type="tel"
              pattern="^\+91[6-9]\d{9}$"
              defaultValue={shop.whatsapp ?? ''}
              placeholder="+919840123456"
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '6px',
                border: '1px solid #d1d5db',
                fontSize: '14px',
                boxSizing: 'border-box',
              }}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
          <div>
            <label htmlFor="booking_url" style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '6px', color: '#374151' }}>
              Online Booking URL (https://...)
            </label>
            <input
              id="booking_url"
              name="booking_url"
              type="url"
              defaultValue={shop.booking_url ?? ''}
              placeholder="https://example.com/book"
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '6px',
                border: '1px solid #d1d5db',
                fontSize: '14px',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div>
            <label htmlFor="website_url" style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '6px', color: '#374151' }}>
              Website URL (https://...)
            </label>
            <input
              id="website_url"
              name="website_url"
              type="url"
              defaultValue={shop.website_url ?? ''}
              placeholder="https://example.com"
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '6px',
                border: '1px solid #d1d5db',
                fontSize: '14px',
                boxSizing: 'border-box',
              }}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
          <div>
            <label htmlFor="action_mode" style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '6px', color: '#374151' }}>
              Customer Contact Action Mode *
            </label>
            <select
              id="action_mode"
              name="action_mode"
              value={actionMode}
              onChange={(e) => setActionMode(e.target.value as ActionMode)}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '6px',
                border: '1px solid #d1d5db',
                fontSize: '14px',
                backgroundColor: '#ffffff',
                boxSizing: 'border-box',
              }}
            >
              <option value="phone_only">Phone Call (tel: link)</option>
              <option value="whatsapp">WhatsApp Direct Enquiry</option>
              <option value="external_url">External Booking URL</option>
            </select>
          </div>

          <div>
            <label htmlFor="action_instructions" style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '6px', color: '#374151' }}>
              Action Instructions (max 200 chars)
            </label>
            <input
              id="action_instructions"
              name="action_instructions"
              type="text"
              maxLength={200}
              defaultValue={shop.action_instructions ?? ''}
              placeholder="e.g. Please bring device bill for warranty service"
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '6px',
                border: '1px solid #d1d5db',
                fontSize: '14px',
                boxSizing: 'border-box',
              }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
          <button
            type="submit"
            disabled={isPending}
            style={{
              padding: '10px 24px',
              backgroundColor: '#2563eb',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: isPending ? 'not-allowed' : 'pointer',
              opacity: isPending ? 0.7 : 1,
            }}
          >
            {isPending ? 'Saving Changes...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
