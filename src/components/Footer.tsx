import React from 'react';
import Link from 'next/link';
import { ShutterLogo } from './brand/ShutterLogo';

export function Footer() {
  return (
    <footer className="border-t border-stone-200 bg-stone-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand & mission */}
          <div className="md:col-span-1 space-y-4">
            <ShutterLogo size={26} showTamilSubtitle={true} />
            <p className="text-xs text-stone-600 leading-relaxed font-sans">
              Chennai&apos;s open hyperlocal merchant discovery and agent commerce engine. Connecting verified neighborhood stores with humans and AI agents.
            </p>
            <div className="flex items-center gap-2 pt-1">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono bg-stone-100 text-stone-700 border border-stone-200">
                <span className="w-1.5 h-1.5 rounded-full bg-status-open animate-pulse" />
                Live in 32 Localities
              </span>
            </div>
          </div>

          {/* Consumers */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-900 mb-4 font-mono">
              For Customers
            </h4>
            <ul className="space-y-2.5 text-xs text-stone-600">
              <li>
                <Link href="/?category=repair_service" className="hover:text-marina-600 transition-colors">
                  Mobile & Laptop Repairs
                </Link>
              </li>
              <li>
                <Link href="/?category=salon_wellness" className="hover:text-marina-600 transition-colors">
                  Salons & Wellness
                </Link>
              </li>
              <li>
                <Link href="/?category=food_beverage" className="hover:text-marina-600 transition-colors">
                  Cafes & Dining
                </Link>
              </li>
              <li>
                <Link href="/#localities" className="hover:text-marina-600 transition-colors">
                  All 32 Chennai Localities
                </Link>
              </li>
            </ul>
          </div>

          {/* Merchants */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-900 mb-4 font-mono">
              For Merchants
            </h4>
            <ul className="space-y-2.5 text-xs text-stone-600">
              <li>
                <Link href="/for-merchants" className="hover:text-marina-600 transition-colors font-medium text-stone-800">
                  Join Pilot (0% Commission)
                </Link>
              </li>
              <li>
                <Link href="/owner" className="hover:text-marina-600 transition-colors">
                  Shop Owner Portal
                </Link>
              </li>
              <li>
                <a
                  href="https://wa.me/919840012345?text=Hello%20Shopfront%2C%20I%20want%20to%20list%20my%20Chennai%20shop"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-marina-600 transition-colors"
                >
                  Direct WhatsApp Support
                </a>
              </li>
            </ul>
          </div>

          {/* Developers & Protocol */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-900 mb-4 font-mono">
              AI Agents & MCP
            </h4>
            <ul className="space-y-2.5 text-xs text-stone-600">
              <li>
                <Link href="/connect" className="hover:text-marina-600 transition-colors">
                  Connect MCP (Claude / Cursor)
                </Link>
              </li>
              <li>
                <Link href="/brand" className="hover:text-marina-600 transition-colors">
                  Brand Assets &amp; Logo System
                </Link>
              </li>
              <li>
                <a
                  href="/mcp"
                  target="_blank"
                  rel="noreferrer"
                  className="font-mono text-[11px] hover:text-marina-600 transition-colors"
                >
                  POST /mcp (Streamable HTTP)
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/jeeva-m-21/shopfront"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-marina-600 transition-colors"
                >
                  GitHub Repository
                </a>
              </li>
              <li>
                <Link href="/login" className="hover:text-stone-900 transition-colors">
                  Admin Sign In
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-500 font-mono">
          <p>© {new Date().getFullYear()} Shopfront Chennai. Made for humans and AI agents.</p>
          <div className="flex items-center gap-4">
            <span>Built with PostGIS & MCP</span>
            <span>·</span>
            <span>Asia/Kolkata (IST)</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
