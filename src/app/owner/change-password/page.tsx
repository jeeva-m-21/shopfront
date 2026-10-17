import React from 'react';
import type { Metadata } from 'next';
import { requireOwner } from '../../../auth/guards.js';
import { ChangePasswordForm } from './ChangePasswordForm.js';

export const metadata: Metadata = {
  title: 'Change Password — Shopfront Owner',
};

export default async function OwnerChangePasswordPage() {
  await requireOwner('/owner/change-password');

  return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <ChangePasswordForm />
    </div>
  );
}
