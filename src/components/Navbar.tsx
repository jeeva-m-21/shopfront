'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Menu, X, ArrowUpRight } from 'lucide-react';
import { ShutterLogo } from './brand/ShutterLogo';

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-stone-200/90 bg-stone-25/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Brand Logo */}
          <div className="flex items-center gap-3">
            <ShutterLogo size={26} showTamilSubtitle={false} showVerifiedDot={true} />
            <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-turmeric-100 text-turmeric-700 border border-turmeric-300">
              Chennai IST
            </span>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-stone-600">
            <Link
              href="/"
              className="hover:text-marina-600 transition-colors py-1"
            >
              Discover
            </Link>
            <Link
              href="/connect"
              className="hover:text-marina-600 transition-colors py-1 flex items-center gap-1.5"
            >
              <span>Connect</span>
              <span className="bg-marina-50 text-marina-700 border border-marina-200 text-[10px] font-mono px-1.5 py-0.5 rounded">
                MCP
              </span>
            </Link>
            <Link
              href="/brand"
              className="hover:text-marina-600 transition-colors py-1"
            >
              Brand
            </Link>
            <Link
              href="/for-merchants"
              className="hover:text-marina-600 transition-colors py-1 flex items-center gap-1.5"
            >
              <span>For Merchants</span>
              <span className="bg-turmeric-50 text-turmeric-700 text-[10px] font-semibold px-1.5 py-0.5 rounded-full">
                0% Fee
              </span>
            </Link>
            <Link
              href="/login"
              className="hover:text-stone-900 transition-colors py-1 text-stone-500"
            >
              Portal Login
            </Link>
          </nav>

          {/* Actions */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/connect"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded-lg bg-marina-600 text-white hover:bg-marina-700 transition-colors shadow-paper"
            >
              <span>Connect Agent</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-stone-600 hover:text-stone-900 hover:bg-stone-100 focus:outline-none"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-stone-200 bg-stone-50 px-4 pt-3 pb-6 space-y-3">
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm font-medium text-stone-700 hover:text-marina-600 py-1.5"
          >
            Discover Shops
          </Link>
          <Link
            href="/connect"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center justify-between text-sm font-medium text-stone-700 hover:text-marina-600 py-1.5"
          >
            <span>Connect MCP</span>
            <span className="bg-marina-50 text-marina-700 text-[10px] font-mono px-1.5 py-0.5 rounded">
              v2.0.0
            </span>
          </Link>
          <Link
            href="/brand"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm font-medium text-stone-700 hover:text-marina-600 py-1.5"
          >
            Brand Assets
          </Link>
          <Link
            href="/for-merchants"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center justify-between text-sm font-medium text-stone-700 hover:text-marina-600 py-1.5"
          >
            <span>For Merchants</span>
            <span className="bg-turmeric-100 text-turmeric-700 text-[10px] font-semibold px-2 py-0.5 rounded-full">
              0% Fee
            </span>
          </Link>
          <Link
            href="/login"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm font-medium text-stone-600 hover:text-stone-900 py-1.5"
          >
            Sign In (Admin / Owner)
          </Link>
          <div className="pt-2">
            <Link
              href="/connect"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-semibold rounded-lg bg-marina-600 text-white hover:bg-marina-700"
            >
              <span>Connect AI Agent</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
