'use client';

import React, { useActionState, useState, useTransition } from 'react';
import {
  changeOwnerPasswordAction,
  pauseListingAction,
  resumeListingAction,
  type ChangePasswordFormState,
} from './actions.js';
import type { OwnerShopRecord } from '../../../owner/shop-ops.js';

interface AccountManagerProps {
  user: {
    id: string;
    username: string;
    display_name: string;
  };
  shop: OwnerShopRecord | null;
}

export function AccountManager({ user, shop }: AccountManagerProps) {
  const [pwState, pwAction, isPwPending] = useActionState<ChangePasswordFormState | null, FormData>(
    changeOwnerPasswordAction,
    null
  );

  const [isStatusPending, startTransition] = useTransition();
  const [statusError, setStatusError] = useState<string | null>(null);
  const [statusSuccess, setStatusSuccess] = useState<string | null>(null);

  const handlePause = () => {
    if (!confirm('Are you sure you want to pause your listing? It will immediately disappear from customer search.')) {
      return;
    }
    setStatusError(null);
    setStatusSuccess(null);
    startTransition(async () => {
      const res = await pauseListingAction();
      if (!res.success && res.error) {
        setStatusError(res.error);
      } else {
        setStatusSuccess('Your listing has been paused.');
        window.location.reload();
      }
    });
  };

  const handleResume = () => {
    setStatusError(null);
    setStatusSuccess(null);
    startTransition(async () => {
      const res = await resumeListingAction();
      if (!res.success && res.error) {
        setStatusError(res.error);
      } else {
        setStatusSuccess('Your listing is now live in search!');
        window.location.reload();
      }
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* Listing Status & Visibility Control */}
      {shop && (
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            border: '1px solid #e5e7eb',
            padding: '24px',
          }}
        >
          <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#111827', margin: '0 0 4px 0' }}>
            Listing Visibility & Status
          </h2>
          <p style={{ margin: '0 0 16px 0', color: '#6b7280', fontSize: '13px' }}>
            Control whether your business appears in customer search results.
          </p>

          {statusError && (
            <div
              role="alert"
              style={{
                padding: '12px',
                backgroundColor: '#fee2e2',
                color: '#b91c1c',
                borderRadius: '6px',
                fontSize: '14px',
                marginBottom: '16px',
              }}
            >
              {statusError}
            </div>
          )}

          {statusSuccess && (
            <div
              role="status"
              style={{
                padding: '12px',
                backgroundColor: '#dcfce7',
                color: '#15803d',
                borderRadius: '6px',
                fontSize: '14px',
                marginBottom: '16px',
              }}
            >
              {statusSuccess}
            </div>
          )}

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '16px',
              backgroundColor: '#f9fafb',
              padding: '16px 20px',
              borderRadius: '6px',
              border: '1px solid #e5e7eb',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '14px', fontWeight: '600', color: '#374151' }}>Current Status:</span>
                <span
                  style={{
                    padding: '3px 8px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: '700',
                    backgroundColor:
                      shop.status === 'live'
                        ? '#dcfce7'
                        : shop.status === 'draft'
                        ? '#fef3c7'
                        : '#fee2e2',
                    color:
                      shop.status === 'live'
                        ? '#15803d'
                        : shop.status === 'draft'
                        ? '#92400e'
                        : '#b91c1c',
                    textTransform: 'uppercase',
                  }}
                >
                  {shop.status}
                </span>
                {shop.admin_locked && (
                  <span
                    style={{
                      padding: '3px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: '700',
                      backgroundColor: '#fef2f2',
                      color: '#b91c1c',
                    }}
                  >
                    Admin Locked
                  </span>
                )}
              </div>
              <p style={{ margin: '6px 0 0 0', fontSize: '13px', color: '#6b7280' }}>
                {shop.status === 'live'
                  ? 'Your shop is live and discoverable in search.'
                  : shop.status === 'draft'
                  ? 'Your shop is in draft mode. An administrator must make it live.'
                  : shop.admin_locked
                  ? 'Your listing was paused by an administrator. Please contact admin to resume.'
                  : 'Your listing is paused by you. Customers cannot find it in search.'}
              </p>
            </div>

            <div>
              {shop.status === 'live' && (
                <button
                  type="button"
                  disabled={isStatusPending}
                  onClick={handlePause}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#fee2e2',
                    color: '#b91c1c',
                    border: '1px solid #fecaca',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: '600',
                    cursor: isStatusPending ? 'not-allowed' : 'pointer',
                  }}
                >
                  Pause Listing
                </button>
              )}

              {shop.status === 'paused' && !shop.admin_locked && (
                <button
                  type="button"
                  disabled={isStatusPending}
                  onClick={handleResume}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#15803d',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: '600',
                    cursor: isStatusPending ? 'not-allowed' : 'pointer',
                  }}
                >
                  Resume Listing
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Change Password Section */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          border: '1px solid #e5e7eb',
          padding: '24px',
          maxWidth: '560px',
        }}
      >
        <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#111827', margin: '0 0 4px 0' }}>
          Change Password
        </h2>
        <p style={{ margin: '0 0 16px 0', color: '#6b7280', fontSize: '13px' }}>
          Signed in as <strong>{user.display_name}</strong> (@{user.username}). Changing your password terminates all other active sessions across devices for security.
        </p>

        {pwState?.error && (
          <div
            role="alert"
            style={{
              padding: '12px',
              backgroundColor: '#fee2e2',
              color: '#b91c1c',
              borderRadius: '6px',
              fontSize: '14px',
              marginBottom: '16px',
            }}
          >
            {pwState.error}
          </div>
        )}

        {pwState?.success && (
          <div
            role="status"
            style={{
              padding: '12px',
              backgroundColor: '#dcfce7',
              color: '#15803d',
              borderRadius: '6px',
              fontSize: '14px',
              marginBottom: '16px',
            }}
          >
            Your password was updated successfully! Other sessions have been revoked.
          </div>
        )}

        <form action={pwAction} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label
              htmlFor="current_password"
              style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '4px', color: '#374151' }}
            >
              Current Password *
            </label>
            <input
              id="current_password"
              name="current_password"
              type="password"
              required
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid #d1d5db',
                fontSize: '14px',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div>
            <label
              htmlFor="new_password"
              style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '4px', color: '#374151' }}
            >
              New Password * (8–128 characters, 1 letter, 1 digit)
            </label>
            <input
              id="new_password"
              name="new_password"
              type="password"
              required
              minLength={8}
              maxLength={128}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid #d1d5db',
                fontSize: '14px',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div>
            <label
              htmlFor="confirm_password"
              style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '4px', color: '#374151' }}
            >
              Confirm New Password *
            </label>
            <input
              id="confirm_password"
              name="confirm_password"
              type="password"
              required
              minLength={8}
              maxLength={128}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid #d1d5db',
                fontSize: '14px',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: '8px' }}>
            <button
              type="submit"
              disabled={isPwPending}
              style={{
                padding: '10px 20px',
                backgroundColor: '#2563eb',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: isPwPending ? 'not-allowed' : 'pointer',
                opacity: isPwPending ? 0.7 : 1,
              }}
            >
              {isPwPending ? 'Updating Password...' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
