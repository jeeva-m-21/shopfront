'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Store, Code2, Menu, X, ArrowRight } from 'lucide-react';
import { Button } from './ui/button.js';
import { Badge } from './ui/badge.js';

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200/80 bg-white/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Brand Logo */}
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-700 to-brand-500 flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform">
                <Store className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="text-xl font-bold tracking-tight text-slate-900 group-hover:text-brand-700 transition-colors">
                    Shopfront
                  </span>
                  <Badge variant="brand" className="hidden sm:inline-flex text-[10px] py-0 px-2">
                    Chennai Live
                  </Badge>
                </div>
                <span className="text-[10px] text-slate-500 font-medium -mt-1 hidden sm:block">
                  Hyperlocal Commerce & MCP Protocol
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            <Link
              href="/"
              className="hover:text-brand-600 transition-colors py-1"
            >
              Discover Shops
            </Link>
            <Link
              href="/for-merchants"
              className="hover:text-brand-600 transition-colors py-1 flex items-center gap-1.5"
            >
              <Store className="w-4 h-4 text-brand-600" />
              <span>For Merchants</span>
              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-semibold px-1.5 py-0.2 rounded-full">
                0% Fee
              </span>
            </Link>
            <Link
              href="/developers"
              className="hover:text-brand-600 transition-colors py-1 flex items-center gap-1.5"
            >
              <Code2 className="w-4 h-4 text-slate-500" />
              <span>Developers & MCP</span>
            </Link>
          </nav>

          {/* Action Buttons */}
          <div className="hidden sm:flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm">
                Owner Login
              </Button>
            </Link>
            <Link href="/for-merchants">
              <Button variant="primary" size="sm">
                <span>List Your Business</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </Link>
          </div>

          {/* Mobile menu trigger */}
          <div className="flex md:hidden">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:outline-none"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu panel */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-200 bg-white px-4 pt-3 pb-5 space-y-3 shadow-lg">
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-base font-medium text-slate-700 hover:bg-slate-50"
          >
            Discover Shops
          </Link>
          <Link
            href="/for-merchants"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-base font-medium text-slate-700 hover:bg-slate-50"
          >
            For Merchants (0% Commission)
          </Link>
          <Link
            href="/developers"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-base font-medium text-slate-700 hover:bg-slate-50"
          >
            Developers & MCP Playground
          </Link>
          <div className="pt-3 border-t border-slate-200 flex flex-col gap-2">
            <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="outline" size="md" className="w-full">
                Owner / Admin Login
              </Button>
            </Link>
            <Link href="/for-merchants" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="primary" size="md" className="w-full">
                List Your Business Free
              </Button>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
