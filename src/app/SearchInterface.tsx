'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import {
  Search,
  MapPin,
  Sparkles,
  Wrench,
  UtensilsCrossed,
  MessageCircle,
  Store,
} from 'lucide-react';
import type { SearchShopResult } from '../search/search-shops';
import type { RelaxationHint } from '../search/stage1';
import { ShutterMark } from '../components/brand/ShutterMark';
import { StatusChip } from '../components/brand/StatusChip';
import { VerifiedBadge } from '../components/brand/VerifiedBadge';

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
          setRelaxationHints([]);
        } else {
          const payload = data.data || data;
          setShops(payload.shops || []);
          setLocationWarning(payload.location_warning || null);
          setLocationResolved(payload.location_resolved || null);
          setRelaxationHints(payload.relaxation_hints || []);
          setReranked(Boolean(payload.reranked));
        }
      } catch {
        setErrorMessage('Network connection lost. Please verify your connection.');
        setShops([]);
      }
    });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeSearch();
  };

  const handleCategoryToggle = (catKey: string) => {
    const newCat = category === catKey ? '' : catKey;
    setCategory(newCat);
    executeSearch({ category: newCat });
  };

  const handleLocalitySelect = (locName: string) => {
    setLocality(locName);
    executeSearch({ locality: locName });
  };

  const handleRelaxationApply = (hint: RelaxationHint) => {
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

  const categories = [
    { key: 'repair_service', label: 'Repairs & Services', icon: Wrench },
    { key: 'salon_wellness', label: 'Salons & Wellness', icon: Sparkles },
    { key: 'food_beverage', label: 'Cafes & Dining', icon: UtensilsCrossed },
  ];

  return (
    <div className="w-full">
      {/* 1. Hero Section: "The shutter goes up." */}
      <section className="relative overflow-hidden bg-stone-50 pt-12 pb-16 lg:pt-20 lg:pb-24 border-b border-stone-200">
        <div className="absolute inset-0 bg-shutter-grid opacity-30 pointer-events-none" />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          {/* Proof Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-stone-100 border border-stone-200 text-stone-800 text-xs font-mono mb-6 shadow-paper">
            <ShutterMark size={14} />
            <span>The shutter goes up.</span>
            <span className="text-stone-300">•</span>
            <span className="text-marina-700 font-medium">Chennai IST Status Verified</span>
          </div>

          <h1 className="font-display text-4xl sm:text-6xl lg:text-7xl font-normal text-stone-900 tracking-[-0.02em] leading-[1.08] mb-6">
            Find Trusted Local Shops in{' '}
            <span className="relative inline-block">
              <span>Chennai</span>
              <span className="absolute left-0 right-0 -bottom-1 h-1.5 bg-turmeric-500 rounded-full" />
            </span>
          </h1>

          <p className="text-base sm:text-lg text-stone-600 max-w-2xl mx-auto mb-10 leading-relaxed font-sans">
            Real menu items, live opening hours, and direct WhatsApp contact across 32 Chennai localities.
            Zero take rate, built for humans and ready for AI agents.
          </p>

          {/* Unified Command Search Card */}
          <div className="max-w-4xl mx-auto shadow-paper-lg p-4 sm:p-6 bg-white border border-stone-200 rounded-2xl text-left">
            <form onSubmit={handleSearchSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                {/* Search query input */}
                <div className="md:col-span-6 relative">
                  <label htmlFor="search-query" className="block text-xs font-mono uppercase tracking-wider text-stone-600 mb-1.5">
                    What are you looking for?
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                    <input
                      id="search-query"
                      type="text"
                      maxLength={200}
                      placeholder="e.g. iPhone battery, Ayurvedic massage, Filter coffee..."
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm text-stone-900 placeholder:text-stone-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-marina-600 focus:border-marina-600 transition-all font-sans"
                    />
                  </div>
                </div>

                {/* Locality Selector */}
                <div className="md:col-span-4 relative">
                  <label htmlFor="search-locality" className="block text-xs font-mono uppercase tracking-wider text-stone-600 mb-1.5">
                    Locality
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                    <select
                      id="search-locality"
                      value={locality}
                      onChange={(e) => setLocality(e.target.value)}
                      className="w-full pl-10 pr-8 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-marina-600 focus:border-marina-600 transition-all appearance-none font-sans"
                    >
                      <option value="">Anywhere in Chennai</option>
                      {initialLocalities.map((loc) => (
                        <option key={loc.id} value={loc.name}>
                          {loc.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Submit button */}
                <div className="md:col-span-2 flex items-end">
                  <button
                    type="submit"
                    disabled={isPending}
                    className="w-full py-2.5 px-4 rounded-xl font-medium text-sm bg-marina-600 hover:bg-marina-700 disabled:opacity-50 text-white transition-colors shadow-paper flex items-center justify-center gap-1.5"
                  >
                    <Search className="w-4 h-4" />
                    <span>{isPending ? 'Searching...' : 'Search'}</span>
                  </button>
                </div>
              </div>

              {/* Secondary Filters row */}
              <div className="pt-3 border-t border-stone-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                {/* Category Pills */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-stone-500 font-mono text-[11px] uppercase mr-1">Category:</span>
                  {categories.map((cat) => {
                    const Icon = cat.icon;
                    const isSelected = category === cat.key;
                    return (
                      <button
                        key={cat.key}
                        type="button"
                        onClick={() => handleCategoryToggle(cat.key)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs transition-colors ${
                          isSelected
                            ? 'bg-marina-50 border-marina-300 text-marina-800 font-medium'
                            : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span>{cat.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Open Now toggle & Price */}
                <div className="flex items-center gap-3">
                  <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={openNow}
                      onChange={(e) => {
                        setOpenNow(e.target.checked);
                        executeSearch({ openNow: e.target.checked });
                      }}
                      className="w-4 h-4 rounded border-stone-300 text-marina-600 focus:ring-marina-500"
                    />
                    <span className="text-stone-700 font-medium">Open Now (IST)</span>
                  </label>

                  {/* Price Ceiling */}
                  <div className="flex items-center gap-1">
                    <span className="text-stone-400 font-mono">Max ₹</span>
                    <input
                      type="number"
                      placeholder="Budget"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                      onBlur={() => executeSearch({ maxPrice })}
                      className="w-20 px-2 py-1 bg-stone-50 border border-stone-200 rounded-md text-xs font-mono text-stone-900 focus:outline-none focus:ring-1 focus:ring-marina-600"
                    />
                  </div>
                </div>
              </div>
            </form>
          </div>

          {/* Proof Strip */}
          <div className="mt-8 pt-6 border-t border-stone-200/60 flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs font-mono text-stone-600">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-status-open" />
              <span>10 Verified Pilot Shops</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-marina-600" />
              <span>32 Chennai Localities</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-turmeric-500" />
              <span>0% Take Rate / Direct UPI</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-status-open animate-pulse" />
              <span>Live Asia/Kolkata IST Schedules</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Search Results Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
        {/* Results Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200">
          <div>
            <h2 className="text-xl font-display text-stone-900 tracking-tight">
              {locationResolved ? `Shops near ${locationResolved.name}` : 'Discovered Shops'}
              <span className="ml-2 font-mono text-xs font-normal text-stone-500">
                ({shops.length} verified {shops.length === 1 ? 'merchant' : 'merchants'})
              </span>
            </h2>
            {reranked && (
              <p className="text-xs text-marina-700 flex items-center gap-1.5 mt-0.5 font-mono">
                <Sparkles className="w-3.5 h-3.5 text-turmeric-500" />
                <span>Ranked by Jev Decisions semantic reranker</span>
              </p>
            )}
          </div>

          {/* Active Constraints / Clear button */}
          {(query || locality || category || maxPrice || openNow) && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setLocality('');
                setCategory('');
                setMaxPrice('');
                setOpenNow(false);
                executeSearch({ query: '', locality: '', category: '', maxPrice: '', openNow: false });
              }}
              className="text-xs text-stone-500 hover:text-stone-900 font-mono underline self-start sm:self-auto"
            >
              Clear all filters
            </button>
          )}
        </div>

        {/* Location Warning Banner */}
        {locationWarning && (
          <div className="p-3 rounded-xl border border-turmeric-300 bg-turmeric-50/70 text-xs font-mono text-turmeric-700">
            {locationWarning}
          </div>
        )}

        {/* Location Required Prompt Banner */}
        {errorMessage && (
          <div className="p-4 rounded-xl border border-turmeric-300 bg-turmeric-50 text-stone-800 space-y-2">
            <p className="text-sm font-medium">{errorMessage}</p>
            {suggestedLocalities.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-xs text-stone-600 font-mono">Select a locality:</span>
                {suggestedLocalities.map((loc) => (
                  <button
                    key={loc}
                    type="button"
                    onClick={() => handleLocalitySelect(loc)}
                    className="px-2.5 py-1 text-xs rounded-lg bg-white border border-turmeric-300 text-stone-800 hover:bg-turmeric-100 font-medium"
                  >
                    {loc}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Relaxation Hints */}
        {relaxationHints.length > 0 && (
          <div className="p-3.5 rounded-xl border border-stone-200 bg-stone-50 space-y-2">
            <p className="text-xs font-mono text-stone-600 uppercase tracking-wider">
              Broaden your search:
            </p>
            <div className="flex flex-wrap gap-2">
              {relaxationHints.map((hint, idx) => {
                let label = '';
                if (hint.constraint === 'radius') label = 'Expand radius to 25 km';
                else if (hint.constraint === 'max_price') label = 'Remove price ceiling';
                else if (hint.constraint === 'open_now') label = 'Include closed shops';
                else if (hint.constraint === 'category') label = 'Search all categories';

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleRelaxationApply(hint)}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white border border-stone-200 text-stone-700 text-xs font-medium hover:border-marina-400 hover:text-marina-700 transition-colors shadow-paper"
                  >
                    <span>{label}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-stone-100 text-stone-600">
                      +{hint.would_return}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Results Grid */}
        {shops.length === 0 ? (
          <div className="text-center py-16 px-4 max-w-lg mx-auto border-2 border-dashed border-stone-200 rounded-2xl bg-white shadow-none">
            <Store className="w-10 h-10 text-stone-300 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-stone-900 mb-1">No matching shops found</h3>
            <p className="text-xs text-stone-500 mb-6 font-sans">
              Try adjusting your query, selecting a neighboring locality, or clearing price limits.
            </p>
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setLocality('');
                setCategory('');
                setMaxPrice('');
                setOpenNow(false);
                executeSearch({ query: '', locality: '', category: '', maxPrice: '', openNow: false });
              }}
              className="px-4 py-2 text-xs font-medium rounded-lg border border-stone-300 bg-white hover:bg-stone-50 text-stone-700 shadow-paper"
            >
              Reset All Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {shops.map((shop) => (
              <div
                key={shop.slug}
                className="flex flex-col justify-between bg-white border border-stone-200 rounded-2xl hover:border-marina-300 hover:shadow-paper-md transition-all duration-200 overflow-hidden shadow-paper"
              >
                <div className="p-5 space-y-3">
                  {/* Top card metadata */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono uppercase tracking-wider font-semibold px-2 py-0.5 rounded bg-stone-100 text-stone-600 border border-stone-200">
                        {shop.category.replace('_', ' ')}
                      </span>
                      <VerifiedBadge verifiedText="verified" />
                    </div>
                    {shop.hours_status === 'set' && (
                      <StatusChip status={shop.open_now ? 'open' : 'closed'} size="sm" />
                    )}
                  </div>

                  {/* Shop Title */}
                  <div>
                    <h3 className="text-lg font-bold text-stone-900 hover:text-marina-600 transition-colors line-clamp-1">
                      <Link href={`/shop/${shop.slug}`}>{shop.name}</Link>
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-stone-500 mt-0.5">
                      <span className="flex items-center gap-1 font-sans">
                        <MapPin className="w-3.5 h-3.5 text-stone-400" />
                        {shop.locality}
                      </span>
                      {shop.distance_km !== null && (
                        <>
                          <span>•</span>
                          <span className="font-mono text-[11px]">{shop.distance_km.toFixed(1)} km away</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Price Range */}
                  {shop.price_range_inr && (
                    <div className="text-xs font-mono text-stone-700 bg-stone-50 px-2.5 py-1 rounded-md border border-stone-200 inline-block">
                      Price Guide: ₹{shop.price_range_inr[0].toLocaleString('en-IN')}
                      {shop.price_range_inr[1] !== shop.price_range_inr[0] &&
                        ` – ₹${shop.price_range_inr[1].toLocaleString('en-IN')}`}
                    </div>
                  )}

                  {/* Matching Items Preview with dot leaders */}
                  {shop.matching_items && shop.matching_items.length > 0 && (
                    <div className="space-y-1.5 pt-2 border-t border-stone-100">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-stone-400 block">
                        Featured Items:
                      </span>
                      {shop.matching_items.slice(0, 2).map((item) => (
                        <div
                          key={item.id}
                          className="flex items-baseline justify-between text-xs text-stone-700"
                        >
                          <span className="line-clamp-1 font-medium text-stone-800">{item.name}</span>
                          <span className="flex-1 mx-2 dot-leader h-3 opacity-40" />
                          <span className="font-mono text-[11px] font-semibold text-stone-900 whitespace-nowrap">
                            {item.price_display}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer action bar */}
                <div className="p-4 bg-stone-50 border-t border-stone-200 flex items-center justify-between gap-2">
                  <Link
                    href={`/shop/${shop.slug}`}
                    className="flex-1 text-center py-2 px-3 text-xs font-medium rounded-lg border border-stone-300 bg-white hover:bg-stone-100 text-stone-800 transition-colors shadow-paper"
                  >
                    View Menu & Hours
                  </Link>

                  {shop.action_mode === 'whatsapp' && (
                    <Link
                      href={`/shop/${shop.slug}#contact`}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-medium rounded-lg bg-status-open hover:bg-[#156e3b] text-white transition-colors shadow-paper"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>WhatsApp</span>
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* AI Assistant Banner Strip */}
        <div className="mt-8 p-4 sm:p-5 rounded-2xl border border-marina-200 bg-marina-50/70 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-paper">
          <div className="flex items-center gap-3.5 text-left">
            <div className="w-9 h-9 rounded-xl bg-marina-600 text-white flex items-center justify-center font-mono font-bold text-xs shrink-0 shadow-sm">
              AI
            </div>
            <div>
              <p className="text-xs sm:text-sm font-semibold text-stone-900">
                Also available inside your AI assistant.
              </p>
              <p className="text-[11px] sm:text-xs text-stone-600 font-sans">
                Query these verified Chennai shops directly from Claude, Cursor, or ChatGPT via Model Context Protocol.
              </p>
            </div>
          </div>
          <Link
            href="/connect"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-marina-600 hover:bg-marina-700 text-white text-xs font-semibold transition-all shadow-paper shrink-0 hover:-translate-y-0.5"
          >
            <span>Add Shopfront →</span>
          </Link>
        </div>
      </section>

      {/* 3. 32 Chennai Localities Quick Browse Directory */}
      <section id="localities" className="border-t border-stone-200 bg-stone-50 py-12 lg:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h2 className="text-2xl font-display text-stone-900 tracking-tight">
              Explore All 32 Chennai Localities
            </h2>
            <p className="text-xs text-stone-600 font-sans">
              Discover verified physical merchants across South, Central, and North Chennai with exact PostGIS coordinates.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-2.5">
            {initialLocalities.map((loc) => {
              const isSelected = locality === loc.name;
              return (
                <button
                  key={loc.id}
                  type="button"
                  onClick={() => handleLocalitySelect(loc.name)}
                  className={`p-2.5 rounded-xl border text-left transition-all text-xs flex flex-col justify-between gap-1 shadow-paper ${
                    isSelected
                      ? 'bg-marina-600 border-marina-700 text-white font-semibold'
                      : 'bg-white border-stone-200 text-stone-700 hover:border-marina-300 hover:bg-marina-50/20'
                  }`}
                >
                  <span className="truncate">{loc.name}</span>
                  <span className={`text-[10px] font-mono ${isSelected ? 'text-marina-100' : 'text-stone-400'}`}>
                    Chennai
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
