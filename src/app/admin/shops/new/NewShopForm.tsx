'use client';

import React, { useState, useActionState } from 'react';
import Link from 'next/link';
import { createShopAction, type ShopActionState } from '../actions.js';

export interface LocalityOption {
  id: number;
  name: string;
  lat: number;
  lng: number;
}

export interface OwnerOption {
  id: string;
  username: string;
  display_name: string;
}

export function NewShopForm({
  localities,
  availableOwners,
}: {
  localities: LocalityOption[];
  availableOwners: OwnerOption[];
}) {
  const [state, formAction, isPending] = useActionState<ShopActionState, FormData>(
    createShopAction,
    {}
  );

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [isSlugManual, setIsSlugManual] = useState(false);
  const [selectedLocalityId, setSelectedLocalityId] = useState<number>(localities[0]?.id ?? 1);
  const [latitude, setLatitude] = useState<string>(localities[0]?.lat.toString() ?? '13.0');
  const [longitude, setLongitude] = useState<string>(localities[0]?.lng.toString() ?? '80.2');
  const [actionMode, setActionMode] = useState<'phone_only' | 'whatsapp' | 'external_url'>('phone_only');
  const [isSampleData, setIsSampleData] = useState(false);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setName(val);
    if (!isSlugManual) {
      const suggested = val
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 60);
      setSlug(suggested);
    }
  };

  const handleLocalityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = parseInt(e.target.value, 10);
    setSelectedLocalityId(id);
    const loc = localities.find((l) => l.id === id);
    if (loc) {
      setLatitude(loc.lat.toFixed(6));
      setLongitude(loc.lng.toFixed(6));
    }
  };

  return (
    <form
      action={formAction}
      style={{
        backgroundColor: '#ffffff',
        borderRadius: '8px',
        border: '1px solid #e5e7eb',
        padding: '32px',
        maxWidth: '720px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
      }}
    >
      {state.error && (
        <div
          role="alert"
          style={{
            padding: '12px 16px',
            backgroundColor: '#fee2e2',
            border: '1px solid #f87171',
            borderRadius: '6px',
            color: '#991b1b',
            fontSize: '14px',
            fontWeight: '500',
          }}
        >
          {state.error}
        </div>
      )}

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
            value={name}
            onChange={handleNameChange}
            placeholder="e.g. Annai Filter Coffee"
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
            pattern="^[a-z0-9\-]{3,60}$"
            value={slug}
            onChange={(e) => {
              setIsSlugManual(true);
              setSlug(e.target.value);
            }}
            placeholder="e.g. annai-filter-coffee"
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
            style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }}
          >
            <option value="food_beverage">Food & Beverage</option>
            <option value="repair_service">Repair & Service</option>
            <option value="salon_wellness">Salon & Wellness</option>
          </select>
        </div>

        <div>
          <label htmlFor="locality_id" style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '6px' }}>
            Locality (Chennai) <span style={{ color: '#dc2626' }}>*</span>
          </label>
          <select
            id="locality_id"
            name="locality_id"
            required
            value={selectedLocalityId}
            onChange={handleLocalityChange}
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
          placeholder="Brief summary of shop specialties, services, and ambience (10–500 chars)"
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
          placeholder="e.g. 15 North Mada Street, Mylapore, Chennai 600004"
          style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div>
          <label htmlFor="latitude" style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '6px' }}>
            Latitude (12.75 – 13.30) <span style={{ color: '#dc2626' }}>*</span>
          </label>
          <input
            id="latitude"
            name="latitude"
            type="number"
            step="0.000001"
            required
            value={latitude}
            onChange={(e) => setLatitude(e.target.value)}
            style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }}
          />
        </div>

        <div>
          <label htmlFor="longitude" style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '6px' }}>
            Longitude (79.95 – 80.40) <span style={{ color: '#dc2626' }}>*</span>
          </label>
          <input
            id="longitude"
            name="longitude"
            type="number"
            step="0.000001"
            required
            value={longitude}
            onChange={(e) => setLongitude(e.target.value)}
            style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }}
          />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div>
          <label htmlFor="phone" style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '6px' }}>
            Phone Number <span style={{ color: '#dc2626' }}>*</span>
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            required
            pattern="^\+91\d{10}$"
            placeholder="+914424410000"
            style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }}
          />
          <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>Format: +91 followed by 10 digits</p>
        </div>

        <div>
          <label htmlFor="whatsapp" style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '6px' }}>
            WhatsApp Number
          </label>
          <input
            id="whatsapp"
            name="whatsapp"
            type="tel"
            pattern="^\+91[6-9]\d{9}$"
            placeholder="+919840123456"
            style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }}
          />
          <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>Required if action mode is WhatsApp</p>
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
            value={actionMode}
            onChange={(e) => setActionMode(e.target.value as 'phone_only' | 'whatsapp' | 'external_url')}
            style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }}
          >
            <option value="phone_only">Call Phone Only</option>
            <option value="whatsapp">WhatsApp Order / Chat</option>
            <option value="external_url">External Booking / Order Link</option>
          </select>
        </div>

        <div>
          <label htmlFor="owner_id" style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '6px' }}>
            Assign Shop Owner
          </label>
          <select
            id="owner_id"
            name="owner_id"
            style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }}
          >
            <option value="">No owner assigned</option>
            {availableOwners.map((owner) => (
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
            Booking / Ordering URL
          </label>
          <input
            id="booking_url"
            name="booking_url"
            type="url"
            pattern="^https://\S+$"
            placeholder="https://example.com/order"
            style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }}
          />
        </div>

        <div>
          <label htmlFor="website_url" style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '6px' }}>
            Official Website URL
          </label>
          <input
            id="website_url"
            name="website_url"
            type="url"
            pattern="^https://\S+$"
            placeholder="https://example.com"
            style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }}
          />
        </div>
      </div>

      <div>
        <label htmlFor="action_instructions" style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '6px' }}>
          Action Instructions (Optional)
        </label>
        <input
          id="action_instructions"
          name="action_instructions"
          type="text"
          maxLength={200}
          placeholder="e.g. Please mention your car model when calling"
          style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }}
        />
      </div>

      <div style={{ padding: '16px', backgroundColor: '#f9fafb', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
        <div style={{ fontWeight: '600', fontSize: '14px', marginBottom: '8px' }}>
          Sample Data Designation <span style={{ color: '#dc2626' }}>*</span>
        </div>
        <div style={{ display: 'flex', gap: '20px', marginBottom: '12px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', cursor: 'pointer' }}>
            <input
              type="radio"
              name="is_sample_data"
              value="false"
              checked={!isSampleData}
              onChange={() => setIsSampleData(false)}
            />
            Real Business
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', cursor: 'pointer' }}>
            <input
              type="radio"
              name="is_sample_data"
              value="true"
              checked={isSampleData}
              onChange={() => setIsSampleData(true)}
            />
            Synthetic / Sample Data
          </label>
        </div>

        {isSampleData && (
          <div>
            <label htmlFor="data_source_note" style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>
              Data Source Note <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <input
              id="data_source_note"
              name="data_source_note"
              type="text"
              required={isSampleData}
              placeholder="e.g. Benchmark contrastive dataset item"
              style={{ width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '13px', boxSizing: 'border-box' }}
            />
          </div>
        )}
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
          {isPending ? 'Saving Shop...' : 'Create Shop (Draft)'}
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
          Cancel
        </Link>
      </div>
    </form>
  );
}
