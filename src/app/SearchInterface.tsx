'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import type { SearchShopResult } from '@/search/search-shops';
import type { RelaxationHint } from '@/search/stage1';

export interface SearchInterfaceProps {
  initialLocalities: Array<{ id: number; name: string }>;
  initialQuery?: string;
  initialLocality?: string;
  initialCategory?: string;
  initialMaxPrice?: number;
  initialOpenNow?: boolean;
  initialShops: SearchShopResult[];
  initialLocationWarning: string | null;
  initialLocationResolved: { name: string; radius_km: number } | null;
  initialRelaxationHints: RelaxationHint[];
  initialReranked: boolean;
}

export function SearchInterface({
  initialLocalities,
  initialQuery = '',
  initialLocality = '',
  initialCategory = '',
  initialMaxPrice,
  initialOpenNow = false,
  initialShops,
  initialLocationWarning,
  initialLocationResolved,
  initialRelaxationHints,
  initialReranked,
}: SearchInterfaceProps) {
  const [query, setQuery] = useState(initialQuery);
  const [locality, setLocality] = useState(initialLocality);
  const [category, setCategory] = useState(initialCategory);
  const [maxPrice, setMaxPrice] = useState<string>(
    initialMaxPrice !== undefined ? String(initialMaxPrice) : ''
  );
  const [openNow, setOpenNow] = useState(initialOpenNow);

  const [shops, setShops] = useState<SearchShopResult[]>(initialShops);
  const [locationWarning, setLocationWarning] = useState<string | null>(initialLocationWarning);
  const [locationResolved, setLocationResolved] = useState<{
    name: string;
    radius_km: number;
  } | null>(initialLocationResolved);
  const [relaxationHints, setRelaxationHints] = useState<RelaxationHint[]>(initialRelaxationHints);
  const [reranked, setReranked] = useState(initialReranked);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [suggestedLocalities, setSuggestedLocalities] = useState<string[]>([]);

  const [isPending, startTransition] = useTransition();

  const executeSearch = async (overrideParams?: {
    query?: string;
    locality?: string;
    category?: string;
    maxPrice?: string;
    openNow?: boolean;
    radiusKm?: number;
  }) => {
    const q = overrideParams?.query !== undefined ? overrideParams.query : query;
    const loc = overrideParams?.locality !== undefined ? overrideParams.locality : locality;
    const cat = overrideParams?.category !== undefined ? overrideParams.category : category;
    const mp = overrideParams?.maxPrice !== undefined ? overrideParams.maxPrice : maxPrice;
    const on = overrideParams?.openNow !== undefined ? overrideParams.openNow : openNow;
    const rKm = overrideParams?.radiusKm;

    setErrorMessage(null);
    setSuggestedLocalities([]);

    startTransition(async () => {
      try {
        const params = new URLSearchParams();
        if (q.trim()) params.set('q', q.trim());
        if (loc) params.set('locality', loc);
        if (cat) params.set('category', cat);
        if (mp && !isNaN(Number(mp))) params.set('max_price_inr', mp);
        if (on) params.set('open_now', 'true');
        if (rKm) params.set('radius_km', String(rKm));

        // Update browser URL without full reload
        const newUrl = params.toString() ? `/?${params.toString()}` : '/';
        window.history.replaceState(null, '', newUrl);

        const res = await fetch(`/api/search?${params.toString()}`);
        const data = await res.json();

        if (!res.ok) {
          if (data.error?.code === 'location_required') {
            setErrorMessage(data.error.message);
            if (data.error.data?.localities) {
              setSuggestedLocalities(data.error.data.localities.slice(0, 8));
            }
          } else {
            setErrorMessage(data.error?.message || 'Search failed. Please try again.');
          }
          setShops([]);
          setLocationResolved(null);
          setLocationWarning(null);
          setRelaxationHints([]);
          return;
        }

        setShops(data.shops || []);
        setLocationResolved(data.location_resolved || null);
        setLocationWarning(data.location_warning || null);
        setRelaxationHints(data.relaxation_hints || []);
        setReranked(Boolean(data.reranked));
      } catch {
        setErrorMessage('Failed to connect to search service.');
      }
    });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeSearch();
  };

  const applyRelaxation = (hint: RelaxationHint) => {
    if (hint.constraint === 'radius') {
      executeSearch({ radiusKm: 25 });
    } else if (hint.constraint === 'max_price') {
      setMaxPrice('');
      executeSearch({ maxPrice: '' });
    } else if (hint.constraint === 'open_now') {
      setOpenNow(false);
      executeSearch({ openNow: false });
    } else if (hint.constraint === 'category') {
      setCategory('');
      executeSearch({ category: '' });
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#f9fafb', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Header */}
      <header style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #e5e7eb', padding: '16px 24px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Link href="/" style={{ textDecoration: 'none' }}>
              <span style={{ fontSize: '20px', fontWeight: '800', color: '#111827', letterSpacing: '-0.02em' }}>
                Shopfront
              </span>
              <span style={{ marginLeft: '8px', fontSize: '13px', fontWeight: '600', color: '#2563eb', backgroundColor: '#eff6ff', padding: '2px 8px', borderRadius: '12px' }}>
                Chennai
              </span>
            </Link>
          </div>
          <div>
            <Link href="/login" style={{ fontSize: '13px', color: '#4b5563', textDecoration: 'none', fontWeight: '500' }}>
              For shop owners &rarr;
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main style={{ flex: 1, maxWidth: '1100px', width: '100%', margin: '0 auto', padding: '32px 16px' }}>
        {/* Hero Section */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{ fontSize: '32px', fontWeight: '800', color: '#111827', marginBottom: '8px', letterSpacing: '-0.02em' }}>
            Find trusted neighbourhood shops in Chennai
          </h1>
          <p style={{ fontSize: '16px', color: '#4b5563', maxWidth: '640px', margin: '0 auto' }}>
            Direct menu items, verified working hours, and real contact links for repair services, salons, and food.
          </p>
        </div>

        {/* Search Controls Card */}
        <div style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.04)', marginBottom: '24px' }}>
          <form onSubmit={handleSearchSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '16px' }}>
              {/* Text Input */}
              <div style={{ gridColumn: 'span 2' }}>
                <label htmlFor="search-query" style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '4px' }}>
                  What are you looking for?
                </label>
                <input
                  id="search-query"
                  type="text"
                  maxLength={200}
                  placeholder="e.g. iPhone battery replacement, men haircut, vegan sourdough..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '6px',
                    border: '1px solid #d1d5db',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* Locality Dropdown */}
              <div>
                <label htmlFor="search-locality" style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '4px' }}>
                  Locality
                </label>
                <select
                  id="search-locality"
                  value={locality}
                  onChange={(e) => setLocality(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '6px',
                    border: '1px solid #d1d5db',
                    fontSize: '14px',
                    backgroundColor: '#ffffff',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                >
                  <option value="">Anywhere in Chennai</option>
                  {initialLocalities.map((loc) => (
                    <option key={loc.id} value={loc.name}>
                      {loc.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Category Dropdown */}
              <div>
                <label htmlFor="search-category" style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '4px' }}>
                  Category
                </label>
                <select
                  id="search-category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '6px',
                    border: '1px solid #d1d5db',
                    fontSize: '14px',
                    backgroundColor: '#ffffff',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                >
                  <option value="">All categories</option>
                  <option value="repair_service">Repair & Service</option>
                  <option value="salon_wellness">Salon & Wellness</option>
                  <option value="food_beverage">Food & Beverage</option>
                </select>
              </div>

              {/* Max Price */}
              <div>
                <label htmlFor="search-max-price" style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '4px' }}>
                  Max Price (₹)
                </label>
                <input
                  id="search-max-price"
                  type="number"
                  min="0"
                  placeholder="Optional limit"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '6px',
                    border: '1px solid #d1d5db',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            {/* Bottom Row: Open Now & Search Button */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px', borderTop: '1px solid #f3f4f6' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#374151', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={openNow}
                  onChange={(e) => setOpenNow(e.target.checked)}
                  style={{ width: '16px', height: '16px', accentColor: '#2563eb' }}
                />
                <span style={{ fontWeight: '500' }}>Open now</span>
              </label>

              <button
                type="submit"
                disabled={isPending}
                style={{
                  backgroundColor: '#2563eb',
                  color: '#ffffff',
                  padding: '10px 24px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: isPending ? 'not-allowed' : 'pointer',
                  opacity: isPending ? 0.7 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                {isPending ? 'Searching...' : 'Search'}
              </button>
            </div>
          </form>
        </div>

        {/* Location prompt / Error alerts */}
        {errorMessage && (
          <div role="alert" style={{ backgroundColor: '#fffbeb', border: '1px solid #fcd34d', borderRadius: '8px', padding: '16px', marginBottom: '20px' }}>
            <p style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: '600', color: '#92400e' }}>
              {errorMessage}
            </p>
            {suggestedLocalities.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', color: '#78350f', fontWeight: '500' }}>Suggested areas:</span>
                {suggestedLocalities.map((loc) => (
                  <button
                    key={loc}
                    type="button"
                    onClick={() => {
                      setLocality(loc);
                      executeSearch({ locality: loc });
                    }}
                    style={{
                      padding: '4px 10px',
                      backgroundColor: '#ffffff',
                      border: '1px solid #d97706',
                      borderRadius: '16px',
                      fontSize: '12px',
                      fontWeight: '500',
                      color: '#b45309',
                      cursor: 'pointer',
                    }}
                  >
                    {loc}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Location Warning Banner */}
        {locationWarning && !errorMessage && (
          <div style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '12px 16px', marginBottom: '20px', fontSize: '13px', color: '#1e40af' }}>
            {locationWarning}
          </div>
        )}

        {/* Results Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#111827', margin: 0 }}>
              {locationResolved
                ? `Shops near ${locationResolved.name}`
                : 'All Chennai Shops'}
            </h2>
            <span style={{ fontSize: '13px', color: '#6b7280' }}>
              {shops.length} {shops.length === 1 ? 'shop' : 'shops'} found
              {reranked && ' · Ranked by intelligent match'}
            </span>
          </div>
        </div>

        {/* Shop Results List */}
        {shops.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {shops.map((shop) => {
              const categoryLabel =
                shop.category === 'repair_service'
                  ? 'Repair & Service'
                  : shop.category === 'salon_wellness'
                  ? 'Salon & Wellness'
                  : 'Food & Beverage';

              return (
                <div
                  key={shop.slug}
                  style={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '10px',
                    padding: '20px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                    transition: 'box-shadow 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
                    <div>
                      <Link
                        href={`/shop/${shop.slug}`}
                        style={{ fontSize: '18px', fontWeight: '700', color: '#111827', textDecoration: 'none' }}
                      >
                        {shop.name}
                      </Link>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px', fontSize: '13px', color: '#4b5563' }}>
                        <span>{shop.locality}</span>
                        {shop.distance_km != null && <span>· {shop.distance_km} km away</span>}
                        <span>·</span>
                        <span style={{ color: '#6b7280' }}>{categoryLabel}</span>
                      </div>
                    </div>

                    {/* Status Badges */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {shop.hours_status === 'unknown' ? (
                        <span style={{ fontSize: '12px', fontWeight: '600', backgroundColor: '#fef3c7', color: '#92400e', padding: '3px 8px', borderRadius: '4px' }}>
                          Hours not confirmed
                        </span>
                      ) : shop.open_now ? (
                        <span style={{ fontSize: '12px', fontWeight: '600', backgroundColor: '#dcfce7', color: '#166534', padding: '3px 8px', borderRadius: '4px' }}>
                          Open now
                        </span>
                      ) : (
                        <span style={{ fontSize: '12px', fontWeight: '600', backgroundColor: '#fee2e2', color: '#991b1b', padding: '3px 8px', borderRadius: '4px' }}>
                          Closed
                        </span>
                      )}

                      {shop.price_range_inr && (
                        <span style={{ fontSize: '12px', fontWeight: '600', backgroundColor: '#f3f4f6', color: '#374151', padding: '3px 8px', borderRadius: '4px' }}>
                          ₹{shop.price_range_inr[0].toLocaleString('en-IN')} – ₹{shop.price_range_inr[1].toLocaleString('en-IN')}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Matching Items Preview */}
                  {shop.matching_items && shop.matching_items.length > 0 && (
                    <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid #f3f4f6' }}>
                      <div style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280', marginBottom: '6px' }}>
                        POPULAR OFFERINGS
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {shop.matching_items.map((item) => (
                          <div
                            key={item.id}
                            style={{
                              backgroundColor: '#f9fafb',
                              border: '1px solid #e5e7eb',
                              borderRadius: '6px',
                              padding: '6px 10px',
                              fontSize: '13px',
                              color: '#374151',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                            }}
                          >
                            <span style={{ fontWeight: '500' }}>{item.name}</span>
                            <span style={{ color: '#059669', fontWeight: '600' }}>{item.price_display}</span>
                            {item.duration_min && (
                              <span style={{ color: '#9ca3af', fontSize: '11px' }}>({item.duration_min}m)</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action Link Footer */}
                  <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
                    <Link
                      href={`/shop/${shop.slug}`}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '13px',
                        fontWeight: '600',
                        color: '#2563eb',
                        textDecoration: 'none',
                      }}
                    >
                      View shop menu & contact &rarr;
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Empty State & Relaxation Hints (W4) */
          <div style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '40px 24px', textAlign: 'center' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#111827', marginBottom: '8px' }}>
              No shops found matching your filters
            </h3>
            <p style={{ fontSize: '14px', color: '#6b7280', maxWidth: '480px', margin: '0 auto 20px auto' }}>
              We could not find any active verified listings with those exact constraints.
            </p>

            {relaxationHints.length > 0 && (
              <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid #f3f4f6' }}>
                <p style={{ fontSize: '13px', fontWeight: '600', color: '#4b5563', marginBottom: '12px' }}>
                  Try relaxing one constraint:
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'center' }}>
                  {relaxationHints.map((hint, idx) => {
                    let label = '';
                    if (hint.constraint === 'radius') {
                      label = `Expand radius to 25 km (would return ${hint.would_return})`;
                    } else if (hint.constraint === 'max_price') {
                      label = `Remove price ceiling (would return ${hint.would_return})`;
                    } else if (hint.constraint === 'open_now') {
                      label = `Include closed shops (would return ${hint.would_return})`;
                    } else if (hint.constraint === 'category') {
                      label = `Search all categories (would return ${hint.would_return})`;
                    }

                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => applyRelaxation(hint)}
                        style={{
                          padding: '8px 14px',
                          backgroundColor: '#f0fdf4',
                          border: '1px solid #86efac',
                          borderRadius: '6px',
                          fontSize: '13px',
                          fontWeight: '600',
                          color: '#166534',
                          cursor: 'pointer',
                        }}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer style={{ backgroundColor: '#ffffff', borderTop: '1px solid #e5e7eb', padding: '24px 16px', textAlign: 'center' }}>
        <p style={{ fontSize: '13px', color: '#6b7280', margin: '0 0 8px 0' }}>
          Shopfront — Chennai&apos;s direct hyper-local shop discovery platform.
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', fontSize: '12px' }}>
          <Link href="/login" style={{ color: '#4b5563', textDecoration: 'none' }}>
            Owner & Admin Portal
          </Link>
          <span style={{ color: '#d1d5db' }}>·</span>
          <Link href="/api/health" style={{ color: '#4b5563', textDecoration: 'none' }}>
            System Status
          </Link>
        </div>
      </footer>
    </div>
  );
}
