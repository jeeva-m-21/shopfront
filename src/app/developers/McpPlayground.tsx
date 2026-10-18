'use client';

import React, { useState } from 'react';
import {
  Play,
  Copy,
  Check,
  Terminal,
  Clock,
  Code2,
} from 'lucide-react';
import { Button } from '../../components/ui/button.js';
import { Badge } from '../../components/ui/badge.js';

interface ToolPreset {
  name: string;
  description: string;
  defaultArgs: Record<string, unknown>;
}

const TOOL_PRESETS: ToolPreset[] = [
  {
    name: 'find_shops',
    description: 'Find and rank local shops in Chennai with distance, budget, and open-now constraints.',
    defaultArgs: {
      locality: 'Adyar',
      query: 'iPhone screen repair',
      category: 'repair_service',
      open_now: false,
    },
  },
  {
    name: 'get_shop_info',
    description: 'Retrieve detailed public shop profile including address, coordinates, hours, and contact.',
    defaultArgs: {
      shop_slug: 'adyar-mac-iphone-care',
    },
  },
  {
    name: 'get_catalog',
    description: 'Retrieve menu or service catalog items grouped by category with prices and duration.',
    defaultArgs: {
      shop_slug: 'adyar-mac-iphone-care',
    },
  },
  {
    name: 'search_catalog',
    description: 'Search items within a specific shop catalog using text similarity and price ceilings.',
    defaultArgs: {
      shop_slug: 'adyar-mac-iphone-care',
      query: 'Battery',
      max_price_inr: 5000,
    },
  },
  {
    name: 'get_action_link',
    description: 'Generate an actionable WhatsApp deep link with standard customer enquiry message.',
    defaultArgs: {
      shop_slug: 'adyar-mac-iphone-care',
      customer_note: 'Screen is cracked, need fast turnaround',
    },
  },
];

export function McpPlayground() {
  const [selectedTool, setSelectedTool] = useState<ToolPreset>(TOOL_PRESETS[0]!);
  const [argsJson, setArgsJson] = useState<string>(
    JSON.stringify(TOOL_PRESETS[0]!.defaultArgs, null, 2)
  );
  const [result, setResult] = useState<string | null>(null);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleToolChange = (tool: ToolPreset) => {
    setSelectedTool(tool);
    setArgsJson(JSON.stringify(tool.defaultArgs, null, 2));
    setResult(null);
    setLatencyMs(null);
  };

  const executeTool = async () => {
    let parsedArgs: Record<string, unknown>;
    try {
      parsedArgs = JSON.parse(argsJson);
    } catch {
      setResult(JSON.stringify({ error: 'Invalid JSON in arguments editor' }, null, 2));
      return;
    }

    setLoading(true);
    setResult(null);
    const start = performance.now();

    try {
      const response = await fetch('/mcp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json, text/event-stream',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: Date.now(),
          method: 'tools/call',
          params: {
            name: selectedTool.name,
            arguments: parsedArgs,
          },
        }),
      });

      const elapsed = Math.round(performance.now() - start);
      setLatencyMs(elapsed);

      const data = await response.json();
      if (data.result?.content?.[0]?.text) {
        try {
          const parsedContent = JSON.parse(data.result.content[0].text);
          setResult(JSON.stringify(parsedContent, null, 2));
        } catch {
          setResult(data.result.content[0].text);
        }
      } else {
        setResult(JSON.stringify(data, null, 2));
      }
    } catch (err: unknown) {
      setLatencyMs(Math.round(performance.now() - start));
      const message = err instanceof Error ? err.message : 'Unknown error';
      setResult(JSON.stringify({ error: 'Network or server error', message }, null, 2));
    } finally {
      setLoading(false);
    }
  };

  const copyConfig = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8">
      {/* Tool Selector Tabs */}
      <div className="flex flex-wrap gap-2 pb-2 border-b border-stone-200">
        {TOOL_PRESETS.map((t) => (
          <button
            key={t.name}
            onClick={() => handleToolChange(t)}
            className={`px-3.5 py-2 rounded-xl text-xs font-mono font-semibold transition-all ${
              selectedTool.name === t.name
                ? 'bg-marina-600 text-white shadow-paper'
                : 'bg-white border border-stone-200 text-stone-700 hover:border-marina-300 hover:bg-stone-50'
            }`}
          >
            {t.name}()
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Arguments Editor */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-700 uppercase tracking-wider flex items-center gap-1.5 font-mono">
              <Code2 className="w-4 h-4 text-marina-600" />
              Tool Arguments (JSON)
            </span>
            <Badge variant="outline" className="text-[10px] font-mono border-stone-300 text-stone-600">
              readOnlyHint: true
            </Badge>
          </div>

          <div className="relative">
            <textarea
              rows={11}
              value={argsJson}
              onChange={(e) => setArgsJson(e.target.value)}
              className="w-full font-mono text-xs p-4 bg-stone-900 text-marina-300 rounded-2xl border border-stone-800 focus:outline-none focus:ring-2 focus:ring-marina-500 shadow-inner"
              spellCheck={false}
            />
          </div>

          <p className="text-xs text-stone-500 leading-relaxed font-sans">
            {selectedTool.description}
          </p>

          <Button
            onClick={executeTool}
            disabled={loading}
            variant="primary"
            className="w-full py-2.5 font-semibold bg-marina-600 hover:bg-marina-700 text-white rounded-xl shadow-paper"
          >
            <Play className="w-3.5 h-3.5 mr-1.5 fill-current" />
            <span>{loading ? 'Executing on /mcp...' : `Call ${selectedTool.name}`}</span>
          </Button>
        </div>

        {/* Live Response Viewer */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-700 uppercase tracking-wider flex items-center gap-1.5 font-mono">
              <Terminal className="w-4 h-4 text-stone-500" />
              Live Server Response
            </span>
            {latencyMs !== null && (
              <Badge variant="success" className="text-[10px] font-mono bg-status-open/10 text-status-open border-status-open/20">
                <Clock className="w-3 h-3" /> {latencyMs} ms
              </Badge>
            )}
          </div>

          <div className="relative">
            <pre className="font-mono text-xs p-4 bg-stone-900 text-stone-200 rounded-2xl border border-stone-800 min-h-[260px] max-h-[380px] overflow-auto shadow-inner">
              {result ? (
                result
              ) : (
                <span className="text-stone-500 italic">
                  {"// Click 'Call " + selectedTool.name + "' to execute a real JSON-RPC call against the live MCP endpoint..."}
                </span>
              )}
            </pre>

            {result && (
              <button
                onClick={() => copyConfig(result)}
                className="absolute top-3 right-3 p-1.5 rounded-lg bg-stone-800 border border-stone-700 text-stone-300 hover:text-white text-xs transition-colors"
                title="Copy response JSON"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-status-open" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
