'use client';

import React, { useState } from 'react';
import { Bot, MessageCircle, ShieldCheck } from 'lucide-react';

interface AiPreviewCardProps {
  shop: {
    id: string;
    slug: string;
    name: string;
    category: string;
    status: string;
    locality_name: string;
    address: string;
    contact_phone?: string | null;
    whatsapp_number?: string | null;
  };
  availableItemsCount: number;
  totalItemsCount: number;
  menuUpdatedText: string;
}

export function AiPreviewCard({
  shop,
  availableItemsCount,
  totalItemsCount,
  menuUpdatedText,
}: AiPreviewCardProps) {
  const [activeTab, setActiveTab] = useState<'conversational' | 'raw_json'>('conversational');

  const isLive = shop.status === 'live';

  const mockMcpPayload = {
    shop_id: shop.id,
    slug: shop.slug,
    name: shop.name,
    category: shop.category,
    status: shop.status,
    is_live: isLive,
    locality: shop.locality_name,
    address: shop.address,
    verified_at: new Date().toISOString(),
    catalog_summary: {
      available_items: availableItemsCount,
      total_items: totalItemsCount,
      last_updated: menuUpdatedText,
    },
    contact: {
      phone: shop.contact_phone ?? '+919840012345',
      whatsapp: shop.whatsapp_number ?? '+919840012345',
      action_url: `https://wa.me/${(shop.whatsapp_number ?? '919840012345').replace(/\D/g, '')}?text=Hello%20${encodeURIComponent(shop.name)}%2C%20I%20found%20you%20via%20AI%20Assistant`,
    },
  };

  return (
    <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-paper space-y-0">
      {/* Header with Title and Mode Switcher */}
      <div className="p-5 sm:p-6 border-b border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-stone-50/50">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-md bg-marina-600 text-white flex items-center justify-center">
              <Bot className="w-3.5 h-3.5" />
            </span>
            <h2 className="font-display text-lg sm:text-xl font-normal text-stone-900">
              AI Assistant Live Preview
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-turmeric-100 text-turmeric-800 border border-turmeric-300">
              Signature Feature
            </span>
          </div>
          <p className="text-xs text-stone-500 font-sans">
            This is exactly how Claude, ChatGPT, Cursor, and AI agents read and speak about your store right now.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="inline-flex rounded-lg border border-stone-200 bg-stone-100 p-0.5 text-xs font-mono self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('conversational')}
            className={`px-3 py-1.5 rounded-md transition-all ${
              activeTab === 'conversational'
                ? 'bg-white text-stone-900 font-medium shadow-sm'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            AI Conversation
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('raw_json')}
            className={`px-3 py-1.5 rounded-md transition-all ${
              activeTab === 'raw_json'
                ? 'bg-white text-stone-900 font-medium shadow-sm'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Raw MCP Data
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="p-5 sm:p-6">
        {activeTab === 'conversational' ? (
          <div className="space-y-4 max-w-3xl">
            {/* Simulated Customer Prompt */}
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-lg bg-stone-200 flex items-center justify-center text-stone-700 text-xs font-bold shrink-0">
                U
              </div>
              <div className="p-3 rounded-2xl bg-stone-100 text-stone-800 text-xs font-sans leading-relaxed">
                &ldquo;Who is open for services near {shop.locality_name} right now?&rdquo;
              </div>
            </div>

            {/* Simulated Assistant Response */}
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-lg bg-marina-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                AI
              </div>
              <div className="p-4 rounded-2xl bg-marina-50/70 border border-marina-200 text-stone-900 text-xs font-sans space-y-3 leading-relaxed w-full">
                {isLive ? (
                  <>
                    <p>
                      I recommend <strong>{shop.name}</strong> located at {shop.address} in {shop.locality_name}.
                    </p>
                    <div className="flex flex-wrap items-center gap-3 text-[11px] font-mono text-stone-600">
                      <span className="inline-flex items-center gap-1.5 text-status-open font-semibold">
                        <span className="w-2 h-2 rounded-full bg-status-open animate-pulse" />
                        Shutter is UP (Live &amp; Open)
                      </span>
                      <span>•</span>
                      <span>{availableItemsCount} catalog offerings verified</span>
                      <span>•</span>
                      <span className="text-stone-500">{menuUpdatedText}</span>
                    </div>
                    <div className="pt-2">
                      <a
                        href={mockMcpPayload.contact.action_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-status-open hover:bg-[#156e3b] text-white text-xs font-medium transition-colors shadow-sm"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>Chat Directly on WhatsApp (0% Fee)</span>
                      </a>
                    </div>
                  </>
                ) : (
                  <div className="p-3 bg-stone-100 rounded-xl border border-stone-200 text-stone-600 space-y-1">
                    <p className="font-semibold text-stone-800">
                      ⚠️ Shutter is currently DOWN ({shop.status.toUpperCase()})
                    </p>
                    <p className="text-[11px]">
                      AI assistants will <strong>not</strong> recommend your store while paused or in draft, protecting you from unattended customer messages.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Raw MCP JSON view */
          <div className="rounded-xl overflow-hidden border border-stone-800 bg-[#100F0D] p-4 text-emerald-400 font-mono text-[11px] space-y-2">
            <div className="flex items-center justify-between pb-2 border-b border-stone-800 text-[10px] text-stone-400">
              <span>ENDPOINT: mcp://chennai.shopfront.io/get_shop_info</span>
              <span>SCHEMA: v2026-09</span>
            </div>
            <pre className="overflow-x-auto leading-relaxed text-[11px]">
              {JSON.stringify(mockMcpPayload, null, 2)}
            </pre>
          </div>
        )}
      </div>

      {/* Footer Status Bar */}
      <div className="px-5 py-3.5 bg-stone-50 border-t border-stone-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-stone-500 font-mono">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-3.5 h-3.5 text-marina-600" />
          <span>Refreshes live after every catalog or schedule update.</span>
        </div>
        <span className="text-[11px] text-stone-400">Zero ORM • Direct PostGIS ground truth</span>
      </div>
    </div>
  );
}
