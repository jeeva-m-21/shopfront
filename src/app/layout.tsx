import type { Metadata } from 'next';
import React from 'react';
import './globals.css';
import { Navbar } from '../components/Navbar.js';
import { Footer } from '../components/Footer.js';

export const metadata: Metadata = {
  title: 'Shopfront — Chennai Hyperlocal Commerce & MCP Directory',
  description:
    'Discover verified local shops, services, and menus across 32 Chennai localities. Connect directly via WhatsApp with zero commission fees.',
  keywords: [
    'Chennai local shops',
    'Chennai repair services',
    'Adyar iPhone repair',
    'Chennai salons',
    'Model Context Protocol',
    'MCP server Chennai',
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body className="min-h-screen flex flex-col bg-surface-50 text-slate-900 antialiased">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
