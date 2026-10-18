import React from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  MapPin,
  Clock,
  Phone,
  MessageCircle,
  ArrowLeft,
  Calendar,
  ExternalLink,
} from 'lucide-react';
import { executeGetShopInfo } from '@/mcp/tools/get-shop-info';
import { executeGetCatalog } from '@/mcp/tools/get-catalog';
import { executeGetActionLink } from '@/mcp/tools/get-action-link';
import { writeSearchLog } from '@/search/telemetry';
import { StatusChip } from '@/components/brand/StatusChip';
import { VerifiedBadge } from '@/components/brand/VerifiedBadge';

export const dynamic = 'force-dynamic';

interface ShopPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata(props: ShopPageProps): Promise<Metadata> {
  const { slug } = await props.params;
  const shopRes = await executeGetShopInfo({ shop_slug: slug });
  if (!shopRes.success) {
    return {
      title: 'Shop Not Found — Shopfront Chennai',
    };
  }
  const shop = shopRes.data;
  return {
    title: `${shop.name} — ${shop.locality}, Chennai | Shopfront`,
    description: shop.description,
    openGraph: {
      title: `${shop.name} | Verified Local Business in ${shop.locality}, Chennai`,
      description: shop.description,
      type: 'website',
      locale: 'en_IN',
    },
  };
}

export default async function ShopPage(props: ShopPageProps) {
  const { slug } = await props.params;

  if (!slug) {
    notFound();
  }

  const startMs = Date.now();

  // 1. Fetch shop profile & hours
  const shopRes = await executeGetShopInfo({ shop_slug: slug });
  if (!shopRes.success) {
    notFound();
  }
  const shop = shopRes.data;

  // 2. Fetch catalog items
  const catalogRes = await executeGetCatalog({ shop_slug: slug });
  if (!catalogRes.success) {
    notFound();
  }
  const catalog = catalogRes.data;

  // 3. Fetch action link
  const linkRes = await executeGetActionLink({ shop_slug: slug });
  const actionLink = linkRes.success ? linkRes.data : null;

  // Log telemetry for action link generation
  await writeSearchLog({
    channel: 'web',
    tool: 'get_action_link',
    query_text: null,
    total_ms: Date.now() - startMs,
  });

  const categoryLabels: Record<string, string> = {
    repair_service: 'Repair & Technical',
    salon_wellness: 'Salons & Wellness',
    food_beverage: 'Food & Cafes',
  };

  const menuUpdatedDate = catalog.menu_updated_at || shop.menu_updated_at;
  const formattedMenuUpdated = menuUpdatedDate
    ? new Date(menuUpdatedDate).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : null;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: shop.name,
    description: shop.description,
    address: {
      '@type': 'PostalAddress',
      streetAddress: shop.address,
      addressLocality: shop.locality,
      addressRegion: 'Tamil Nadu',
      addressCountry: 'IN',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: shop.lat,
      longitude: shop.lng,
    },
    telephone: shop.contact.phone,
  };

  return (
    <div className="min-h-screen bg-stone-25 py-8 px-4 sm:px-6 lg:px-8 font-sans text-stone-900">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Navigation Breadcrumb */}
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-mono text-stone-500 hover:text-stone-900 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Chennai Directory</span>
          </Link>
        </div>

        {/* Shop Header Card */}
        <div className="bg-white border border-stone-200 rounded-2xl p-6 sm:p-8 shadow-paper space-y-6">
          {/* Top meta strip */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-wider font-semibold px-2 py-0.5 rounded bg-stone-100 text-stone-600 border border-stone-200">
                {categoryLabels[shop.category] ?? shop.category}
              </span>
              <VerifiedBadge verifiedText="verified merchant" />
            </div>

            {shop.hours_status === 'set' && (
              <StatusChip status={shop.open_now ? 'open' : 'closed'} />
            )}
          </div>

          {/* Shop Title & Description */}
          <div className="space-y-2">
            <h1 className="font-display text-3xl sm:text-4xl font-normal text-stone-900 tracking-[-0.02em]">
              {shop.name}
            </h1>
            <p className="text-sm text-stone-600 leading-relaxed font-sans max-w-2xl">
              {shop.description}
            </p>
          </div>

          {/* Address & Locality */}
          <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 flex items-start gap-3 text-xs text-stone-700 font-sans">
            <MapPin className="w-4 h-4 text-stone-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-stone-900">{shop.address}</span>
              <span className="text-stone-500 font-mono ml-2">({shop.locality}, Chennai)</span>
            </div>
          </div>

          {/* Contact Action Bar (WhatsApp / Call) */}
          {actionLink && (
            <div id="contact" className="pt-6 border-t border-stone-100 space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <a
                  href={actionLink.action_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold bg-status-open hover:bg-[#156e3b] text-white transition-colors shadow-paper"
                >
                  {actionLink.action_mode === 'whatsapp' && (
                    <>
                      <MessageCircle className="w-4 h-4" />
                      <span>Chat on WhatsApp</span>
                    </>
                  )}
                  {actionLink.action_mode === 'external_url' && (
                    <>
                      <ExternalLink className="w-4 h-4" />
                      <span>Book Online</span>
                    </>
                  )}
                  {actionLink.action_mode === 'phone_only' && (
                    <>
                      <Phone className="w-4 h-4" />
                      <span>Call {actionLink.phone}</span>
                    </>
                  )}
                </a>

                {actionLink.phone && actionLink.action_mode !== 'phone_only' && (
                  <a
                    href={`tel:${actionLink.phone}`}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-medium border border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-700 transition-colors shadow-paper"
                  >
                    <Phone className="w-3.5 h-3.5 text-stone-400" />
                    <span className="font-mono">{actionLink.phone}</span>
                  </a>
                )}
              </div>

              {actionLink.action_instructions && (
                <p className="text-xs text-stone-500 italic font-sans">
                  {actionLink.action_instructions}
                </p>
              )}

              {/* Statutory Disclaimer */}
              <p className="text-[11px] text-stone-400 font-sans leading-relaxed">
                {actionLink.disclaimer}
              </p>
            </div>
          )}
        </div>

        {/* Operating Hours & Closures Section */}
        <div className="bg-white border border-stone-200 rounded-2xl p-6 sm:p-8 shadow-paper space-y-6">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-marina-600" />
            <h2 className="font-display text-xl font-normal text-stone-900">
              Operating Hours (Asia/Kolkata IST)
            </h2>
          </div>

          {shop.hours_status === 'unknown' ? (
            <p className="text-xs text-stone-500 italic font-sans">
              Hours not provided by the business.
            </p>
          ) : (
            <div className="space-y-4">
              {/* Today's Hours Banner */}
              <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 flex items-center justify-between text-xs">
                <span className="font-mono text-stone-500 uppercase tracking-wider">
                  Today&apos;s Schedule:
                </span>
                <span className="font-mono font-bold text-stone-900">
                  {shop.today_hours ?? 'Closed'}
                </span>
              </div>

              {/* Weekly Schedule Grid */}
              {shop.weekly_hours && shop.weekly_hours.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
                  {shop.weekly_hours.map(([day, hours], i) => (
                    <div
                      key={i}
                      className="p-3 rounded-xl border border-stone-200 bg-white flex flex-col justify-between gap-1 shadow-paper"
                    >
                      <span className="text-[10px] font-mono text-stone-400 uppercase">
                        {day}
                      </span>
                      <span className="text-xs font-mono font-semibold text-stone-900 truncate">
                        {hours}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Upcoming Closures */}
          <div className="pt-4 border-t border-stone-100 space-y-2">
            <h3 className="text-xs font-mono uppercase tracking-wider text-stone-600 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-stone-400" />
              <span>Upcoming Scheduled Closures (Next 30 Days)</span>
            </h3>
            {shop.upcoming_closures && shop.upcoming_closures.length > 0 ? (
              <ul className="space-y-1.5 text-xs text-status-closed font-mono">
                {shop.upcoming_closures.map((closure, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-status-closed" />
                    <strong>{closure.date}</strong>
                    <span>{closure.reason ? `: ${closure.reason}` : ' (Closed)'}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-stone-400 font-sans">
                No scheduled closures in the next 30 days.
              </p>
            )}
          </div>
        </div>

        {/* Menu & Catalog Section (Receipt Ledger Style) */}
        <div className="bg-white border border-stone-200 rounded-2xl p-6 sm:p-8 shadow-paper space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 pb-4 border-b border-stone-100">
            <h2 className="font-display text-2xl font-normal text-stone-900">
              Catalog & Service Offerings
            </h2>
            {formattedMenuUpdated && (
              <span className="text-xs font-mono text-stone-500">
                Menu verified on {formattedMenuUpdated}
              </span>
            )}
          </div>

          {catalog.groups.length === 0 ? (
            <p className="text-xs text-stone-500 italic font-sans">
              No available offerings listed at this time.
            </p>
          ) : (
            <div className="space-y-8">
              {catalog.groups.map((group, groupIdx) => (
                <div key={groupIdx} className="space-y-3">
                  <h3 className="font-mono text-xs uppercase tracking-wider font-bold text-stone-700 pb-1 border-b border-stone-200">
                    {group.group_name}
                  </h3>

                  <div className="space-y-3">
                    {group.items.map((item) => (
                      <div
                        key={item.id}
                        className="p-3.5 rounded-xl border border-stone-200 bg-stone-50/60 hover:bg-stone-50 hover:border-marina-200 transition-colors shadow-paper space-y-1.5"
                      >
                        <div className="flex items-baseline justify-between gap-2">
                          <span className="font-semibold text-sm text-stone-900">
                            {item.name}
                          </span>
                          <span className="flex-1 mx-3 dot-leader h-3 opacity-40 hidden sm:block" />
                          <span className="font-mono text-sm font-bold text-marina-700 whitespace-nowrap">
                            {item.price_display}
                          </span>
                        </div>

                        {item.description && (
                          <p className="text-xs text-stone-600 font-sans leading-relaxed">
                            {item.description}
                          </p>
                        )}

                        {/* Metadata tags & duration */}
                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          {item.duration_min && (
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white text-stone-600 border border-stone-200">
                              ⏱ {item.duration_min} mins
                            </span>
                          )}
                          {item.tags &&
                            item.tags.map((tag, tagIdx) => (
                              <span
                                key={tagIdx}
                                className="text-[10px] font-mono px-2 py-0.5 rounded bg-white text-stone-500 border border-stone-200"
                              >
                                #{tag}
                              </span>
                            ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
