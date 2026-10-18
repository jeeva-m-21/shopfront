import React from 'react';
import Link from 'next/link';
import { Store, Terminal } from 'lucide-react';
import { Badge } from './ui/badge.js';

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand & mission */}
          <div className="md:col-span-1 space-y-4">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center text-white font-bold">
                <Store className="w-4 h-4" />
              </div>
              <span className="text-lg font-bold text-slate-900 tracking-tight">Shopfront</span>
            </Link>
            <p className="text-sm text-slate-600 leading-relaxed">
              Chennai&apos;s open hyperlocal merchant discovery and agent commerce engine. Connecting verified neighborhood stores with humans and AI agents.
            </p>
            <div className="flex items-center gap-2 pt-1">
              <Badge variant="success" className="text-[11px]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live in 32 Localities
              </Badge>
            </div>
          </div>

          {/* Consumers */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-900 mb-4">
              For Customers
            </h4>
            <ul className="space-y-2.5 text-sm text-slate-600">
              <li>
                <Link href="/?category=repair_service" className="hover:text-brand-600 transition-colors">
                  Mobile & Laptop Repairs
                </Link>
              </li>
              <li>
                <Link href="/?category=salon_wellness" className="hover:text-brand-600 transition-colors">
                  Salons & Wellness
                </Link>
              </li>
              <li>
                <Link href="/?category=food_beverage" className="hover:text-brand-600 transition-colors">
                  Cafes & Dining
                </Link>
              </li>
              <li>
                <Link href="/#localities" className="hover:text-brand-600 transition-colors">
                  All 32 Chennai Localities
                </Link>
              </li>
            </ul>
          </div>

          {/* Merchants */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-900 mb-4">
              For Merchants
            </h4>
            <ul className="space-y-2.5 text-sm text-slate-600">
              <li>
                <Link href="/for-merchants" className="hover:text-brand-600 transition-colors font-medium text-brand-700">
                  Join Pilot (Zero Commission)
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-brand-600 transition-colors">
                  Merchant Portal Login
                </Link>
              </li>
              <li>
                <Link href="/for-merchants#faq" className="hover:text-brand-600 transition-colors">
                  Merchant Onboarding FAQ
                </Link>
              </li>
              <li>
                <Link href="/admin" className="hover:text-brand-600 transition-colors">
                  Admin Portal
                </Link>
              </li>
            </ul>
          </div>

          {/* Developers & Protocol */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-900 mb-4">
              AI Agents & Developers
            </h4>
            <ul className="space-y-2.5 text-sm text-slate-600">
              <li>
                <Link href="/developers" className="hover:text-brand-600 transition-colors flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-slate-400" />
                  <span>Interactive MCP Playground</span>
                </Link>
              </li>
              <li>
                <Link href="/developers#claude" className="hover:text-brand-600 transition-colors">
                  Claude Desktop Setup
                </Link>
              </li>
              <li>
                <Link href="/developers#cursor" className="hover:text-brand-600 transition-colors">
                  Cursor & MCP Remote
                </Link>
              </li>
              <li>
                <a
                  href="/api/health"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-brand-600 transition-colors text-xs text-slate-500 font-mono"
                >
                  Health Probe: /api/health
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-8 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>
            &copy; {new Date().getFullYear()} Shopfront Technologies. Open hyperlocal commerce for Chennai.
          </p>
          <p className="max-w-md text-center sm:text-right text-[11px] text-slate-400">
            Disclaimer: Shopfront connects customers directly with independent merchants via WhatsApp and phone; not an automated booking or transaction agent.
          </p>
        </div>
      </div>
    </footer>
  );
}
