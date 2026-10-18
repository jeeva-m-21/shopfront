'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import {
  Search,
  MapPin,
  Clock,
  Sparkles,
  Wrench,
  UtensilsCrossed,
  MessageCircle,
  Store,
  Code2,
  ChevronRight,
  Filter,
} from 'lucide-react';
import type { SearchShopResult } from '../search/search-shops.js';
import type { RelaxationHint } from '../search/stage1.js';
import { Button } from '../components/ui/button.js';
import { Badge } from '../components/ui/badge.js';
import { Card } from '../components/ui/card.js';

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
          setShops(data.data.shops || []);
          setLocationWarning(data.data.location_warning || null);
          setLocationResolved(data.data.location_resolved || null);
          setRelaxationHints(data.data.relaxation_hints || []);
          setReranked(Boolean(data.data.reranked));
        }
      } catch {
        setErrorMessage('Failed to connect to search service.');
        setShops([]);
      }
    });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeSearch();
  };

  const handleCategorySelect = (catKey: string) => {
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
      {/* 1. Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-brand-50/60 via-surface-50 to-surface-50 pt-12 pb-16 lg:pt-20 lg:pb-24 border-b border-slate-200/60">
        <div className="absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:24px_24px] opacity-[0.12] pointer-events-none" />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          {/* Top Pill */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-100/80 border border-brand-200 text-brand-800 text-xs font-semibold mb-6 shadow-sm">
            <span className="flex h-2 w-2 rounded-full bg-brand-500 animate-pulse" />
            <span>Chennai&apos;s Local Commerce Layer</span>
            <span className="text-slate-300">•</span>
            <span className="text-brand-700">Zero Middleman Commission</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.15] mb-6">
            Find Trusted Local Shops in{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-emerald-500">
              Chennai
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed">
            Real menu items, verified operating hours, and direct WhatsApp links across 32 Chennai localities.
            Built for humans and connected directly to AI agents via the MCP protocol.
          </p>

          {/* Unified Hero Search Box */}
          <Card className="max-w-4xl mx-auto shadow-elevated p-4 sm:p-6 bg-white border-slate-200 text-left">
            <form onSubmit={handleSearchSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                {/* Search query input */}
                <div className="md:col-span-6 relative">
                  <label htmlFor="search-query" className="block text-xs font-semibold text-slate-700 mb-1.5">
                    What are you looking for?
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      id="search-query"
                      type="text"
                      maxLength={200}
                      placeholder="e.g. iPhone battery, Ayurvedic massage, Filter coffee..."
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all"
                    />
                  </div>
                </div>

                {/* Locality Selector */}
                <div className="md:col-span-4 relative">
                  <label htmlFor="search-locality" className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Locality
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <select
                      id="search-locality"
                      value={locality}
                      onChange={(e) => setLocality(e.target.value)}
                      className="w-full pl-10 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all appearance-none"
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
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={isPending}
                    className="w-full py-2.5 rounded-xl font-semibold shadow-md"
                  >
                    {isPending ? 'Searching...' : 'Search'}
                  </Button>
                </div>
              </div>

              {/* Quick Filters Row */}
              <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                {/* Category Pills */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-slate-400 font-medium mr-1 flex items-center gap-1">
                    <Filter className="w-3 h-3" /> Filters:
                  </span>
                  {categories.map((cat) => {
                    const Icon = cat.icon;
                    const isSelected = category === cat.key;
                    return (
                      <button
                        key={cat.key}
                        type="button"
                        onClick={() => handleCategorySelect(cat.key)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg font-medium transition-all ${
                          isSelected
                            ? 'bg-brand-600 text-white shadow-sm'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        <Icon className="w-3 h-3" />
                        <span>{cat.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Open Now Toggle & Price Filter */}
                <div className="flex items-center gap-4">
                  <label className="inline-flex items-center gap-1.5 cursor-pointer font-medium text-slate-700 select-none">
                    <input
                      type="checkbox"
                      checked={openNow}
                      onChange={(e) => {
                        setOpenNow(e.target.checked);
                        executeSearch({ openNow: e.target.checked });
                      }}
                      className="rounded border-slate-300 text-brand-600 focus:ring-brand-500 w-3.5 h-3.5"
                    />
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Open Now (IST)</span>
                  </label>

                  <div className="flex items-center gap-1">
                    <span className="text-slate-400">Max ₹</span>
                    <input
                      type="number"
                      placeholder="e.g. 5000"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                      onBlur={() => executeSearch({ maxPrice })}
                      className="w-20 px-2 py-0.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-brand-500"
                    />
                  </div>
                </div>
              </div>
            </form>
          </Card>
        </div>
      </section>

      {/* 2. Search Results Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Alerts & Warnings */}
        {errorMessage && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-3">
            <span className="font-bold">Notice:</span>
            <div>
              <p>{errorMessage}</p>
              {suggestedLocalities.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <span className="text-xs text-red-600">Suggested Chennai localities:</span>
                  {suggestedLocalities.map((loc) => (
                    <button
                      key={loc}
                      onClick={() => handleLocalitySelect(loc)}
                      className="text-xs px-2 py-0.5 bg-white border border-red-200 rounded hover:bg-red-100 font-medium"
                    >
                      {loc}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {locationWarning && (
          <div className="mb-6 p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-amber-600" />
              <span>{locationWarning}</span>
            </div>
            <span className="text-[11px] text-amber-600 font-semibold">City-Wide Search</span>
          </div>
        )}

        {/* Results Metadata Bar */}
        <div className="flex items-center justify-between pb-6 border-b border-slate-200 mb-6">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              {locationResolved ? `Shops in ${locationResolved.name}` : 'Discovered Shops'}
            </h2>
            <Badge variant="brand" className="text-xs">
              {shops.length} {shops.length === 1 ? 'match' : 'matches'}
            </Badge>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500">
            {reranked && (
              <span className="inline-flex items-center gap-1 text-brand-700 bg-brand-50 px-2 py-0.5 rounded border border-brand-200">
                <Sparkles className="w-3 h-3" /> AI Reranked
              </span>
            )}
            <span className="hidden sm:inline font-mono">Stage 1 PostGIS</span>
          </div>
        </div>

        {/* Relaxation Hints (when count is low or zero) */}
        {relaxationHints.length > 0 && (
          <div className="mb-8 p-4 rounded-xl bg-slate-50 border border-slate-200">
            <p className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Broaden your search:
            </p>
            <div className="flex flex-wrap gap-2">
              {relaxationHints.map((hint, idx) => {
                let label = '';
                if (hint.constraint === 'radius') {
                  label = 'Expand radius to 25 km';
                } else if (hint.constraint === 'max_price') {
                  label = 'Remove price ceiling';
                } else if (hint.constraint === 'open_now') {
                  label = 'Include closed shops';
                } else if (hint.constraint === 'category') {
                  label = 'Search all categories';
                }

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleRelaxationApply(hint)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 text-xs font-medium hover:border-brand-500 hover:text-brand-600 transition-colors shadow-sm"
                  >
                    <span>{label}</span>
                    <Badge variant="neutral" className="text-[10px] py-0 px-1.5">
                      +{hint.would_return}
                    </Badge>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Results Grid */}
        {shops.length === 0 ? (
          <Card className="text-center py-16 px-4 max-w-lg mx-auto border-dashed border-2 border-slate-200 shadow-none">
            <Store className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-800 mb-1">No matching shops found</h3>
            <p className="text-sm text-slate-500 mb-6">
              Try adjusting your query, selecting a neighboring locality, or clearing price limits.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setQuery('');
                setLocality('');
                setCategory('');
                setMaxPrice('');
                setOpenNow(false);
                executeSearch({ query: '', locality: '', category: '', maxPrice: '', openNow: false });
              }}
            >
              Reset All Filters
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {shops.map((shop) => (
              <Card
                key={shop.slug}
                className="flex flex-col justify-between hover:border-brand-300 transition-all duration-200 overflow-hidden"
              >
                <div className="p-5">
                  {/* Top card metadata */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <Badge variant="outline" className="text-[10px] uppercase tracking-wider font-semibold">
                      {shop.category.replace('_', ' ')}
                    </Badge>
                    {shop.hours_status === 'set' && (
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                          shop.open_now
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            shop.open_now ? 'bg-emerald-500' : 'bg-slate-400'
                          }`}
                        />
                        {shop.open_now ? 'Open Now' : 'Closed'}
                      </span>
                    )}
                  </div>

                  {/* Shop Title */}
                  <h3 className="text-lg font-bold text-slate-900 hover:text-brand-700 transition-colors line-clamp-1 mb-1">
                    <Link href={`/shop/${shop.slug}`}>{shop.name}</Link>
                  </h3>

                  {/* Locality & Distance */}
                  <div className="flex items-center gap-2 text-xs text-slate-500 mb-3">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {shop.locality}
                    </span>
                    {shop.distance_km !== null && (
                      <>
                        <span>•</span>
                        <span>{shop.distance_km.toFixed(1)} km away</span>
                      </>
                    )}
                  </div>

                  {/* Price Range */}
                  {shop.price_range_inr && (
                    <div className="text-xs font-semibold text-slate-700 mb-3 bg-slate-50 px-2.5 py-1 rounded-md inline-block">
                      Price Guide: ₹{shop.price_range_inr[0].toLocaleString('en-IN')}
                      {shop.price_range_inr[1] !== shop.price_range_inr[0] &&
                        ` – ₹${shop.price_range_inr[1].toLocaleString('en-IN')}`}
                    </div>
                  )}

                  {/* Matching Items Preview */}
                  {shop.matching_items && shop.matching_items.length > 0 && (
                    <div className="space-y-1.5 pt-2 border-t border-slate-100">
                      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                        Featured Services / Items:
                      </span>
                      {shop.matching_items.slice(0, 2).map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between text-xs text-slate-600 bg-surface-50 p-1.5 rounded"
                        >
                          <span className="line-clamp-1 font-medium">{item.name}</span>
                          <span className="font-semibold text-brand-700 ml-2 whitespace-nowrap">
                            {item.price_display}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer action bar */}
                <div className="p-4 bg-slate-50/60 border-t border-slate-100 flex items-center justify-between gap-2">
                  <Link href={`/shop/${shop.slug}`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full text-xs">
                      View Menu & Hours
                    </Button>
                  </Link>

                  {shop.action_mode === 'whatsapp' && (
                    <Link href={`/shop/${shop.slug}#contact`} className="flex-1">
                      <Button variant="primary" size="sm" className="w-full text-xs bg-emerald-600 hover:bg-emerald-700">
                        <MessageCircle className="w-3.5 h-3.5 mr-1" />
                        <span>WhatsApp</span>
                      </Button>
                    </Link>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* 3. Value Proposition Grid */}
      <section className="bg-white border-y border-slate-200 py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mb-3">
              Why Chennai Chooses Shopfront
            </h2>
            <p className="text-slate-600 text-sm sm:text-base">
              A transparent, zero-commission network designed to connect local neighbourhood merchants with modern customers and AI assistants.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="p-6">
              <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center mb-4">
                <Store className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">0% Commission for Merchants</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Aggregators take up to 30% on every order. Shopfront connects customers directly with store owners via WhatsApp with zero commission fees.
              </p>
            </Card>

            <Card className="p-6">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
                <Clock className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">Verified Operating Hours</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Never travel to a closed shop again. Real-time IST open/closed computation with custom holiday schedules and weekly interval checks.
              </p>
            </Card>

            <Card className="p-6">
              <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center mb-4">
                <Code2 className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">Native AI Agent (MCP) Protocol</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Claude Desktop, Cursor, and autonomous agents can query Chennai&apos;s live directory, catalogs, and booking links through open declarative tools.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* 4. All 32 Chennai Localities Quick-Browse */}
      <section id="localities" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight mb-1">
              Explore All 32 Chennai Localities
            </h2>
            <p className="text-sm text-slate-500">
              PostGIS-indexed neighborhood coverage from North Chennai to the IT Corridor.
            </p>
          </div>
          <Badge variant="neutral" className="self-start sm:self-auto text-xs py-1 px-3">
            Service Bounding Box: 12.75°N to 13.30°N
          </Badge>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2.5">
          {initialLocalities.map((loc) => (
            <button
              key={loc.id}
              onClick={() => handleLocalitySelect(loc.name)}
              className={`p-2.5 rounded-xl border text-xs font-medium text-center transition-all ${
                locality === loc.name
                  ? 'bg-brand-600 border-brand-600 text-white shadow-sm'
                  : 'bg-white border-slate-200 text-slate-700 hover:border-brand-400 hover:text-brand-600'
              }`}
            >
              {loc.name}
            </button>
          ))}
        </div>
      </section>

      {/* 5. Developer & MCP Callout Banner */}
      <section className="bg-surface-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-4">
              <Badge variant="brand" className="bg-brand-900 text-brand-300 border-brand-700 text-xs">
                Model Context Protocol Ready
              </Badge>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Integrate Chennai Commerce into Claude, Cursor & LLMs
              </h2>
              <p className="text-slate-300 text-sm leading-relaxed max-w-xl">
                Shopfront provides a live MCP server implementing 5 declarative tools. Search shops, retrieve verified menus, inspect weekly hours, and generate WhatsApp deep links directly from your AI agent prompts.
              </p>
              <div className="pt-2 flex flex-wrap gap-3">
                <Link href="/developers">
                  <Button variant="accent" size="md">
                    <span>Open MCP Playground</span>
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
                <a
                  href="/mcp"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center px-4 py-2 rounded-xl text-sm font-mono border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors"
                >
                  Endpoint: POST /mcp
                </a>
              </div>
            </div>

            {/* Quick config preview */}
            <div className="lg:col-span-5 bg-surface-950 p-5 rounded-2xl border border-slate-800 text-xs font-mono text-slate-300 overflow-x-auto shadow-2xl">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800 text-slate-400 text-[11px]">
                <span>claude_desktop_config.json</span>
                <span className="text-brand-400 font-semibold">Streamable HTTP</span>
              </div>
              <pre className="text-emerald-400 leading-relaxed">
{`{
  "mcpServers": {
    "shopfront": {
      "url": "http://localhost:3000/mcp"
    }
  }
}`}
              </pre>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
