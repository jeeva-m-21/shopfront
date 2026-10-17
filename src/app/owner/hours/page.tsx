import React from 'react';
import { requireOwner } from '../../../auth/guards.js';
import { getOwnerHoursAndClosures } from '../../../owner/hours-ops.js';
import { HoursManager } from './HoursManager.js';

export default async function OwnerHoursPage() {
  const { user } = await requireOwner('/owner/hours');

  let data;
  try {
    data = await getOwnerHoursAndClosures(user.id);
  } catch {
    return (
      <div style={{ padding: '32px 0' }}>
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            border: '1px solid #e5e7eb',
            padding: '32px',
            textAlign: 'center',
          }}
        >
          <h1 style={{ fontSize: '20px', fontWeight: '700', color: '#111827', marginBottom: '8px' }}>
            Operating Hours
          </h1>
          <p style={{ color: '#6b7280', fontSize: '15px' }}>
            No shop is assigned to your account yet. Contact the admin.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#111827', margin: 0 }}>
          Operating Hours & Planned Closures
        </h1>
        <p style={{ margin: '4px 0 0 0', color: '#6b7280', fontSize: '14px' }}>
          Keep your schedule up to date so customers know when your business is open in Asia/Kolkata timezone.
        </p>
      </div>

      <HoursManager initialData={data} />
    </div>
  );
}
