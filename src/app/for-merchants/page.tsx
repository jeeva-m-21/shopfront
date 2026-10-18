import React from 'react';
import type { Metadata } from 'next';
import { Check } from 'lucide-react';
import { CHENNAI_LOCALITIES } from '../../domain/localities.js';
import { MerchantApplyForm } from './MerchantApplyForm.js';
import { Card } from '../../components/ui/card.js';
import { Badge } from '../../components/ui/badge.js';

export const metadata: Metadata = {
  title: 'Join Shopfront — 0% Commission Merchant Discovery in Chennai',
  description:
    'List your Chennai store on Shopfront. Receive direct WhatsApp enquiries from local customers and AI agents with zero commission fees.',
};

export default function ForMerchantsPage() {
  const sortedLocalities = [...CHENNAI_LOCALITIES].sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 space-y-16">
      {/* 1. Hero */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <Badge variant="success" className="text-xs px-3 py-1 shadow-sm">
          Chennai Merchant Pilot • 100% Free
        </Badge>

        <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-[1.15]">
          Stop Paying 30% Commissions.{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-emerald-500">
            Get Direct WhatsApp Leads.
          </span>
        </h1>

        <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
          Shopfront is Chennai&apos;s open neighborhood merchant network. When customers or AI agents search for services in your locality, they connect directly to your store on WhatsApp. You keep 100% of your earnings.
        </p>
      </div>

      {/* 2. Comparison Table */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {/* Aggregators */}
        <Card className="p-6 bg-slate-50/70 border-slate-200">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-200">
            <div>
              <h3 className="text-base font-bold text-slate-700">Traditional Aggregators</h3>
              <p className="text-xs text-slate-400">Swiggy, Zomato, Urban Company, Justdial</p>
            </div>
            <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded">High Cost</span>
          </div>

          <ul className="space-y-3 text-xs text-slate-600">
            <li className="flex items-start gap-2">
              <span className="text-red-500 font-bold">✕</span>
              <span><strong>20% to 30% commission</strong> deducted from every transaction</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-500 font-bold">✕</span>
              <span>Customer data is masked; you cannot build a direct relationship</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-500 font-bold">✕</span>
              <span>Must pay sponsored ads to rank higher in search algorithms</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-500 font-bold">✕</span>
              <span>Payouts delayed by 7 to 14 days</span>
            </li>
          </ul>
        </Card>

        {/* Shopfront */}
        <Card className="p-6 bg-brand-50/40 border-brand-300 ring-2 ring-brand-500/20">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-brand-200">
            <div>
              <h3 className="text-base font-bold text-brand-900">Shopfront Chennai</h3>
              <p className="text-xs text-brand-700">Open Hyperlocal & Agent Commerce</p>
            </div>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">0% Commission</span>
          </div>

          <ul className="space-y-3 text-xs text-slate-700">
            <li className="flex items-start gap-2">
              <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span><strong>0% Commission:</strong> You keep 100% of every sale</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span><strong>Direct WhatsApp Connection:</strong> The customer chats with your phone number</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span><strong>AI Agent Discovery:</strong> Claude, Cursor, and LLMs query your live catalog</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span><strong>Owner Self-Service:</strong> Update your hours, menu, and pause anytime</span>
            </li>
          </ul>
        </Card>
      </div>

      {/* 3. The Application Form */}
      <div id="apply" className="max-w-3xl mx-auto space-y-4">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            Apply to Join the Chennai Pilot
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Takes under 2 minutes. We review and activate verified listings within 24 hours.
          </p>
        </div>

        <MerchantApplyForm localities={sortedLocalities} />
      </div>

      {/* 4. Merchant FAQ */}
      <div id="faq" className="max-w-3xl mx-auto space-y-6 pt-8 border-t border-slate-200">
        <div className="text-center">
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Frequently Asked Questions
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Everything you need to know about listing your business on Shopfront.
          </p>
        </div>

        <div className="space-y-4">
          <Card className="p-5">
            <h3 className="text-sm font-bold text-slate-900 mb-1">
              Is Shopfront really 100% free with zero commission?
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Yes. The pilot in Chennai is completely free. We do not process payments or charge take rates. Customers contact you directly via WhatsApp or phone, and they pay you directly through UPI or cash.
            </p>
          </Card>

          <Card className="p-5">
            <h3 className="text-sm font-bold text-slate-900 mb-1">
              How do AI agents like Claude or Cursor find my shop?
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Shopfront exposes a declarative Model Context Protocol (MCP) server. When a user asks an AI assistant &quot;Find me a MacBook repair specialist in Adyar&quot;, the AI queries our database via MCP, matches your catalog, checks your opening hours, and provides a WhatsApp deep link to chat with you.
            </p>
          </Card>

          <Card className="p-5">
            <h3 className="text-sm font-bold text-slate-900 mb-1">
              Can I pause my shop when I go on vacation?
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Yes. Every verified merchant receives credentials to the Owner Portal where you can toggle your shop status between active and paused with a single click, or schedule upcoming holiday closure dates.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
