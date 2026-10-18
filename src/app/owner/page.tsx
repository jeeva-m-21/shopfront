import React from 'react';
import Link from 'next/link';
import {
  UtensilsCrossed,
  Clock,
  Store,
  Settings,
  AlertTriangle,
  Info,
  CheckCircle2,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { requireOwner } from '../../auth/guards.js';
import { getOwnerDashboard } from '../../owner/shop-ops.js';
import { StatusChip } from '../../components/brand/StatusChip';
import { ShutterMark } from '../../components/brand/ShutterMark';

export default async function OwnerDashboardPage() {
  const { user } = await requireOwner('/owner');
  const dashboard = await getOwnerDashboard(user.id);

  if (!dashboard) {
    return (
      <div className="py-8">
        <div className="bg-white rounded-2xl border border-stone-200 p-8 text-center max-w-md mx-auto shadow-paper">
          <Store className="w-10 h-10 text-stone-300 mx-auto mb-3" />
          <h1 className="font-display text-xl text-stone-900 mb-1">Owner Dashboard</h1>
          <p className="text-xs text-stone-500 font-sans">
            No shop is assigned to your account yet. Contact the platform administrator.
          </p>
        </div>
      </div>
    );
  }

  const { shop, available_items_count, total_items_count, menu_updated_text, banners } = dashboard;

  const isLive = shop.status === 'live';
  const isPaused = shop.status === 'paused';

  return (
    <div className="space-y-6">
      {/* Top Banner Alerts */}
      {banners.showUnknownHoursBanner && (
        <div
          role="status"
          className="p-4 rounded-xl border border-blue-200 bg-blue-50/80 text-blue-900 flex items-center justify-between gap-4 text-xs font-sans"
        >
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-blue-600 shrink-0" />
            <span>Add opening hours so customers and AI agents know when you are open.</span>
          </div>
          <Link
            href="/owner/hours"
            className="font-medium underline text-blue-700 hover:text-blue-900 shrink-0 font-mono"
          >
            Set Hours →
          </Link>
        </div>
      )}

      {banners.showDraftBanner && (
        <div
          role="status"
          className="p-4 rounded-xl border border-turmeric-300 bg-turmeric-50 text-turmeric-900 flex items-center gap-2.5 text-xs font-sans"
        >
          <AlertTriangle className="w-4 h-4 text-turmeric-700 shrink-0" />
          <span>Your listing is in <strong>Draft</strong> mode. Contact admin to publish it live.</span>
        </div>
      )}

      {banners.showAdminLockedBanner && (
        <div
          role="alert"
          className="p-4 rounded-xl border border-red-200 bg-red-50 text-red-900 flex items-center gap-2.5 text-xs font-sans"
        >
          <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
          <span>Paused by administrator. Please contact support to resume your listing.</span>
        </div>
      )}

      {/* Giant Tactile Shutter Status Card */}
      <div className="bg-white border border-stone-200 rounded-2xl p-6 sm:p-8 shadow-paper space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-stone-100">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <h1 className="font-display text-2xl sm:text-3xl font-normal text-stone-900">
                {shop.name}
              </h1>
              <StatusChip status={shop.status as 'open' | 'closed' | 'draft' | 'paused' | 'live'} />
            </div>
            <p className="text-xs text-stone-500 font-mono">
              {shop.locality_name} · {shop.address}
            </p>
          </div>

          <Link
            href={`/shop/${shop.slug}`}
            target="_blank"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-700 self-start sm:self-auto transition-colors"
          >
            <span>View Public Listing</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Shutter Visual Metaphor & Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Shutter Status */}
          <div className="p-4 rounded-xl border border-stone-200 bg-stone-50 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white border border-stone-200 flex items-center justify-center shadow-paper shrink-0">
              <ShutterMark size={22} dark={isPaused} />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-stone-500 block">
                Store Shutter
              </span>
              <span className={`text-sm font-semibold ${isLive ? 'text-status-open' : 'text-stone-700'}`}>
                {isLive ? 'Shutter is UP (Live)' : isPaused ? 'Shutter is DOWN (Paused)' : 'Draft State'}
              </span>
            </div>
          </div>

          {/* Menu Freshness */}
          <div className="p-4 rounded-xl border border-stone-200 bg-stone-50 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white border border-stone-200 flex items-center justify-center shadow-paper shrink-0 text-marina-600">
              <Sparkles className="w-5 h-5 text-turmeric-500" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-stone-500 block">
                Catalog Freshness
              </span>
              <span className="text-xs font-mono font-medium text-stone-800">
                {menu_updated_text}
              </span>
            </div>
          </div>

          {/* Item Availability */}
          <div className="p-4 rounded-xl border border-stone-200 bg-stone-50 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white border border-stone-200 flex items-center justify-center shadow-paper shrink-0 text-marina-600">
              <CheckCircle2 className="w-5 h-5 text-status-open" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-stone-500 block">
                Active Catalog
              </span>
              <span className="text-xs font-mono font-semibold text-stone-900">
                {available_items_count} / {total_items_count} items available
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          href="/owner/menu"
          className="p-5 rounded-2xl border border-stone-200 bg-white hover:border-marina-300 hover:shadow-paper-md transition-all group shadow-paper space-y-2"
        >
          <div className="w-9 h-9 rounded-xl bg-stone-100 group-hover:bg-marina-50 flex items-center justify-center text-stone-700 group-hover:text-marina-600 transition-colors">
            <UtensilsCrossed className="w-4 h-4" />
          </div>
          <h3 className="font-semibold text-sm text-stone-900 group-hover:text-marina-700">
            Catalog & Items
          </h3>
          <p className="text-xs text-stone-500 font-sans leading-relaxed">
            Manage services or items, pricing, tags, and 1-thumb availability switches.
          </p>
        </Link>

        <Link
          href="/owner/hours"
          className="p-5 rounded-2xl border border-stone-200 bg-white hover:border-marina-300 hover:shadow-paper-md transition-all group shadow-paper space-y-2"
        >
          <div className="w-9 h-9 rounded-xl bg-stone-100 group-hover:bg-marina-50 flex items-center justify-center text-stone-700 group-hover:text-marina-600 transition-colors">
            <Clock className="w-4 h-4" />
          </div>
          <h3 className="font-semibold text-sm text-stone-900 group-hover:text-marina-700">
            Opening Hours
          </h3>
          <p className="text-xs text-stone-500 font-sans leading-relaxed">
            Configure weekly business schedules and planned holiday closures.
          </p>
        </Link>

        <Link
          href="/owner/shop"
          className="p-5 rounded-2xl border border-stone-200 bg-white hover:border-marina-300 hover:shadow-paper-md transition-all group shadow-paper space-y-2"
        >
          <div className="w-9 h-9 rounded-xl bg-stone-100 group-hover:bg-marina-50 flex items-center justify-center text-stone-700 group-hover:text-marina-600 transition-colors">
            <Store className="w-4 h-4" />
          </div>
          <h3 className="font-semibold text-sm text-stone-900 group-hover:text-marina-700">
            Shop Profile
          </h3>
          <p className="text-xs text-stone-500 font-sans leading-relaxed">
            Update phone, address, coordinates, and direct WhatsApp enquiry links.
          </p>
        </Link>

        <Link
          href="/owner/account"
          className="p-5 rounded-2xl border border-stone-200 bg-white hover:border-marina-300 hover:shadow-paper-md transition-all group shadow-paper space-y-2"
        >
          <div className="w-9 h-9 rounded-xl bg-stone-100 group-hover:bg-marina-50 flex items-center justify-center text-stone-700 group-hover:text-marina-600 transition-colors">
            <Settings className="w-4 h-4" />
          </div>
          <h3 className="font-semibold text-sm text-stone-900 group-hover:text-marina-700">
            Account & Status
          </h3>
          <p className="text-xs text-stone-500 font-sans leading-relaxed">
            Update password, manage security, or pause/resume your shop listing.
          </p>
        </Link>
      </div>
    </div>
  );
}
