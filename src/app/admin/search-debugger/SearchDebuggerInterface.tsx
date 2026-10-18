'use client';

import React, { useState, useTransition } from 'react';
import {
  Search,
  Sparkles,
  Check,
  X,
  ArrowUp,
  ArrowDown,
  Minus,
} from 'lucide-react';
import { runSearchDebuggerAction, type DebugSearchResult } from './actions';
import { CHENNAI_LOCALITIES } from '../../../domain/localities';

export function SearchDebuggerInterface() {
  const [query, setQuery] = useState('MacBook screen repair');
  const [locality, setLocality] = useState('Adyar');
  const [category, setCategory] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [openNow, setOpenNow] = useState(false);
  const [showSampleData, setShowSampleData] = useState(false);

  const [result, setResult] = useState<DebugSearchResult | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleRunDiagnostic = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const res = await runSearchDebuggerAction({
        query: query.trim() || undefined,
        locality: locality || undefined,
        category: category || undefined,
        maxPriceInr: maxPrice ? Number(maxPrice) : undefined,
        openNow,
        showSampleData,
      });
      setResult(res);
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-normal text-stone-900">
          Two-Stage Search Engine Debugger
        </h1>
        <p className="text-xs text-stone-500 font-sans mt-0.5">
          Inspect Stage 1 PostGIS SQL candidate filtering vs. Stage 2 Jev Decisions semantic reranking, H1–H6 criteria breakdown, and rank deltas.
        </p>
      </div>

      {/* Query Control Form */}
      <form onSubmit={handleRunDiagnostic} className="p-6 rounded-2xl bg-white border border-stone-200 shadow-paper space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-5">
            <label className="block text-xs font-mono uppercase tracking-wider text-stone-600 mb-1.5">
              Customer Query
            </label>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. iPhone battery, Ayurvedic massage..."
              className="w-full px-3.5 py-2 text-sm bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-marina-600"
            />
          </div>

          <div className="md:col-span-3">
            <label className="block text-xs font-mono uppercase tracking-wider text-stone-600 mb-1.5">
              Locality
            </label>
            <select
              value={locality}
              onChange={(e) => setLocality(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-marina-600"
            >
              <option value="">Anywhere in Chennai</option>
              {CHENNAI_LOCALITIES.map((loc) => (
                <option key={loc.id} value={loc.name}>
                  {loc.name}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-mono uppercase tracking-wider text-stone-600 mb-1.5">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-marina-600"
            >
              <option value="">All Categories</option>
              <option value="repair_service">Repairs & Services</option>
              <option value="salon_wellness">Salons & Wellness</option>
              <option value="food_beverage">Food & Beverage</option>
            </select>
          </div>

          <div className="md:col-span-2 flex items-end">
            <button
              type="submit"
              disabled={isPending}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold bg-marina-600 hover:bg-marina-700 disabled:opacity-50 text-white transition-colors shadow-paper flex items-center justify-center gap-1.5"
            >
              <Search className="w-3.5 h-3.5" />
              <span>{isPending ? 'Diagnosing...' : 'Run Diagnostic'}</span>
            </button>
          </div>
        </div>

        {/* Checkbox Options */}
        <div className="pt-3 border-t border-stone-100 flex flex-wrap items-center gap-6 text-xs text-stone-700">
          <label className="inline-flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={openNow}
              onChange={(e) => setOpenNow(e.target.checked)}
              className="w-4 h-4 rounded border-stone-300 text-marina-600 focus:ring-marina-500"
            />
            <span>Apply H6 Open Now (IST) constraint</span>
          </label>

          <label className="inline-flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showSampleData}
              onChange={(e) => setShowSampleData(e.target.checked)}
              className="w-4 h-4 rounded border-stone-300 text-marina-600 focus:ring-marina-500"
            />
            <span>Include Synthetic Benchmark Sample Data</span>
          </label>

          <div className="flex items-center gap-2">
            <span className="text-stone-400 font-mono">Max Price: ₹</span>
            <input
              type="number"
              placeholder="e.g. 1000"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              className="w-24 px-2 py-1 text-xs bg-stone-50 border border-stone-200 rounded-md font-mono"
            />
          </div>
        </div>
      </form>

      {/* Diagnostic Overview Panel */}
      {result && result.success && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-white border border-stone-200 shadow-paper">
            <span className="text-[10px] font-mono uppercase tracking-wider text-stone-500 block">
              Stage 1 SQL Candidates
            </span>
            <span className="text-xl font-mono font-bold text-stone-900">
              {result.stage1Count} shops
            </span>
          </div>

          <div className="p-4 rounded-xl bg-white border border-stone-200 shadow-paper">
            <span className="text-[10px] font-mono uppercase tracking-wider text-stone-500 block">
              Stage 2 Rerank Status
            </span>
            <span className="text-sm font-semibold text-stone-800 flex items-center gap-1.5 mt-1">
              {result.reranked ? (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-turmeric-500" />
                  <span className="text-status-open">Reranked ({result.jevModel})</span>
                </>
              ) : (
                <span className="text-stone-500 font-mono text-xs">
                  Fail-open: {result.fallbackReason || 'disabled'}
                </span>
              )}
            </span>
          </div>

          <div className="p-4 rounded-xl bg-white border border-stone-200 shadow-paper">
            <span className="text-[10px] font-mono uppercase tracking-wider text-stone-500 block">
              Location Resolved
            </span>
            <span className="text-sm font-mono font-medium text-stone-800 mt-1 block truncate">
              {result.locationResolved || 'Chennai Service Area'}
            </span>
          </div>

          <div className="p-4 rounded-xl bg-white border border-stone-200 shadow-paper">
            <span className="text-[10px] font-mono uppercase tracking-wider text-stone-500 block">
              Execution Latency
            </span>
            <span className="text-xl font-mono font-bold text-stone-900">
              {result.timings?.totalMs}ms
            </span>
          </div>
        </div>
      )}

      {/* Error state */}
      {result && !result.success && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-900 text-xs font-mono">
          Diagnostic error: {result.error}
        </div>
      )}

      {/* Candidates Diagnostic Table */}
      {result && result.success && result.candidates && (
        <div className="bg-white border border-stone-200 rounded-2xl shadow-paper overflow-hidden">
          <div className="p-4 border-b border-stone-200 flex items-center justify-between bg-stone-50">
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-stone-700">
              Candidate Ranks & H1–H6 Filter Decisions ({result.candidates.length} returned)
            </h2>
            <span className="text-[11px] font-mono text-stone-500">
              Sorted by Final Stage 2 Order
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans">
              <thead className="bg-stone-100 text-stone-600 font-mono uppercase text-[10px] border-b border-stone-200">
                <tr>
                  <th className="py-3 px-4">Stage 2 Rank</th>
                  <th className="py-3 px-4">Rank Delta</th>
                  <th className="py-3 px-4">Stage 1 Rank</th>
                  <th className="py-3 px-4">Shop Name</th>
                  <th className="py-3 px-4">Expected Score</th>
                  <th className="py-3 px-4">H1-H6 Gate Breakdown</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {result.candidates.map((candidate) => {
                  const delta = candidate.rankDiff;
                  return (
                    <tr key={candidate.slug} className="hover:bg-stone-50/60 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-stone-900">
                        #{candidate.stage2Rank}
                      </td>

                      {/* Rank Delta */}
                      <td className="py-3 px-4">
                        {delta > 0 ? (
                          <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[11px] font-mono font-bold bg-[#E8F5EC] text-[#1B7F45] border border-[#BFE3CB]">
                            <ArrowUp className="w-3 h-3 stroke-[2.5]" />
                            +{delta}
                          </span>
                        ) : delta < 0 ? (
                          <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[11px] font-mono font-bold bg-[#FCEDEA] text-[#C2412D] border border-[#F2C4BC]">
                            <ArrowDown className="w-3 h-3 stroke-[2.5]" />
                            {delta}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[11px] font-mono text-stone-500 bg-stone-100 border border-stone-200">
                            <Minus className="w-3 h-3" />
                            0
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 font-mono text-stone-600">
                        #{candidate.stage1Rank}
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-semibold text-stone-900">{candidate.name}</div>
                        <div className="text-[11px] font-mono text-stone-400">
                          {candidate.locality} · {candidate.category}
                        </div>
                      </td>

                      <td className="py-3 px-4 font-mono">
                        {candidate.relevanceScore !== null ? (
                          <span className="font-bold text-marina-700">
                            {candidate.relevanceScore.toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-stone-400">N/A</span>
                        )}
                      </td>

                      {/* H1 to H6 Gates */}
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1.5">
                          {(['H1', 'H2', 'H3', 'H4', 'H5', 'H6'] as const).map((h) => {
                            const gate = candidate.hFilters[h];
                            return (
                              <span
                                key={h}
                                title={`${h}: ${gate.reason}`}
                                className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold border ${
                                  gate.passed
                                    ? 'bg-[#E8F5EC] text-[#1B7F45] border-[#BFE3CB]'
                                    : 'bg-[#FCEDEA] text-[#C2412D] border-[#F2C4BC]'
                                }`}
                              >
                                {gate.passed ? <Check className="w-2.5 h-2.5" /> : <X className="w-2.5 h-2.5" />}
                                {h}
                              </span>
                            );
                          })}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
