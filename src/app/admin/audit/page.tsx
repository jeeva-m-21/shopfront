import React from 'react';
import type { Metadata } from 'next';
import { requireAdmin } from '../../../auth/guards.js';
import { getAuditLogs } from '../../../admin/telemetry-ops.js';

export const metadata: Metadata = {
  title: 'Audit Log — Shopfront Admin',
};

export default async function AdminAuditPage({
  searchParams,
}: {
  searchParams: Promise<{
    actor?: string;
    entity_type?: string;
  }>;
}) {
  await requireAdmin();
  const params = await searchParams;

  const actorUsername = params.actor || undefined;
  const entityType = params.entity_type && params.entity_type !== 'all' ? params.entity_type : undefined;

  const logs = await getAuditLogs({
    actorUsername,
    entityType,
    limit: 100,
  });

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#111827', margin: 0 }}>
          System Audit Log
        </h1>
        <p style={{ fontSize: '14px', color: '#6b7280', margin: '4px 0 0 0' }}>
          Immutable audit record of all admin and owner mutations with before/after state diffs
        </p>
      </div>

      {/* Filter bar */}
      <div
        style={{
          backgroundColor: '#ffffff',
          padding: '16px',
          borderRadius: '8px',
          border: '1px solid #e5e7eb',
          marginBottom: '20px',
        }}
      >
        <form method="GET" style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <input
            type="text"
            name="actor"
            defaultValue={actorUsername || ''}
            placeholder="Filter by actor username..."
            style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '13px' }}
          />

          <select
            name="entity_type"
            defaultValue={entityType || 'all'}
            style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '13px' }}
          >
            <option value="all">All Entity Types</option>
            <option value="shop">Shops</option>
            <option value="user">Users / Owners</option>
            <option value="catalog_item">Catalog Items</option>
          </select>

          <button
            type="submit"
            style={{
              padding: '6px 14px',
              backgroundColor: '#1f2937',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            Filter
          </button>
        </form>
      </div>

      {/* Audit Log Table */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e5e7eb', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
          <thead>
            <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb', color: '#4b5563' }}>
              <th style={{ padding: '10px 14px', fontWeight: '600' }}>Timestamp</th>
              <th style={{ padding: '10px 14px', fontWeight: '600' }}>Actor</th>
              <th style={{ padding: '10px 14px', fontWeight: '600' }}>Action</th>
              <th style={{ padding: '10px 14px', fontWeight: '600' }}>Entity</th>
              <th style={{ padding: '10px 14px', fontWeight: '600' }}>State Diff (Before / After)</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: '#6b7280' }}>
                  No audit logs recorded matching the criteria.
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} style={{ borderBottom: '1px solid #f3f4f6', verticalAlign: 'top' }}>
                  <td style={{ padding: '10px 14px', color: '#6b7280', whiteSpace: 'nowrap' }}>
                    {new Date(log.created_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
                  </td>
                  <td style={{ padding: '10px 14px', fontWeight: '600', color: '#111827' }}>
                    {log.actor_username}
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    <span
                      style={{
                        padding: '2px 6px',
                        backgroundColor: '#f3f4f6',
                        borderRadius: '4px',
                        fontFamily: 'monospace',
                        fontSize: '12px',
                        color: '#1f2937',
                      }}
                    >
                      {log.action}
                    </span>
                  </td>
                  <td style={{ padding: '10px 14px', color: '#374151' }}>
                    <span style={{ textTransform: 'capitalize', fontWeight: '500' }}>{log.entity_type}</span>
                    <div style={{ fontSize: '11px', color: '#9ca3af', fontFamily: 'monospace' }}>
                      {log.entity_id}
                    </div>
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      <div>
                        <div style={{ fontSize: '11px', color: '#9ca3af', fontWeight: '600' }}>BEFORE</div>
                        <pre
                          style={{
                            margin: 0,
                            padding: '6px',
                            backgroundColor: '#f9fafb',
                            borderRadius: '4px',
                            border: '1px solid #e5e7eb',
                            fontSize: '11px',
                            maxHeight: '120px',
                            overflow: 'auto',
                          }}
                        >
                          {log.before_data ? JSON.stringify(log.before_data, null, 2) : 'null'}
                        </pre>
                      </div>
                      <div>
                        <div style={{ fontSize: '11px', color: '#9ca3af', fontWeight: '600' }}>AFTER</div>
                        <pre
                          style={{
                            margin: 0,
                            padding: '6px',
                            backgroundColor: '#f9fafb',
                            borderRadius: '4px',
                            border: '1px solid #e5e7eb',
                            fontSize: '11px',
                            maxHeight: '120px',
                            overflow: 'auto',
                          }}
                        >
                          {log.after_data ? JSON.stringify(log.after_data, null, 2) : 'null'}
                        </pre>
                      </div>
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
