'use client';

import React, { useActionState } from 'react';
import Link from 'next/link';
import { createOwnerAction, type CreateOwnerActionState } from '../actions.js';

export function NewOwnerForm() {
  const [state, formAction, isPending] = useActionState<CreateOwnerActionState, FormData>(
    createOwnerAction,
    {}
  );

  if (state.success && state.temporaryPassword) {
    return (
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          border: '1px solid #e5e7eb',
          padding: '28px',
          maxWidth: '540px',
        }}
      >
        <div
          style={{
            padding: '12px 16px',
            backgroundColor: '#dcfce7',
            border: '1px solid #86efac',
            borderRadius: '6px',
            color: '#166534',
            fontSize: '14px',
            fontWeight: '600',
            marginBottom: '20px',
          }}
        >
          ✓ Owner account for <strong>{state.username}</strong> created successfully!
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label
            style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '600',
              color: '#374151',
              marginBottom: '8px',
            }}
          >
            One-Time Temporary Password
          </label>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              backgroundColor: '#f3f4f6',
              padding: '16px',
              borderRadius: '6px',
              border: '1px dashed #9ca3af',
            }}
          >
            <code
              style={{
                fontSize: '20px',
                fontWeight: '700',
                letterSpacing: '0.1em',
                color: '#111827',
                fontFamily: 'monospace',
                flex: 1,
              }}
            >
              {state.temporaryPassword}
            </code>
            <button
              type="button"
              onClick={() => {
                void navigator.clipboard.writeText(state.temporaryPassword ?? '');
                alert('Temporary password copied to clipboard!');
              }}
              style={{
                padding: '8px 16px',
                backgroundColor: '#2563eb',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              Copy
            </button>
          </div>
          <p
            style={{
              fontSize: '13px',
              color: '#b91c1c',
              marginTop: '8px',
              lineHeight: '1.4',
            }}
          >
            ⚠️ <strong>Shown only once:</strong> This temporary password is never saved in plaintext and cannot be recovered. Safely deliver it to the shop owner. The owner will be required to change their password on first sign in.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <Link
            href="/admin/owners"
            style={{
              display: 'inline-block',
              padding: '10px 18px',
              backgroundColor: '#2563eb',
              color: '#ffffff',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '600',
              textDecoration: 'none',
            }}
          >
            Back to Owners
          </Link>
          <button
            type="button"
            onClick={() => window.location.reload()}
            style={{
              padding: '10px 18px',
              backgroundColor: '#f3f4f6',
              color: '#374151',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
            }}
          >
            Create Another Owner
          </button>
        </div>
      </div>
    );
  }

  return (
    <form
      action={formAction}
      style={{
        backgroundColor: '#ffffff',
        borderRadius: '8px',
        border: '1px solid #e5e7eb',
        padding: '28px',
        maxWidth: '540px',
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
          Username <span style={{ color: '#dc2626' }}>*</span>
        </label>
        <input
          id="username"
          name="username"
          type="text"
          required
          pattern="^[a-z0-9_]{3,30}$"
          placeholder="e.g. annai_bistro"
          style={{
            width: '100%',
            padding: '10px 12px',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            fontSize: '14px',
            boxSizing: 'border-box',
          }}
        />
        <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
          3–30 characters. Lowercase letters, numbers, and underscores only.
        </p>
      </div>

      <div>
        <label
          htmlFor="display_name"
          style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: '600',
            color: '#374151',
            marginBottom: '6px',
          }}
        >
          Display Name <span style={{ color: '#dc2626' }}>*</span>
        </label>
        <input
          id="display_name"
          name="display_name"
          type="text"
          required
          minLength={2}
          maxLength={80}
          placeholder="e.g. Annai Bistro Operations"
          style={{
            width: '100%',
            padding: '10px 12px',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            fontSize: '14px',
            boxSizing: 'border-box',
          }}
        />
        <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
          Owner contact name or title (2–80 characters).
        </p>
      </div>

      <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
        <button
          type="submit"
          disabled={isPending}
          style={{
            padding: '10px 20px',
            backgroundColor: isPending ? '#9ca3af' : '#2563eb',
            color: '#ffffff',
            border: 'none',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: isPending ? 'not-allowed' : 'pointer',
          }}
        >
          {isPending ? 'Generating Account...' : 'Generate Owner Account'}
        </button>
        <Link
          href="/admin/owners"
          style={{
            display: 'inline-block',
            padding: '10px 18px',
            backgroundColor: '#ffffff',
            color: '#374151',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            fontSize: '14px',
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
