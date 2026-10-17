'use client';

import React, { useActionState } from 'react';
import { loginAction, type LoginActionState } from './actions.js';

export function LoginForm() {
  const [state, formAction, isPending] = useActionState<LoginActionState, FormData>(
    loginAction,
    {}
  );

  return (
    <div
      style={{
        maxWidth: '420px',
        margin: '60px auto',
        padding: '32px',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        backgroundColor: '#ffffff',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      <h1
        style={{
          fontSize: '24px',
          fontWeight: '700',
          marginBottom: '8px',
          color: '#111827',
          textAlign: 'center',
        }}
      >
        Shopfront Sign In
      </h1>
      <p
        style={{
          fontSize: '14px',
          color: '#4b5563',
          marginBottom: '24px',
          textAlign: 'center',
        }}
      >
        Sign in to your Administrator or Shop Owner portal
      </p>

      {state.error && (
        <div
          role="alert"
          aria-live="polite"
          style={{
            padding: '12px 16px',
            marginBottom: '20px',
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

      <form action={formAction} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <label
            htmlFor="username"
            style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '600',
              color: '#374151',
              marginBottom: '6px',
            }}
          >
            Username
          </label>
          <input
            id="username"
            name="username"
            type="text"
            required
            autoComplete="username"
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '15px',
              color: '#111827',
              boxSizing: 'border-box',
            }}
          />
        </div>

        <div>
          <label
            htmlFor="password"
            style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '600',
              color: '#374151',
              marginBottom: '6px',
            }}
          >
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '15px',
              color: '#111827',
              boxSizing: 'border-box',
            }}
          />
        </div>

        <button
          type="submit"
          disabled={isPending}
          style={{
            marginTop: '8px',
            padding: '12px',
            backgroundColor: isPending ? '#9ca3af' : '#2563eb',
            color: '#ffffff',
            border: 'none',
            borderRadius: '6px',
            fontSize: '15px',
            fontWeight: '600',
            cursor: isPending ? 'not-allowed' : 'pointer',
            transition: 'background-color 0.2s',
          }}
        >
          {isPending ? 'Signing in...' : 'Sign In'}
        </button>
      </form>
    </div>
  );
}
