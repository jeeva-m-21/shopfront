import React from 'react';
import Link from 'next/link';
import { Download, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { ShutterLogo } from '@/components/brand/ShutterLogo';
import { ShutterMark } from '@/components/brand/ShutterMark';

export const metadata = {
  title: 'Brand Identity & Vector Assets • Shopfront',
  description:
    'The official Shopfront multi-view SVG logo system, typography, color tokens, and vector asset guidelines for partners, developers, and AI agents.',
};

const ASSETS = [
  {
    name: 'Master Logo System (Full Specification)',
    filename: 'logo-system.svg',
    path: '/brand/logo-system.svg',
    category: 'Master',
    description: '1920×1280 vector blueprint covering all 8 brand views, geometry, scales, and palette chips.',
  },
  {
    name: 'Primary Horizontal Lockup (Light)',
    filename: 'logo-horizontal-light.svg',
    path: '/brand/logo-horizontal-light.svg',
    category: 'Lockups',
    description: 'Standard 4:1 lockup with teal lower slats, kinetic yellow top slat, and verified dot.',
  },
  {
    name: 'Brand Core Lockup (Deep Teal)',
    filename: 'logo-horizontal-dark.svg',
    path: '/brand/logo-horizontal-dark.svg',
    category: 'Lockups',
    description: 'High-contrast hero lockup on Marina Teal (#0E6B66) with white lower slats.',
  },
  {
    name: 'Vertical Stacked Emblem',
    filename: 'logo-stacked.svg',
    path: '/brand/logo-stacked.svg',
    category: 'Lockups',
    description: 'Center-aligned square emblem for splash screens, mobile widgets, and billboards.',
  },
  {
    name: 'App Icon Squircle (Marina Teal)',
    filename: 'app-icon-teal.svg',
    path: '/brand/app-icon-teal.svg',
    category: 'Icons',
    description: '80×80 rounded squircle (r=25%) container for macOS, iOS, Android, and web touch icons.',
  },
  {
    name: 'App Icon Squircle (Pitch Night)',
    filename: 'app-icon-dark.svg',
    path: '/brand/app-icon-dark.svg',
    category: 'Icons',
    description: '80×80 OLED dark container (#100F0D) for night mode launchers and dark docks.',
  },
  {
    name: 'App Icon Squircle (Bordered Light)',
    filename: 'app-icon-white.svg',
    path: '/brand/app-icon-white.svg',
    category: 'Icons',
    description: '80×80 white surface icon with subtle warm neutral border (#E6E4DF).',
  },
  {
    name: 'Standalone Shutter Mark (Light Surface)',
    filename: 'mark-light.svg',
    path: '/brand/mark-light.svg',
    category: 'Marks',
    description: 'Isolated kinetic shutter slats (Teal #0E6B66 + Yellow #F4B000) without container.',
  },
  {
    name: 'Standalone Shutter Mark (Dark Surface)',
    filename: 'mark-dark.svg',
    path: '/brand/mark-dark.svg',
    category: 'Marks',
    description: 'Isolated kinetic shutter slats (White #FFFFFF + Yellow #F4B000) for dark surfaces.',
  },
  {
    name: 'Pure Monochrome Carbon Mark',
    filename: 'mark-mono-black.svg',
    path: '/brand/mark-mono-black.svg',
    category: 'Monochrome',
    description: '1-color print, laser engraving, and thermal receipt variant in #111817.',
  },
  {
    name: 'Pure Monochrome Inverse White',
    filename: 'mark-mono-white.svg',
    path: '/brand/mark-mono-white.svg',
    category: 'Monochrome',
    description: '100% white monochrome variant for solid ink overlays and stencil cutouts.',
  },
];

const PALETTE = [
  {
    name: 'Marina Teal (Primary)',
    hex: '#0E6B66',
    role: 'Primary buttons, active indicators, brand container, links',
    textColor: 'text-white',
    bgClass: 'bg-[#0E6B66]',
  },
  {
    name: 'Motion Turmeric (Accent)',
    hex: '#F4B000',
    role: 'Lifted kinetic top slat, verified status pings, highlights',
    textColor: 'text-stone-900',
    bgClass: 'bg-[#F4B000]',
  },
  {
    name: 'Pitch Dark (Night / OLED)',
    hex: '#100F0D',
    role: 'Dark mode card surfaces, code terminals, contrast containers',
    textColor: 'text-stone-200',
    bgClass: 'bg-[#100F0D]',
  },
  {
    name: 'Stone Canvas (Neutral)',
    hex: '#FAF9F6',
    role: 'Warm light page background, table strips, paper feel',
    textColor: 'text-stone-800',
    bgClass: 'bg-[#FAF9F6]',
    border: 'border border-stone-300',
  },
  {
    name: 'Carbon Mono (Text / Print)',
    hex: '#111817',
    role: 'High-contrast text, monochrome print production, receipts',
    textColor: 'text-white',
    bgClass: 'bg-[#111817]',
  },
];

export default function BrandPage() {
  return (
    <div className="min-h-screen bg-stone-25 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-mono text-stone-600 hover:text-marina-600 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Discovery</span>
          </Link>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full text-[11px] font-mono bg-turmeric-100 text-turmeric-700 border border-turmeric-300">
              Stitch System v2.4
            </span>
          </div>
        </div>

        {/* Hero Section */}
        <div className="border-b border-stone-200 pb-8 space-y-4">
          <div className="inline-flex items-center gap-3">
            <ShutterMark size={32} />
            <h1 className="font-display text-4xl sm:text-5xl text-stone-900 tracking-tight">
              Brand Identity &amp; Logo System
            </h1>
          </div>
          <p className="text-stone-600 text-base max-w-3xl leading-relaxed">
            The core promise of Shopfront is that a shop&apos;s real state is authentic. The identity is built on a single tactile metaphor: <strong className="text-stone-900 font-semibold">&ldquo;The shutter goes up.&rdquo;</strong> Engineered for responsive viewports, high-contrast digital surfaces, and partner AI agent integrations.
          </p>
        </div>

        {/* Master SVG Preview Card */}
        <div className="bg-white rounded-2xl border border-stone-200 p-6 sm:p-8 shadow-paper space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-100 pb-4">
            <div>
              <span className="text-[10px] font-mono font-bold tracking-widest text-marina-600 uppercase">
                Stitch Project 9729604857521333085 • Screen 3f695ce998b94eba8aa024c9d38e55d3
              </span>
              <h2 className="text-xl font-bold text-stone-900 mt-1">Master 8-View Vector Blueprint</h2>
            </div>
            <a
              href="/brand/logo-system.svg"
              download="shopfront-logo-system.svg"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-marina-600 text-white text-xs font-semibold hover:bg-marina-700 transition-colors shadow-sm self-start sm:self-auto"
            >
              <Download className="w-4 h-4" />
              <span>Download Master SVG (1920×1280)</span>
            </a>
          </div>

          <div className="rounded-xl overflow-hidden border border-stone-200 bg-stone-50">
            {/* Embedded vector preview */}
            <div className="p-4 sm:p-8 flex justify-center bg-[#FAF9F6]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/brand/screenshot.png"
                alt="Shopfront Multi-View SVG Logo System"
                className="w-full max-w-4xl h-auto rounded-lg shadow-sm border border-stone-200"
              />
            </div>
          </div>
        </div>

        {/* Core Live Components Showcase */}
        <div className="space-y-6">
          <h2 className="font-display text-2xl text-stone-900">Interactive Component Primitives</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* View 1: Horizontal Light */}
            <div className="bg-white rounded-xl border border-stone-200 p-6 flex flex-col justify-between space-y-4 shadow-paper">
              <span className="text-[11px] font-mono font-semibold text-marina-600">01 / Primary Horizontal (Light)</span>
              <div className="py-6 flex items-center justify-center bg-stone-50 rounded-lg border border-stone-100">
                <ShutterLogo size={32} showVerifiedDot={true} />
              </div>
              <div className="text-xs text-stone-500 font-mono flex items-center justify-between">
                <span>Ratio: 4:1</span>
                <a href="/brand/logo-horizontal-light.svg" download className="text-marina-600 hover:underline">
                  Download SVG
                </a>
              </div>
            </div>

            {/* View 2: Deep Teal Hero */}
            <div className="bg-[#0E6B66] text-white rounded-xl p-6 flex flex-col justify-between space-y-4 shadow-paper">
              <span className="text-[11px] font-mono font-semibold text-turmeric-400">02 / Brand Hero (Teal)</span>
              <div className="py-6 flex items-center justify-center bg-[#0B5753] rounded-lg">
                <ShutterLogo size={32} variant="hero" showVerifiedDot={true} />
              </div>
              <div className="text-xs text-marina-200 font-mono flex items-center justify-between">
                <span>Contrast: 6.3:1 AA</span>
                <a href="/brand/logo-horizontal-dark.svg" download className="text-white hover:underline">
                  Download SVG
                </a>
              </div>
            </div>

            {/* View 3: Stacked Splash */}
            <div className="bg-white rounded-xl border border-stone-200 p-6 flex flex-col justify-between space-y-4 shadow-paper">
              <span className="text-[11px] font-mono font-semibold text-marina-600">03 / Stacked Emblem (Splash)</span>
              <div className="py-4 flex items-center justify-center bg-stone-50 rounded-lg border border-stone-100">
                <ShutterLogo size={28} variant="stacked" showVerifiedDot={true} subtitle="LIVE DATA ENGINE" />
              </div>
              <div className="text-xs text-stone-500 font-mono flex items-center justify-between">
                <span>Ratio: 1:1 Square</span>
                <a href="/brand/logo-stacked.svg" download className="text-marina-600 hover:underline">
                  Download SVG
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Kinetic Geometry & Construction Rules */}
        <div className="bg-white rounded-2xl border border-stone-200 p-6 sm:p-8 space-y-6 shadow-paper">
          <h2 className="font-display text-2xl text-stone-900">Kinetic Blueprint &amp; Geometry</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="space-y-4 text-sm text-stone-600">
              <p>
                The shutter mark is constructed on a 4px modular grid with mathematical precision:
              </p>
              <ul className="space-y-2.5 font-mono text-xs">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-marina-600 mt-0.5 shrink-0" />
                  <span><strong>15% Golden Ratio Motion Offset:</strong> Top slat is shifted rightward by Δx = +15% and lifted Δy = -8px to visually signify an open, active roll-shutter.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-marina-600 mt-0.5 shrink-0" />
                  <span><strong>Pill Radii:</strong> Corner radius equals exactly 50% of slat height (rx = 5px on 10px slats) for soft, organic tactile feel.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-marina-600 mt-0.5 shrink-0" />
                  <span><strong>Squircle Curvature:</strong> Application containers utilize continuous curvature squircles (rx = 25% container dimension).</span>
                </li>
              </ul>
            </div>
            <div className="bg-[#FAF9F6] p-6 rounded-xl border border-stone-200 flex flex-col items-center justify-center gap-4">
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-2xl bg-[#0E6B66] flex items-center justify-center shadow-sm">
                    <ShutterMark size={36} variant="mark-dark" />
                  </div>
                  <span className="text-[10px] font-mono text-stone-500 mt-2 block">Teal Squircle</span>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 rounded-2xl bg-[#100F0D] flex items-center justify-center shadow-sm">
                    <ShutterMark size={36} variant="mark-dark" />
                  </div>
                  <span className="text-[10px] font-mono text-stone-500 mt-2 block">Night Squircle</span>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 rounded-2xl bg-white border border-stone-200 flex items-center justify-center shadow-sm">
                    <ShutterMark size={36} variant="mark-light" />
                  </div>
                  <span className="text-[10px] font-mono text-stone-500 mt-2 block">White Squircle</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Color Palette Specification */}
        <div className="space-y-6">
          <h2 className="font-display text-2xl text-stone-900">Official Color Tokens</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {PALETTE.map((c) => (
              <div
                key={c.hex}
                className={`rounded-xl p-5 flex flex-col justify-between h-44 shadow-paper ${c.bgClass} ${c.border ?? ''}`}
              >
                <div>
                  <span className={`text-[11px] font-mono font-bold block ${c.textColor}`}>{c.hex}</span>
                  <h4 className={`text-sm font-bold mt-1 ${c.textColor}`}>{c.name}</h4>
                </div>
                <p className={`text-[11px] leading-tight ${c.textColor} opacity-90 font-sans`}>
                  {c.role}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Downloadable Assets Directory */}
        <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-paper">
          <div className="p-6 border-b border-stone-100 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-stone-900">Vector Asset Library</h2>
              <p className="text-xs text-stone-500 font-mono mt-0.5">
                Ready-to-use SVG files optimized for web, iOS, Android, and vector print.
              </p>
            </div>
          </div>

          <div className="divide-y divide-stone-100">
            {ASSETS.map((asset) => (
              <div
                key={asset.filename}
                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-stone-50 transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-stone-900">{asset.name}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-stone-100 text-stone-600 border border-stone-200">
                      {asset.category}
                    </span>
                  </div>
                  <p className="text-xs text-stone-500">{asset.description}</p>
                  <code className="text-[11px] text-stone-400 font-mono">{asset.path}</code>
                </div>

                <div className="flex items-center gap-3">
                  <a
                    href={asset.path}
                    download={asset.filename}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-300 text-xs font-medium text-stone-700 bg-white hover:bg-stone-100 transition-colors shadow-sm"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download SVG</span>
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer info */}
        <div className="pt-6 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-stone-500">
          <p>© {new Date().getFullYear()} Shopfront Chennai. Designed for clarity, speed, and authentic local truth.</p>
          <Link href="/connect" className="text-marina-600 hover:underline">
            Connect AI Agents via MCP →
          </Link>
        </div>
      </div>
    </div>
  );
}
