import React from 'react';
import type { Metadata } from 'next';
import { LoginForm } from './LoginForm.js';

export const metadata: Metadata = {
  title: 'Sign In — Shopfront',
  description: 'Sign in to the Shopfront portal.',
};

export const dynamic = 'force-dynamic';

export default function LoginPage() {
  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#f9fafb',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        boxSizing: 'border-box',
      }}
    >
      <LoginForm />
    </div>
  );
}
