import React from 'react';
import type { Metadata } from 'next';
import {
  Check,
  X,
  Bot,
  MessageCircle,
  Clock,
  ShieldCheck,
  DollarSign,
  Languages,
  Sliders,
  Store,
} from 'lucide-react';
import { CHENNAI_LOCALITIES } from '../../domain/localities.js';
import { MerchantApplyForm } from './MerchantApplyForm.js';
import { Card } from '../../components/ui/card.js';
import { ShutterMark } from '@/components/brand/ShutterMark';

export const metadata: Metadata = {
  title: 'Be the Answer When People Ask AI • Shopfront For Merchants',
  description:
    'Shopfront makes local businesses visible to AI assistants. One low-cost listing, 0% commission, and direct WhatsApp contact when customers ask Claude, ChatGPT, or Cursor for services near them.',
};

export default function ForMerchantsPage() {
  const sortedLocalities = [...CHENNAI_LOCALITIES].sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 space-y-20 bg-stone-25">
      {/* 1. Hero Section: Novelty Positioning */}
      <div className="text-center max-w-4xl mx-auto space-y-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-turmeric-100 text-turmeric-800 border border-turmeric-300 text-xs font-mono font-medium shadow-paper">
          <ShutterMark size={14} />
          <span>The New Frontier: Local Shops, Found by AI</span>
        </div>

        <h1 className="font-display text-4xl sm:text-6xl text-stone-900 tracking-[-0.02em] leading-[1.12]">
          When people ask AI for a service near them,{' '}
          <span className="relative inline-block text-marina-700">
            be the answer.
            <span className="absolute left-0 right-0 -bottom-1.5 h-1.5 bg-turmeric-500 rounded-full" />
          </span>
        </h1>

        <p className="text-lg sm:text-xl text-stone-600 leading-relaxed font-sans max-w-3xl mx-auto">
          People now ask AI assistants instead of opening apps. But businesses spread across separate franchise apps and marketplaces get <strong>zero visibility</strong> from AI search. Shopfront gives you <strong>one low-cost, commission-free listing</strong> exposed through MCP that every AI assistant can read.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          <a
            href="#apply"
            className="px-6 py-3 rounded-xl bg-marina-600 hover:bg-marina-700 text-white font-medium text-sm transition-all shadow-paper hover:-translate-y-0.5"
          >
            Apply for Free Pilot →
          </a>
          <a
            href="#what-ai-sees"
            className="px-6 py-3 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 text-stone-700 font-medium text-sm transition-all shadow-paper"
          >
            See What AI Sees ↓
          </a>
        </div>
      </div>

      {/* 2. The Core Problem: Separate Apps vs One AI-Native Listing */}
      <div className="space-y-8 max-w-5xl mx-auto">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="font-display text-3xl text-stone-900">
            Separate Apps vs. One AI-Native Listing
          </h2>
          <p className="text-sm text-stone-600">
            Why building another app or paying 30% aggregator fees fails in the age of conversational AI.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* The Separate Apps Trap */}
          <Card className="p-6 sm:p-8 bg-white border-stone-200 shadow-paper space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-stone-100">
              <div className="space-y-0.5">
                <span className="text-xs font-mono font-bold text-red-600 uppercase tracking-wider">The Old Way</span>
                <h3 className="text-lg font-bold text-stone-900">Separate Apps &amp; Marketplace Trap</h3>
                <p className="text-xs text-stone-500">Swiggy, Zomato, Urban Company, Franchise Apps</p>
              </div>
              <span className="text-xs font-bold text-red-700 bg-red-50 border border-red-200 px-2.5 py-1 rounded-full">
                App Fatigue
              </span>
            </div>

            <ul className="space-y-4 text-xs text-stone-600 font-sans">
              <li className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0 mt-0.5">
                  <X className="w-3.5 h-3.5" />
                </div>
                <span><strong>Invisible to AI Search:</strong> Claude, ChatGPT, and Cursor cannot query closed franchise apps or walled marketplaces. You get zero AI search traffic.</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0 mt-0.5">
                  <X className="w-3.5 h-3.5" />
                </div>
                <span><strong>App Fatigue:</strong> Customers refuse to install and keep 30 different apps for every franchise, cafe, or repair technician.</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0 mt-0.5">
                  <X className="w-3.5 h-3.5" />
                </div>
                <span><strong>20% to 30% Aggregator Tax:</strong> Middlemen charge huge take-rate commissions and hold your customer data hostage behind masked numbers.</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0 mt-0.5">
                  <X className="w-3.5 h-3.5" />
                </div>
                <span><strong>Stale Opening Hours:</strong> Platforms fail to track your real lunch breaks, afternoon pauses, or festival holidays.</span>
              </li>
            </ul>
          </Card>

          {/* Shopfront: One AI-Native Listing */}
          <Card className="p-6 sm:p-8 bg-marina-50/50 border-marina-300 ring-2 ring-marina-500/20 shadow-paper space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-marina-200">
              <div className="space-y-0.5">
                <span className="text-xs font-mono font-bold text-marina-700 uppercase tracking-wider">The Shopfront Way</span>
                <h3 className="text-lg font-bold text-stone-900">One AI-Native Listing</h3>
                <p className="text-xs text-marina-800 font-mono">Exposed via Model Context Protocol (MCP)</p>
              </div>
              <span className="text-xs font-bold text-marina-800 bg-white border border-marina-300 px-2.5 py-1 rounded-full shadow-sm">
                0% Commission
              </span>
            </div>

            <ul className="space-y-4 text-xs text-stone-800 font-sans">
              <li className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-status-open text-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                  <Check className="w-3.5 h-3.5" />
                </div>
                <span><strong>AI-Native from Day One:</strong> One listing makes your store queryable by Claude Desktop, Cursor, ChatGPT, and any assistant using MCP.</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-status-open text-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                  <Check className="w-3.5 h-3.5" />
                </div>
                <span><strong>One Listing Instead of 20 Apps:</strong> No software to build or maintain. Customers don&apos;t install an app; they ask their existing AI.</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-status-open text-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                  <Check className="w-3.5 h-3.5" />
                </div>
                <span><strong>Direct WhatsApp &amp; Phone Contact:</strong> The AI hands the customer directly to your WhatsApp with a pre-filled enquiry. Zero take rate.</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-status-open text-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                  <Check className="w-3.5 h-3.5" />
                </div>
                <span><strong>Owner-Controlled Ground Truth:</strong> Toggle your shutter up or down in 1 click. AI only recommends you when you are genuinely open.</span>
              </li>
            </ul>
          </Card>
        </div>
      </div>

      {/* 3. Signature Showcase: "What AI Sees" Live Example */}
      <div id="what-ai-sees" className="max-w-5xl mx-auto space-y-8 pt-4">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-stone-100 text-stone-700 font-mono text-xs">
            <Bot className="w-3.5 h-3.5 text-marina-600" />
            <span>Show What AI Sees</span>
          </div>
          <h2 className="font-display text-3xl text-stone-900">
            How an AI Assistant Discovers Your Store
          </h2>
          <p className="text-sm text-stone-600 font-sans">
            Here is a live simulation of a real customer prompting Claude or ChatGPT, and how Shopfront supplies authoritative truth.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-paper-lg grid grid-cols-1 lg:grid-cols-12">
          {/* Customer & AI Conversation Panel */}
          <div className="lg:col-span-7 p-6 sm:p-8 space-y-6 flex flex-col justify-between">
            <div className="space-y-4">
              <span className="text-[11px] font-mono uppercase tracking-wider text-stone-400 block">
                Conversational Journey (Claude / ChatGPT / Cursor)
              </span>

              {/* User Prompt */}
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-stone-200 flex items-center justify-center text-stone-700 text-xs font-bold shrink-0">
                  U
                </div>
                <div className="p-3.5 rounded-2xl bg-stone-100 text-stone-900 text-xs font-sans leading-relaxed">
                  &ldquo;I need an iPhone battery replacement in Adyar right now under ₹2,000. Who is open?&rdquo;
                </div>
              </div>

              {/* AI Assistant Output */}
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-marina-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                  AI
                </div>
                <div className="p-4 rounded-2xl bg-marina-50/80 border border-marina-200 text-stone-900 text-xs font-sans space-y-3 leading-relaxed">
                  <p>
                    I found <strong>A1 Electronics &amp; Mobile Repairs</strong> in Adyar (450m away). They are <strong>open right now</strong> (verified 9 minutes ago, closing at 9:00 PM).
                  </p>
                  <div className="p-2.5 rounded-lg bg-white border border-marina-200 font-mono text-[11px] space-y-1">
                    <div className="flex justify-between">
                      <span className="font-semibold text-stone-800">iPhone Battery Replacement</span>
                      <span className="text-marina-700 font-bold">₹1,800</span>
                    </div>
                    <p className="text-stone-500 text-[10px]">OEM-grade cell • 6-Month warranty • 40 min install</p>
                  </div>
                  <div className="pt-1">
                    <a
                      href="https://wa.me/919840012345?text=Hi%20A1%20Electronics%2C%20I%20saw%20your%20iPhone%20Battery%20Replacement%20for%20%E2%82%B91%2C800%20via%20AI.%20Are%20you%20available%20now%3F"
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-status-open hover:bg-[#156e3b] text-white text-xs font-medium transition-colors shadow-sm"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>Message Owner on WhatsApp (0% Fee)</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-stone-500 font-mono pt-4 border-t border-stone-100">
              ⚡ Delivered in 22ms via PostGIS spatial SQL &amp; Model Context Protocol.
            </p>
          </div>

          {/* Raw Structured MCP JSON Tool Response */}
          <div className="lg:col-span-5 bg-[#100F0D] p-6 text-stone-200 flex flex-col justify-between font-mono text-[11px] border-t lg:border-t-0 lg:border-l border-stone-800">
            <div className="space-y-2">
              <div className="flex items-center justify-between pb-3 border-b border-stone-800 text-stone-400">
                <span className="text-[10px] uppercase tracking-wider text-turmeric-400">Tool: find_shops</span>
                <span className="text-[10px] text-stone-500">JSON-RPC 2.0</span>
              </div>
              <pre className="text-emerald-400 overflow-x-auto p-2 bg-black/40 rounded-lg leading-relaxed text-[10.5px]">
{`{
  "shop_id": "a1-electronics-adyar",
  "name": "A1 Electronics & Repairs",
  "status": "live",
  "is_open_now": true,
  "distance_meters": 450,
  "locality": "Adyar",
  "verified_at": "2026-10-18T12:41:00Z",
  "matching_item": {
    "name": "iPhone Battery Replacement",
    "price_inr": 1800,
    "available": true
  },
  "action_link": "https://wa.me/919840012345?text=..."
}`}
              </pre>
            </div>
            <div className="pt-4 text-stone-400 text-[10px] flex items-center gap-2 border-t border-stone-800/80">
              <ShieldCheck className="w-3.5 h-3.5 text-turmeric-400" />
              <span>Zero hallucinations. 100% verified ground truth.</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Deep Customization: "You Decide What AI Says About You" */}
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-stone-100 text-stone-700 font-mono text-xs">
            <Sliders className="w-3.5 h-3.5 text-marina-600" />
            <span>Deep Customization</span>
          </div>
          <h2 className="font-display text-3xl text-stone-900">
            You Decide What AI Says About You
          </h2>
          <p className="text-sm text-stone-600 font-sans">
            You maintain full sovereignty over your store data. Configure exactly what Claude, Cursor, and AI agents know:
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <Card className="p-5 bg-white border-stone-200 shadow-paper space-y-2.5">
            <div className="w-9 h-9 rounded-xl bg-marina-50 text-marina-700 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
            <h4 className="font-semibold text-sm text-stone-900">Hours &amp; Split Shifts</h4>
            <p className="text-xs text-stone-600 leading-relaxed">
              Define afternoon lunch breaks, Friday prayer times, and planned holiday closures. AI never sends customers to a closed shutter.
            </p>
          </Card>

          <Card className="p-5 bg-white border-stone-200 shadow-paper space-y-2.5">
            <div className="w-9 h-9 rounded-xl bg-turmeric-50 text-turmeric-700 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
            <h4 className="font-semibold text-sm text-stone-900">Exact Rupee Rates</h4>
            <p className="text-xs text-stone-600 leading-relaxed">
              List fixed prices or clear price ranges for all your services. Eliminate haggling and qualify high-intent customers upfront.
            </p>
          </Card>

          <Card className="p-5 bg-white border-stone-200 shadow-paper space-y-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h4 className="font-semibold text-sm text-stone-900">1-Thumb Availability</h4>
            <p className="text-xs text-stone-600 leading-relaxed">
              Ran out of parts or fully booked today? Toggle items unavailable from your phone. AI immediately reflects your real-time capacity.
            </p>
          </Card>

          <Card className="p-5 bg-white border-stone-200 shadow-paper space-y-2.5">
            <div className="w-9 h-9 rounded-xl bg-stone-100 text-stone-700 flex items-center justify-center">
              <Store className="w-4 h-4" />
            </div>
            <h4 className="font-semibold text-sm text-stone-900">Your Craftsmanship Story</h4>
            <p className="text-xs text-stone-600 leading-relaxed">
              Tell AI about your 20 years of experience, specialized certifications, and brand ethos so it champions your business authentically.
            </p>
          </Card>

          <Card className="p-5 bg-white border-stone-200 shadow-paper space-y-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
              <MessageCircle className="w-4 h-4" />
            </div>
            <h4 className="font-semibold text-sm text-stone-900">Custom WhatsApp Template</h4>
            <p className="text-xs text-stone-600 leading-relaxed">
              Craft the exact pre-filled opening message customers send when they tap your WhatsApp link, including item name and timestamp.
            </p>
          </Card>

          <Card className="p-5 bg-white border-stone-200 shadow-paper space-y-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
              <Languages className="w-4 h-4" />
            </div>
            <h4 className="font-semibold text-sm text-stone-900">Bilingual Tamil &amp; English</h4>
            <p className="text-xs text-stone-600 leading-relaxed">
              Set local Tamil keywords and descriptions so AI agents seamlessly match Tamil prompts (ஷாப்ஃபிரண்ட்) as effortlessly as English.
            </p>
          </Card>
        </div>
      </div>

      {/* 5. The Application Form */}
      <div id="apply" className="max-w-3xl mx-auto space-y-6 pt-8 border-t border-stone-200">
        <div className="text-center space-y-2">
          <h2 className="font-display text-3xl text-stone-900 tracking-tight">
            Apply to Join the Chennai Pilot (100% Free)
          </h2>
          <p className="text-xs text-stone-600 max-w-md mx-auto">
            Takes under 2 minutes. We review and activate verified listings within 24 hours. No credit card required.
          </p>
        </div>

        <MerchantApplyForm localities={sortedLocalities} />
      </div>

      {/* 6. Merchant FAQ */}
      <div id="faq" className="max-w-3xl mx-auto space-y-6 pt-8 border-t border-stone-200">
        <div className="text-center space-y-1">
          <h2 className="font-display text-2xl text-stone-900">
            Frequently Asked Questions
          </h2>
          <p className="text-xs text-stone-500 font-mono">
            Everything you need to know about listing your business on Shopfront.
          </p>
        </div>

        <div className="space-y-4">
          <Card className="p-5 bg-white border-stone-200 shadow-paper">
            <h3 className="text-sm font-bold text-stone-900 mb-1">
              Why not just build an app for my store?
            </h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              Building a custom mobile app costs ₹1,50,000+ upfront and ongoing maintenance fees. Worse, consumers already suffer from app fatigue and immediately delete single-use franchise apps. With Shopfront, you get one listing that works across every AI assistant without asking customers to install anything.
            </p>
          </Card>

          <Card className="p-5 bg-white border-stone-200 shadow-paper">
            <h3 className="text-sm font-bold text-stone-900 mb-1">
              Is Shopfront really 100% free with zero commission?
            </h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              Yes. The Chennai pilot is 100% free with 0% take rate. Customers chat with you directly on WhatsApp or telephone and pay you directly via cash or UPI. We do not intermediate payments.
            </p>
          </Card>

          <Card className="p-5 bg-white border-stone-200 shadow-paper">
            <h3 className="text-sm font-bold text-stone-900 mb-1">
              Can I pause my listing when I take a holiday or lunch break?
            </h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              Yes. You get full access to the Owner Portal. Lower your shutter with 1 tap, and every AI assistant will immediately stop recommending your store until you lift it back up.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
