'use client';

import React, { useState } from 'react';
import {
  Check,
  Copy,
  Activity,
  Sparkles,
  Zap,
  ShieldCheck,
  Wrench,
} from 'lucide-react';
import { ShutterMark } from '../../components/brand/ShutterMark';
import { McpPlayground } from '../developers/McpPlayground';

interface ConnectInterfaceProps {
  baseUrl: string;
}

type ClientTab = 'claude-desktop' | 'claude-code' | 'cursor' | 'vscode' | 'stdio';

export function ConnectInterface({ baseUrl }: ConnectInterfaceProps) {
  const [activeTab, setActiveTab] = useState<ClientTab>('claude-desktop');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Live Ping state
  const [pingStatus, setPingStatus] = useState<'idle' | 'pinging' | 'success' | 'error'>('idle');
  const [pingLatency, setPingLatency] = useState<number | null>(null);
  const [pingResponse, setPingResponse] = useState<string | null>(null);

  const mcpUrl = `${baseUrl}/mcp`;

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => {
      setCopiedKey(null);
    }, 2500);
  };

  const handlePing = async () => {
    setPingStatus('pinging');
    setPingLatency(null);
    setPingResponse(null);

    const startTime = performance.now();
    try {
      const res = await fetch('/mcp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'initialize',
          params: {
            protocolVersion: '2024-11-05',
            capabilities: {},
            clientInfo: {
              name: 'shopfront-connect-tester',
              version: '2.0.0',
            },
          },
        }),
      });

      const endTime = performance.now();
      const latency = Math.round(endTime - startTime);
      setPingLatency(latency);

      if (res.ok) {
        const json = await res.json();
        setPingStatus('success');
        setPingResponse(JSON.stringify(json, null, 2));
      } else {
        setPingStatus('error');
        setPingResponse(`HTTP ${res.status} ${res.statusText}`);
      }
    } catch (err: unknown) {
      setPingStatus('error');
      setPingResponse(err instanceof Error ? err.message : 'Network error');
    }
  };

  const configs: Record<ClientTab, { title: string; filename: string; snippet: string; instructions: string }> = {
    'claude-desktop': {
      title: 'Claude Desktop',
      filename: 'claude_desktop_config.json',
      instructions: 'Add to ~/Library/Application Support/Claude/claude_desktop_config.json (macOS) or %APPDATA%\\Claude\\claude_desktop_config.json (Windows):',
      snippet: JSON.stringify(
        {
          mcpServers: {
            shopfront: {
              url: mcpUrl,
            },
          },
        },
        null,
        2
      ),
    },
    'claude-code': {
      title: 'Claude Code CLI',
      filename: 'Terminal Command',
      instructions: 'Run this one command in your shell to register Shopfront directly into Claude Code:',
      snippet: `claude mcp add shopfront ${mcpUrl}`,
    },
    cursor: {
      title: 'Cursor IDE',
      filename: '.cursor/mcp.json',
      instructions: 'Save in your workspace at .cursor/mcp.json or in Cursor Settings > Features > MCP:',
      snippet: JSON.stringify(
        {
          mcpServers: {
            shopfront: {
              command: 'npx',
              args: ['-y', 'mcp-remote', mcpUrl],
            },
          },
        },
        null,
        2
      ),
    },
    vscode: {
      title: 'VS Code (Cline / Roo)',
      filename: 'cline_mcp_settings.json',
      instructions: 'Add to your Cline / Roo Code MCP Settings:',
      snippet: JSON.stringify(
        {
          mcpServers: {
            shopfront: {
              url: mcpUrl,
              disabled: false,
              autoApprove: ['find_shops', 'get_shop_info', 'get_catalog', 'search_catalog', 'get_action_link'],
            },
          },
        },
        null,
        2
      ),
    },
    stdio: {
      title: 'Local Stdio Transport',
      filename: 'Standard I/O CLI',
      instructions: 'For offline or local development with standard input/output transport:',
      snippet: `npx tsx scripts/mcp-stdio.ts`,
    },
  };

  const promptChips = [
    'Find a MacBook screen repair in Adyar open right now',
    'Emergency iPhone battery replacement in Anna Nagar',
    'Filter coffee and south Indian tiffin near Mylapore',
    'Unisex hair salon in T. Nagar with haircut under ₹500',
    'Bakery in Velachery open after 9 PM',
    'Search for vegetarian biryani in T. Nagar',
  ];

  const tools = [
    {
      name: 'find_shops',
      signature: '(query?, locality?, category?, max_price_inr?, open_now?, radius_km?)',
      purpose: 'Searches verified Chennai shops using PostGIS geography, open-now IST schedules, and Jev semantic reranking.',
      badge: 'Discovery',
    },
    {
      name: 'get_shop_info',
      signature: '(shop_slug)',
      purpose: 'Retrieves complete verified business profile, today and weekly hours, phone, and coordinates.',
      badge: 'Merchant Info',
    },
    {
      name: 'get_catalog',
      signature: '(shop_slug, cursor?, limit?)',
      purpose: 'Fetches the structured service menu with keyset cursor pagination and transparent INR pricing.',
      badge: 'Catalog',
    },
    {
      name: 'search_catalog',
      signature: '(shop_slug, query, max_price_inr?, kind?)',
      purpose: 'Searches inside a specific shop menu using trigram fuzzy similarity and price ceiling constraints.',
      badge: 'Search',
    },
    {
      name: 'get_action_link',
      signature: '(shop_slug, item_id?, customer_note?, preferred_time?)',
      purpose: 'Generates ready-to-click WhatsApp deep link with structured enquiry text and statutory disclaimers.',
      badge: 'Action Link',
    },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14 space-y-12">
      {/* 1. Header / Hero */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-stone-100 border border-stone-200 text-stone-700 text-xs font-mono font-medium">
          <ShutterMark size={14} />
          <span>Model Context Protocol · Chennai Service Area</span>
        </div>

        <h1 className="font-display text-4xl sm:text-5xl font-normal text-stone-900 tracking-[-0.02em] leading-tight">
          Connect Shopfront to Your AI Agent in 60 Seconds
        </h1>

        <p className="text-base text-stone-600 leading-relaxed font-sans max-w-2xl mx-auto">
          One configuration snippet brings 10 verified pilot shops, live IST operating hours, and zero-commission WhatsApp ordering directly into Claude, Cursor, or your custom agent framework.
        </p>

        {/* Official Registry Badge */}
        <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
          <a
            href="https://github.com/modelcontextprotocol/registry"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono bg-marina-50 border border-marina-200 text-marina-700 hover:bg-marina-100 transition-colors"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-marina-600" />
            <span>Registry: io.github.jeeva-m-21/shopfront</span>
          </a>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono bg-stone-100 border border-stone-200 text-stone-600">
            <span>Transport: Streamable HTTP</span>
          </span>
        </div>
      </div>

      {/* 2. Interactive 60-Second Setup Card */}
      <div className="bg-white border border-stone-200 rounded-2xl shadow-paper overflow-hidden">
        {/* Client Selector Tab Bar */}
        <div className="flex border-b border-stone-200 bg-stone-50 overflow-x-auto">
          {(['claude-desktop', 'claude-code', 'cursor', 'vscode', 'stdio'] as ClientTab[]).map((tab) => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-3.5 text-xs font-medium border-b-2 whitespace-nowrap transition-colors flex items-center gap-2 ${
                  isActive
                    ? 'border-marina-600 text-marina-700 bg-white font-semibold'
                    : 'border-transparent text-stone-600 hover:text-stone-900 hover:bg-stone-100/60'
                }`}
              >
                <span>{configs[tab].title}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-xs text-stone-500 font-mono">
                {configs[activeTab].filename}
              </p>
              <p className="text-sm text-stone-700 mt-0.5">
                {configs[activeTab].instructions}
              </p>
            </div>

            <button
              type="button"
              onClick={() => copyToClipboard(configs[activeTab].snippet, 'tab-snippet')}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-lg bg-stone-900 text-white hover:bg-stone-800 transition-colors self-start sm:self-auto shrink-0 shadow-paper"
            >
              {copiedKey === 'tab-snippet' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-turmeric-500" />
                  <span>Copied to Clipboard!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Snippet</span>
                </>
              )}
            </button>
          </div>

          {/* Code block */}
          <div className="relative rounded-xl bg-stone-900 p-4 font-mono text-xs text-stone-200 overflow-x-auto shadow-inner">
            <pre className="text-marina-300 leading-relaxed">
              {configs[activeTab].snippet}
            </pre>
          </div>
        </div>
      </div>

      {/* 3. Live Server Ping Test & Diagnostic Tool */}
      <div className="bg-stone-50 border border-stone-200 rounded-2xl p-6 sm:p-8 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-marina-600" />
              <h2 className="text-sm font-semibold uppercase tracking-wider text-stone-900 font-mono">
                Live Handshake & Latency Diagnostic
              </h2>
            </div>
            <p className="text-xs text-stone-600 font-sans">
              Test your browser&apos;s connection to the live Streamable HTTP MCP endpoint (`POST /mcp`).
            </p>
          </div>

          <button
            type="button"
            onClick={handlePing}
            disabled={pingStatus === 'pinging'}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium bg-marina-600 text-white hover:bg-marina-700 disabled:opacity-50 transition-colors shadow-paper"
          >
            <Zap className={`w-3.5 h-3.5 ${pingStatus === 'pinging' ? 'animate-spin' : ''}`} />
            <span>{pingStatus === 'pinging' ? 'Testing Handshake...' : 'Ping MCP Server'}</span>
          </button>
        </div>

        {/* Ping status output */}
        {pingStatus !== 'idle' && (
          <div className="mt-4 p-4 rounded-xl border border-stone-200 bg-white space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <div className="flex items-center gap-2">
                <span
                  className={`w-2 h-2 rounded-full ${
                    pingStatus === 'success'
                      ? 'bg-status-open animate-pulse'
                      : pingStatus === 'error'
                      ? 'bg-status-closed'
                      : 'bg-turmeric-500 animate-spin'
                  }`}
                />
                <span className="font-semibold text-stone-800">
                  {pingStatus === 'success' ? 'Connected (200 OK)' : pingStatus === 'error' ? 'Handshake Failed' : 'Pinging...'}
                </span>
              </div>
              {pingLatency !== null && (
                <span className="text-stone-500">
                  Roundtrip: <strong className="text-stone-900">{pingLatency}ms</strong>
                </span>
              )}
            </div>

            {pingResponse && (
              <pre className="text-[11px] font-mono text-stone-600 bg-stone-100 p-3 rounded-lg overflow-x-auto max-h-40">
                {pingResponse}
              </pre>
            )}
          </div>
        )}
      </div>

      {/* 4. Copyable Prompt Chips */}
      <div className="space-y-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-turmeric-500" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-stone-900 font-mono">
              Try It in Your Agent (Click to Copy)
            </h2>
          </div>
          <p className="text-xs text-stone-600 font-sans">
            Once connected, paste any of these real Chennai customer prompts into Claude Desktop, Cursor, or Claude Code:
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {promptChips.map((prompt, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => copyToClipboard(prompt, `chip-${idx}`)}
              className="text-left p-3.5 rounded-xl border border-stone-200 bg-white hover:border-marina-300 hover:bg-marina-50/30 transition-all group flex flex-col justify-between gap-3 shadow-paper"
            >
              <p className="text-xs text-stone-800 font-medium group-hover:text-marina-800 leading-snug">
                &ldquo;{prompt}&rdquo;
              </p>
              <div className="flex items-center justify-between text-[11px] text-stone-400 group-hover:text-marina-600 font-mono">
                <span>{copiedKey === `chip-${idx}` ? '✓ Copied!' : 'Click to copy'}</span>
                <Copy className="w-3 h-3" />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 5. Tool Reference */}
      <div className="space-y-4 pt-4 border-t border-stone-200">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Wrench className="w-4 h-4 text-marina-600" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-stone-900 font-mono">
              The 5 Declarative MCP Tools
            </h2>
          </div>
          <p className="text-xs text-stone-600 font-sans">
            Every tool declares <code className="font-mono text-stone-800">readOnlyHint: true</code> and complies strictly with the MCP 2024-11-05 schema.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tools.map((tool, idx) => (
            <div
              key={idx}
              className="p-5 rounded-xl border border-stone-200 bg-white shadow-paper space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-marina-700">
                  {tool.name}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-stone-100 text-stone-600 border border-stone-200">
                  {tool.badge}
                </span>
              </div>
              <p className="font-mono text-[11px] text-stone-500 break-words">
                {tool.signature}
              </p>
              <p className="text-xs text-stone-600 leading-relaxed font-sans">
                {tool.purpose}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* 6. Interactive MCP Tool Playground */}
      <div className="pt-4 border-t border-stone-200">
        <McpPlayground />
      </div>
    </div>
  );
}
