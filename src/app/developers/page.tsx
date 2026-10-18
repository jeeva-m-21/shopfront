import React from 'react';
import type { Metadata } from 'next';
import { Terminal, Cpu } from 'lucide-react';
import { McpPlayground } from './McpPlayground.js';
import { Card } from '../../components/ui/card.js';
import { Badge } from '../../components/ui/badge.js';

export const metadata: Metadata = {
  title: 'Developers & MCP Server — Shopfront Chennai',
  description:
    'Integrate Chennai hyperlocal commerce into Claude Desktop, Cursor, and LLM agent frameworks using our declarative Model Context Protocol server.',
};

export default function DevelopersPage() {
  const baseUrl = process.env.APP_BASE_URL || 'https://shopfront.vercel.app';

  const claudeDesktopConfig = `{
  "mcpServers": {
    "shopfront": {
      "url": "${baseUrl}/mcp"
    }
  }
}`;

  const cursorConfig = `{
  "mcpServers": {
    "shopfront": {
      "command": "npx",
      "args": ["-y", "mcp-remote", "${baseUrl}/mcp"]
    }
  }
}`;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 space-y-16">
      {/* 1. Hero */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 text-emerald-400 text-xs font-mono font-semibold shadow-sm">
          <Terminal className="w-3.5 h-3.5 text-emerald-400" />
          <span>MCP Transport: Streamable HTTP (POST /mcp)</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
          Connect AI Agents to{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-emerald-500">
            Chennai Commerce
          </span>
        </h1>

        <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
          Shopfront implements the open{' '}
          <a
            href="https://modelcontextprotocol.io"
            target="_blank"
            rel="noreferrer"
            className="text-brand-600 font-semibold underline underline-offset-2"
          >
            Model Context Protocol (MCP)
          </a>{' '}
          enabling Claude Desktop, Cursor, and autonomous agents to discover local shops, check live IST opening hours, search item menus, and generate booking deep links.
        </p>
      </div>

      {/* 2. Interactive Tool Playground */}
      <Card className="p-6 sm:p-8 bg-white border-slate-200 shadow-elevated">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-6 border-b border-slate-100 gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Cpu className="w-5 h-5 text-brand-600" />
              <span>Interactive MCP Tool Playground</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Test any of the 5 declarative tools live against the PostGIS database.
            </p>
          </div>
          <Badge variant="success" className="self-start sm:self-auto text-xs py-1 px-3">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Live Endpoint Ready
          </Badge>
        </div>

        <McpPlayground />
      </Card>

      {/* 3. One-Click Client Configuration */}
      <div className="space-y-6">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            Install in Your Agent Environment
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Copy and paste the configuration into your client configuration file.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Claude Desktop */}
          <Card className="p-6 bg-white border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center font-bold text-xs">
                  AI
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Claude Desktop</h3>
                  <span className="text-[11px] text-slate-400 font-mono">claude_desktop_config.json</span>
                </div>
              </div>
              <Badge variant="outline" className="text-[10px]">
                Streamable HTTP
              </Badge>
            </div>

            <pre className="p-4 rounded-xl bg-surface-950 text-emerald-400 font-mono text-xs overflow-x-auto mb-3">
              {claudeDesktopConfig}
            </pre>

            <p className="text-xs text-slate-500">
              Save in <code className="text-slate-700 bg-slate-100 px-1 py-0.5 rounded">~/.config/Claude/claude_desktop_config.json</code> (Linux) or <code className="text-slate-700 bg-slate-100 px-1 py-0.5 rounded">~/Library/Application Support/Claude/</code> (macOS).
            </p>
          </Card>

          {/* Cursor / Windsurf */}
          <Card className="p-6 bg-white border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">
                  IDE
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Cursor / Windsurf</h3>
                  <span className="text-[11px] text-slate-400 font-mono">.cursor/mcp.json</span>
                </div>
              </div>
              <Badge variant="outline" className="text-[10px]">
                mcp-remote Bridge
              </Badge>
            </div>

            <pre className="p-4 rounded-xl bg-surface-950 text-emerald-400 font-mono text-xs overflow-x-auto mb-3">
              {cursorConfig}
            </pre>

            <p className="text-xs text-slate-500">
              Paste in your project&apos;s <code className="text-slate-700 bg-slate-100 px-1 py-0.5 rounded">.cursor/mcp.json</code> or global IDE MCP settings.
            </p>
          </Card>
        </div>
      </div>

      {/* 4. Declarative Tools Reference */}
      <div className="space-y-6">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            Declarative MCP Tools Reference
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            All 5 tools are declared with <code className="text-brand-700 font-mono text-xs">readOnlyHint: true</code> and strictly parameterized SQL.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-card">
          <div className="divide-y divide-slate-200">
            {/* Tool 1 */}
            <div className="p-6 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-sm font-bold text-brand-700">find_shops(query?, locality?, category?, open_now?, max_price_inr?, radius_km?)</span>
                <Badge variant="brand" className="text-[10px]">Search & Rank</Badge>
              </div>
              <p className="text-xs text-slate-600">
                Discovers and spatial-ranks local shops in Chennai. Validates coordinates against the 32 localities bounding box, applies H1–H5 hard filters, computes IST open-now status, and returns top matching catalog items.
              </p>
            </div>

            {/* Tool 2 */}
            <div className="p-6 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-sm font-bold text-brand-700">get_shop_info(shop_slug)</span>
                <Badge variant="neutral" className="text-[10px]">Profile</Badge>
              </div>
              <p className="text-xs text-slate-600">
                Retrieves complete public shop details: verified address, GPS coordinates, primary phone, WhatsApp, weekly 7-day schedule intervals, and scheduled holiday closures.
              </p>
            </div>

            {/* Tool 3 */}
            <div className="p-6 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-sm font-bold text-brand-700">get_catalog(shop_slug, kind?, cursor?)</span>
                <Badge variant="neutral" className="text-[10px]">Menu / Services</Badge>
              </div>
              <p className="text-xs text-slate-600">
                Returns the full item/service catalog grouped by section (e.g. &apos;iPhone Repairs&apos;, &apos;MacBook Services&apos;). Supports keyset pagination and specifies fixed/range INR pricing and service duration.
              </p>
            </div>

            {/* Tool 4 */}
            <div className="p-6 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-sm font-bold text-brand-700">search_catalog(shop_slug, query, max_price_inr?, kind?)</span>
                <Badge variant="neutral" className="text-[10px]">Catalog Search</Badge>
              </div>
              <p className="text-xs text-slate-600">
                Searches items within a specific shop catalog using trigram similarity and text matching with price ceiling filtering.
              </p>
            </div>

            {/* Tool 5 */}
            <div className="p-6 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-sm font-bold text-brand-700">get_action_link(shop_slug, item_id?, customer_note?, preferred_time?)</span>
                <Badge variant="brand" className="text-[10px]">Action Deep Link</Badge>
              </div>
              <p className="text-xs text-slate-600">
                Constructs a ready-to-click WhatsApp deep link (<code className="font-mono text-[11px] text-emerald-700">https://wa.me/...</code>) pre-filled with structured enquiry messages and the mandatory PRD disclaimer.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
