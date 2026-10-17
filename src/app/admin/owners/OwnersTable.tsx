'use client';

import React, { useState, useTransition } from 'react';
import { resetOwnerPasswordAction, toggleOwnerStatusAction } from './actions.js';
import type { OwnerWithShop } from '../../../auth/owner-ops.js';

export function OwnersTable({ initialOwners }: { initialOwners: OwnerWithShop[] }) {
  const [owners] = useState<OwnerWithShop[]>(initialOwners);
  const [isPending, startTransition] = useTransition();
  const [resetModal, setResetModal] = useState<{
    ownerId: string;
    username: string;
    temporaryPassword?: string;
  } | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const handleResetPassword = (owner: OwnerWithShop) => {
    if (!confirm(`Are you sure you want to reset the password for owner '${owner.username}'? All active sessions will be terminated.`)) {
      return;
    }
    setActionError(null);
    startTransition(async () => {
      const res = await resetOwnerPasswordAction(owner.id);
      if (res.error) {
        setActionError(res.error);
      } else if (res.temporaryPassword) {
        setResetModal({
          ownerId: owner.id,
          username: owner.username,
          temporaryPassword: res.temporaryPassword,
        });
      }
    });
  };

  const handleToggleStatus = (owner: OwnerWithShop) => {
    const action = owner.is_active ? 'disable' : 'enable';
    const msg = owner.is_active
      ? `Disable owner '${owner.username}'? This will terminate all active sessions and pause their listing.`
      : `Re-enable owner '${owner.username}'? Their shop will remain paused until published.`;

    if (!confirm(msg)) return;

    setActionError(null);
    startTransition(async () => {
      const res = await toggleOwnerStatusAction(owner.id, action);
      if (!res.success && res.error) {
        setActionError(res.error);
      } else {
        window.location.reload();
      }
    });
  };

  return (
    <div>
      {actionError && (
        <div
          role="alert"
          style={{
            padding: '12px',
            backgroundColor: '#fee2e2',
            border: '1px solid #f87171',
            borderRadius: '6px',
            color: '#991b1b',
            marginBottom: '16px',
            fontSize: '14px',
          }}
        >
          {actionError}
        </div>
      )}

      {resetModal?.temporaryPassword && (
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
            <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px', color: '#111827' }}>
              Temporary Password Generated
            </h3>
            <p style={{ fontSize: '14px', color: '#4b5563', marginBottom: '16px' }}>
              The password for <strong>{resetModal.username}</strong> has been reset. It is displayed{' '}
              <strong>once</strong> and never stored in plaintext:
            </p>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: '#f3f4f6',
                padding: '12px',
                borderRadius: '6px',
                marginBottom: '16px',
              }}
            >
              <code
                style={{
                  fontSize: '16px',
                  fontWeight: '700',
                  color: '#1f2937',
                  letterSpacing: '0.05em',
                  flex: 1,
                }}
              >
                {resetModal.temporaryPassword}
              </code>
              <button
                type="button"
                onClick={() => {
                  void navigator.clipboard.writeText(resetModal.temporaryPassword ?? '');
                  alert('Password copied to clipboard!');
                }}
                style={{
                  padding: '6px 12px',
                  backgroundColor: '#2563eb',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                Copy
              </button>
            </div>
            <button
              type="button"
              onClick={() => setResetModal(null)}
              style={{
                width: '100%',
                padding: '10px',
                backgroundColor: '#e5e7eb',
                color: '#111827',
                border: 'none',
                borderRadius: '6px',
                fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              Done
            </button>
          </div>
        </div>
      )}

      <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e5e7eb', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
          <thead>
            <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb', color: '#4b5563' }}>
              <th style={{ padding: '12px 16px', fontWeight: '600' }}>Username</th>
              <th style={{ padding: '12px 16px', fontWeight: '600' }}>Display Name</th>
              <th style={{ padding: '12px 16px', fontWeight: '600' }}>Status</th>
              <th style={{ padding: '12px 16px', fontWeight: '600' }}>Assigned Shop</th>
              <th style={{ padding: '12px 16px', fontWeight: '600' }}>Password</th>
              <th style={{ padding: '12px 16px', fontWeight: '600', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {owners.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: '#6b7280' }}>
                  No owner accounts created yet.
                </td>
              </tr>
            ) : (
              owners.map((owner) => (
                <tr key={owner.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '12px 16px', fontWeight: '500', color: '#111827' }}>
                    {owner.username}
                  </td>
                  <td style={{ padding: '12px 16px', color: '#374151' }}>
                    {owner.display_name}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '2px 8px',
                        borderRadius: '9999px',
                        fontSize: '12px',
                        fontWeight: '600',
                        backgroundColor: owner.is_active ? '#dcfce7' : '#fee2e2',
                        color: owner.is_active ? '#15803d' : '#b91c1c',
                      }}
                    >
                      {owner.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', color: '#4b5563' }}>
                    {owner.shop_name ? (
                      <span>
                        {owner.shop_name} ({owner.shop_status})
                      </span>
                    ) : (
                      <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>None</span>
                    )}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    {owner.must_change_password && (
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          backgroundColor: '#fef3c7',
                          color: '#92400e',
                          fontWeight: '500',
                        }}
                      >
                        Must Change
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '8px' }}>
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => handleResetPassword(owner)}
                        style={{
                          padding: '4px 8px',
                          backgroundColor: '#f3f4f6',
                          border: '1px solid #d1d5db',
                          borderRadius: '4px',
                          fontSize: '12px',
                          color: '#1f2937',
                          cursor: isPending ? 'not-allowed' : 'pointer',
                        }}
                      >
                        Reset Password
                      </button>
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => handleToggleStatus(owner)}
                        style={{
                          padding: '4px 8px',
                          backgroundColor: owner.is_active ? '#fee2e2' : '#dcfce7',
                          border: '1px solid',
                          borderColor: owner.is_active ? '#fca5a5' : '#86efac',
                          borderRadius: '4px',
                          fontSize: '12px',
                          color: owner.is_active ? '#991b1b' : '#166534',
                          cursor: isPending ? 'not-allowed' : 'pointer',
                        }}
                      >
                        {owner.is_active ? 'Disable' : 'Enable'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
