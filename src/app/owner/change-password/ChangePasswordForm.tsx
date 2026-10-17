'use client';

import React, { useActionState } from 'react';
import { changePasswordAction, type ChangePasswordState } from './actions.js';

export function ChangePasswordForm() {
  const [state, formAction, isPending] = useActionState<ChangePasswordState, FormData>(
    changePasswordAction,
    {}
  );

  return (
    <form
      action={formAction}
      style={{
        backgroundColor: '#ffffff',
        borderRadius: '8px',
        border: '1px solid #e5e7eb',
        padding: '32px',
        maxWidth: '480px',
        margin: '40px auto',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      <div>
        <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#111827', margin: 0 }}>
          Set Your New Password
        </h2>
        <p style={{ fontSize: '13px', color: '#6b7280', margin: '6px 0 0 0' }}>
          Your account was provisioned with a temporary password. Choose a new secure password to activate your portal.
        </p>
      </div>

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

      <div>
        <label
          htmlFor="new_password"
          style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}
        >
          New Password <span style={{ color: '#dc2626' }}>*</span>
        </label>
        <input
          id="new_password"
          name="new_password"
          type="password"
          required
          autoComplete="new-password"
          style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }}
        />
        <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '6px', lineHeight: '1.4' }}>
          • 8–128 characters<br />
          • At least one letter and at least one digit<br />
          • Cannot match username or temporary password
        </div>
      </div>

      <div>
        <label
          htmlFor="confirm_password"
          style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}
        >
          Confirm New Password <span style={{ color: '#dc2626' }}>*</span>
        </label>
        <input
          id="confirm_password"
          name="confirm_password"
          type="password"
          required
          autoComplete="new-password"
          style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }}
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
        }}
      >
        {isPending ? 'Updating Password...' : 'Save Password & Continue'}
      </button>
    </form>
  );
}
