import React from 'react';
import type { Metadata } from 'next';
import { requireAdmin } from '../../../../auth/guards.js';
import { NewOwnerForm } from './NewOwnerForm.js';

export const metadata: Metadata = {
  title: 'New Owner — Shopfront Admin',
};

export default async function NewOwnerPage() {
  await requireAdmin();

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#111827', margin: 0 }}>
          Create Owner Account
        </h1>
        <p style={{ fontSize: '14px', color: '#6b7280', margin: '4px 0 0 0' }}>
          Provision an owner login with a cryptographically secure one-time temporary password
        </p>
      </div>

      <NewOwnerForm />
    </div>
  );
}
