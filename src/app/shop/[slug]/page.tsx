import React from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { executeGetShopInfo } from '@/mcp/tools/get-shop-info';
import { executeGetCatalog } from '@/mcp/tools/get-catalog';
import { executeGetActionLink } from '@/mcp/tools/get-action-link';
import { writeSearchLog } from '@/search/telemetry';

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

  // Category labels
  const categoryLabels: Record<string, string> = {
    repair_service: 'Repair & Technical',
    salon_wellness: 'Salons & Personal Care',
    food_beverage: 'Food & Cafes',
  };

  // Open status label & colors
  let statusBadge = {
    text: 'Hours not provided',
    bg: '#f3f4f6',
    color: '#4b5563',
    border: '#e5e7eb',
  };

  if (shop.hours_status === 'set') {
    if (shop.open_now === true) {
      statusBadge = {
        text: 'Open now',
        bg: '#ecfdf5',
        color: '#065f46',
        border: '#a7f3d0',
      };
    } else if (shop.open_now === false) {
      statusBadge = {
        text: 'Closed now',
        bg: '#fef2f2',
        color: '#991b1b',
        border: '#fecaca',
      };
    }
  }

  // Format menu updated date
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
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', padding: '24px 16px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        
        {/* Navigation Breadcrumb */}
        <div style={{ marginBottom: '20px' }}>
          <Link
            href="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '14px',
              color: '#4b5563',
              textDecoration: 'none',
              fontWeight: '500',
            }}
          >
            &larr; Back to Chennai Search
          </Link>
        </div>

        {/* Shop Header Card */}
        <div
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e5e7eb',
            borderRadius: '12px',
            padding: '28px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            marginBottom: '24px',
          }}
        >
          {/* Badges strip */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
            <span
              style={{
                fontSize: '12px',
                fontWeight: '600',
                padding: '3px 10px',
                borderRadius: '9999px',
                backgroundColor: '#eff6ff',
                color: '#1e40af',
                border: '1px solid #bfdbfe',
              }}
            >
              {categoryLabels[shop.category] ?? shop.category}
            </span>

            <span
              style={{
                fontSize: '12px',
                fontWeight: '600',
                padding: '3px 10px',
                borderRadius: '9999px',
                backgroundColor: statusBadge.bg,
                color: statusBadge.color,
                border: `1px solid ${statusBadge.border}`,
              }}
            >
              {statusBadge.text}
            </span>

            {shop.is_sample_data && (
              <span
                style={{
                  fontSize: '12px',
                  fontWeight: '600',
                  padding: '3px 10px',
                  borderRadius: '9999px',
                  backgroundColor: '#fffbeb',
                  color: '#92400e',
                  border: '1px solid #fde68a',
                }}
              >
                Sample listing
              </span>
            )}
          </div>

          {/* Shop Title & Description */}
          <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#111827', margin: '0 0 10px 0' }}>
            {shop.name}
          </h1>

          <p style={{ fontSize: '15px', color: '#4b5563', lineHeight: '1.5', margin: '0 0 18px 0' }}>
            {shop.description}
          </p>

          {/* Address & Locality */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '14px', color: '#374151', marginBottom: '16px' }}>
            <span style={{ fontWeight: '600' }}>Address:</span>
            <span>{shop.address} ({shop.locality})</span>
          </div>

          {/* Action Link Contact Button */}
          {actionLink && (
            <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid #f3f4f6' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <a
                  href={actionLink.action_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '12px 24px',
                    borderRadius: '8px',
                    backgroundColor: '#2563eb',
                    color: '#ffffff',
                    fontSize: '15px',
                    fontWeight: '600',
                    textDecoration: 'none',
                    cursor: 'pointer',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                  }}
                >
                  {actionLink.action_mode === 'whatsapp' && 'Chat on WhatsApp'}
                  {actionLink.action_mode === 'external_url' && 'Book Online'}
                  {actionLink.action_mode === 'phone_only' && `Call ${actionLink.phone}`}
                </a>

                {actionLink.phone && actionLink.action_mode !== 'phone_only' && (
                  <a
                    href={`tel:${actionLink.phone}`}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      padding: '12px 18px',
                      borderRadius: '8px',
                      backgroundColor: '#f3f4f6',
                      color: '#374151',
                      fontSize: '14px',
                      fontWeight: '500',
                      textDecoration: 'none',
                    }}
                  >
                    Call: {actionLink.phone}
                  </a>
                )}
              </div>

              {actionLink.action_instructions && (
                <p style={{ fontSize: '13px', color: '#4b5563', marginTop: '10px', fontStyle: 'italic' }}>
                  {actionLink.action_instructions}
                </p>
              )}

              {/* Disclaimer */}
              <p style={{ fontSize: '13px', color: '#6b7280', marginTop: '10px', lineHeight: '1.4' }}>
                {actionLink.disclaimer}
              </p>
            </div>
          )}
        </div>

        {/* Operating Hours & Closures Section */}
        <div
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e5e7eb',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            marginBottom: '24px',
          }}
        >
          <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#111827', margin: '0 0 16px 0' }}>
            Operating Hours
          </h2>

          {shop.hours_status === 'unknown' ? (
            <p style={{ fontSize: '14px', color: '#6b7280', fontStyle: 'italic' }}>
              Hours not provided by the business.
            </p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
              {/* Today's Hours */}
              <div style={{ padding: '12px', backgroundColor: '#f9fafb', borderRadius: '8px', border: '1px solid #f3f4f6' }}>
                <span style={{ fontSize: '13px', fontWeight: '600', color: '#4b5563' }}>Today: </span>
                <span style={{ fontSize: '14px', fontWeight: '700', color: '#111827' }}>
                  {shop.today_hours ?? 'Closed'}
                </span>
              </div>

              {/* Weekly Schedule */}
              {shop.weekly_hours && shop.weekly_hours.length > 0 && (
                <div style={{ gridColumn: '1 / -1' }}>
                  <span style={{ fontSize: '13px', fontWeight: '600', color: '#4b5563', display: 'block', marginBottom: '8px' }}>
                    Weekly Schedule:
                  </span>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '8px' }}>
                    {shop.weekly_hours.map(([day, hours], i) => (
                      <div
                        key={i}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          padding: '6px 10px',
                          borderRadius: '6px',
                          backgroundColor: '#f9fafb',
                          fontSize: '13px',
                        }}
                      >
                        <span style={{ color: '#4b5563', fontWeight: '500' }}>{day}:</span>
                        <span style={{ color: '#111827', fontWeight: '600' }}>{hours}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Upcoming Closures (Next 30 Days) */}
          <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #f3f4f6' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#374151', margin: '0 0 8px 0' }}>
              Upcoming Scheduled Closures (Next 30 Days)
            </h3>
            {shop.upcoming_closures && shop.upcoming_closures.length > 0 ? (
              <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: '#dc2626' }}>
                {shop.upcoming_closures.map((closure, idx) => (
                  <li key={idx} style={{ marginBottom: '4px' }}>
                    <strong>{closure.date}</strong>
                    {closure.reason ? `: ${closure.reason}` : ' (Closed)'}
                  </li>
                ))}
              </ul>
            ) : (
              <p style={{ margin: 0, fontSize: '13px', color: '#6b7280' }}>
                No scheduled closures in the next 30 days.
              </p>
            )}
          </div>
        </div>

        {/* Menu & Catalog Section */}
        <div
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e5e7eb',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: '8px', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#111827', margin: 0 }}>
              Catalog & Offerings
            </h2>
            {formattedMenuUpdated && (
              <span style={{ fontSize: '12px', color: '#6b7280' }}>
                Menu updated on {formattedMenuUpdated}
              </span>
            )}
          </div>

          {catalog.groups.length === 0 ? (
            <p style={{ fontSize: '14px', color: '#6b7280', fontStyle: 'italic' }}>
              No available offerings listed at this time.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {catalog.groups.map((group, groupIdx) => (
                <div key={groupIdx}>
                  <h3
                    style={{
                      fontSize: '15px',
                      fontWeight: '700',
                      color: '#1f2937',
                      margin: '0 0 12px 0',
                      paddingBottom: '6px',
                      borderBottom: '1px solid #f3f4f6',
                    }}
                  >
                    {group.group_name}
                  </h3>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
                    {group.items.map((item) => (
                      <div
                        key={item.id}
                        style={{
                          backgroundColor: '#f9fafb',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          padding: '12px 14px',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          gap: '8px',
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                            <span style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>
                              {item.name}
                            </span>
                            <span style={{ fontSize: '14px', fontWeight: '700', color: '#059669', whiteSpace: 'nowrap' }}>
                              {item.price_display}
                            </span>
                          </div>

                          {item.description && (
                            <p style={{ fontSize: '12px', color: '#6b7280', margin: '4px 0 0 0', lineHeight: '1.4' }}>
                              {item.description}
                            </p>
                          )}
                        </div>

                        {/* Metadata tags */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', fontSize: '11px' }}>
                          {item.diet && (
                            <span
                              style={{
                                padding: '2px 6px',
                                borderRadius: '4px',
                                backgroundColor: item.diet === 'veg' ? '#ecfdf5' : '#fef2f2',
                                color: item.diet === 'veg' ? '#065f46' : '#991b1b',
                                fontWeight: '600',
                                textTransform: 'capitalize',
                              }}
                            >
                              {item.diet.replace('_', ' ')}
                            </span>
                          )}

                          {item.duration_min && (
                            <span style={{ color: '#6b7280' }}>
                              ⏱ {item.duration_min} mins
                            </span>
                          )}

                          {item.tags && item.tags.length > 0 && (
                            item.tags.map((tag, tIdx) => (
                              <span
                                key={tIdx}
                                style={{
                                  backgroundColor: '#e5e7eb',
                                  color: '#374151',
                                  padding: '2px 6px',
                                  borderRadius: '4px',
                                }}
                              >
                                #{tag}
                              </span>
                            ))
                          )}
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
