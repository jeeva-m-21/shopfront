import React from 'react';
import type { Metadata } from 'next';
import { requireAdmin } from '../../../auth/guards.js';
import { getSearchLogs } from '../../../admin/telemetry-ops.js';

export const metadata: Metadata = {
  title: 'Search Logs — Shopfront Admin',
};

export default async function AdminLogsPage({
  searchParams,
}: {
  searchParams: Promise<{
    channel?: string;
    tool?: string;
    fallback_only?: string;
  }>;
}) {
  await requireAdmin();
  const params = await searchParams;

  const channel = (params.channel === 'mcp' || params.channel === 'web') ? params.channel : undefined;
  const tool = params.tool && params.tool !== 'all' ? params.tool : undefined;
  const fallbackOnly = params.fallback_only === 'true';

  const { logs, summary } = await getSearchLogs({
    channel,
    tool,
    fallbackOnly,
    limit: 100,
  });

  const exportUrl = `/api/admin/logs/export?${new URLSearchParams({
    ...(channel ? { channel } : {}),
    ...(tool ? { tool } : {}),
    ...(fallbackOnly ? { fallback_only: 'true' } : {}),
  }).toString()}`;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-normal text-stone-900">
          Search & Tool Telemetry
        </h1>
        <p className="text-xs text-stone-500 font-sans mt-0.5">
          Real-time query performance telemetry, Jev fallback rates, and latency percentiles.
        </p>
      </div>

      {/* Summary strip per PRD A8.3 */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        <div style={{ backgroundColor: '#ffffff', padding: '16px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
          <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: '600', textTransform: 'uppercase' }}>Queries</div>
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#111827', marginTop: '4px' }}>{summary.queryCount}</div>
        </div>

        <div style={{ backgroundColor: '#ffffff', padding: '16px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
          <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: '600', textTransform: 'uppercase' }}>Rerank Rate</div>
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#2563eb', marginTop: '4px' }}>{summary.rerankRate}%</div>
        </div>

        <div style={{ backgroundColor: '#ffffff', padding: '16px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
          <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: '600', textTransform: 'uppercase' }}>Fallback Rate</div>
          <div style={{ fontSize: '24px', fontWeight: '700', color: summary.fallbackRate > 5 ? '#dc2626' : '#15803d', marginTop: '4px' }}>
            {summary.fallbackRate}%
          </div>
        </div>

        <div style={{ backgroundColor: '#ffffff', padding: '16px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
          <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: '600', textTransform: 'uppercase' }}>find_shops p50</div>
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#111827', marginTop: '4px' }}>{summary.p50TotalMs} ms</div>
        </div>

        <div style={{ backgroundColor: '#ffffff', padding: '16px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
          <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: '600', textTransform: 'uppercase' }}>find_shops p95</div>
          <div style={{ fontSize: '24px', fontWeight: '700', color: summary.p95TotalMs > 800 ? '#dc2626' : '#111827', marginTop: '4px' }}>
            {summary.p95TotalMs} ms
          </div>
        </div>
      </div>

      {/* Filter and export toolbar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          backgroundColor: '#ffffff',
          padding: '16px',
          borderRadius: '8px',
          border: '1px solid #e5e7eb',
          marginBottom: '20px',
        }}
      >
        <form method="GET" style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <select
            name="channel"
            defaultValue={channel || ''}
            style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '13px' }}
          >
            <option value="">All Channels</option>
            <option value="mcp">MCP Channel</option>
            <option value="web">Web Channel</option>
          </select>

          <select
            name="tool"
            defaultValue={tool || 'all'}
            style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '13px' }}
          >
            <option value="all">All Tools</option>
            <option value="find_shops">find_shops</option>
            <option value="get_shop_info">get_shop_info</option>
            <option value="get_catalog">get_catalog</option>
            <option value="search_catalog">search_catalog</option>
            <option value="get_action_link">get_action_link</option>
          </select>

          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              name="fallback_only"
              value="true"
              defaultChecked={fallbackOnly}
            />
            Fallback only
          </label>

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

        <a
          href={exportUrl}
          download="search_logs.csv"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 14px',
            backgroundColor: '#ffffff',
            color: '#2563eb',
            border: '1px solid #2563eb',
            borderRadius: '6px',
            fontSize: '13px',
            fontWeight: '600',
            textDecoration: 'none',
          }}
        >
          ⬇ Export CSV
        </a>
      </div>

      {/* Logs Table */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e5e7eb', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
          <thead>
            <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb', color: '#4b5563' }}>
              <th style={{ padding: '10px 14px', fontWeight: '600' }}>Time</th>
              <th style={{ padding: '10px 14px', fontWeight: '600' }}>Channel</th>
              <th style={{ padding: '10px 14px', fontWeight: '600' }}>Tool</th>
              <th style={{ padding: '10px 14px', fontWeight: '600' }}>Query Text</th>
              <th style={{ padding: '10px 14px', fontWeight: '600' }}>Results</th>
              <th style={{ padding: '10px 14px', fontWeight: '600' }}>Reranked</th>
              <th style={{ padding: '10px 14px', fontWeight: '600' }}>Fallback</th>
              <th style={{ padding: '10px 14px', fontWeight: '600' }}>Latency</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ padding: '32px', textAlign: 'center', color: '#6b7280' }}>
                  No log entries matching the criteria.
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '10px 14px', color: '#6b7280', whiteSpace: 'nowrap' }}>
                    {new Date(log.created_at).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' })}
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    <span
                      style={{
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: '700',
                        backgroundColor: log.channel === 'mcp' ? '#e0e7ff' : '#dcfce7',
                        color: log.channel === 'mcp' ? '#3730a3' : '#166534',
                      }}
                    >
                      {log.channel.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ padding: '10px 14px', fontFamily: 'monospace', color: '#111827' }}>
                    {log.tool}
                  </td>
                  <td style={{ padding: '10px 14px', color: '#374151', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {log.query_text || '-'}
                  </td>
                  <td style={{ padding: '10px 14px', color: '#111827' }}>
                    {log.result_count ?? 0}
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    {log.reranked ? (
                      <span style={{ color: '#15803d', fontWeight: '600' }}>Yes</span>
                    ) : (
                      <span style={{ color: '#9ca3af' }}>No</span>
                    )}
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    {log.fallback_reason ? (
                      <span style={{ color: '#dc2626', fontSize: '11px', fontWeight: '600' }}>
                        {log.fallback_reason}
                      </span>
                    ) : (
                      <span style={{ color: '#9ca3af' }}>-</span>
                    )}
                  </td>
                  <td style={{ padding: '10px 14px', fontWeight: '600', color: log.total_ms > 700 ? '#dc2626' : '#111827' }}>
                    {log.total_ms} ms
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
