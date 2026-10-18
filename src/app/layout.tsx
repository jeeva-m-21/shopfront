import type { Metadata } from 'next';
import React from 'react';
import './globals.css';
import { fontVariables } from './fonts';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';

export const metadata: Metadata = {
  title: 'Shopfront — Chennai Hyperlocal Commerce & MCP Directory',
  description:
    'Verified local shops, live IST opening hours, and honest menus across 32 Chennai localities. Connect directly via WhatsApp with zero commission fees.',
  keywords: [
    'Chennai local shops',
    'Chennai repair services',
    'Adyar iPhone repair',
    'Chennai salons',
    'Model Context Protocol',
    'MCP server Chennai',
  ],
  icons: {
    icon: '/icon.svg',
    apple: '/icon.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={fontVariables}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body className="min-h-screen flex flex-col bg-stone-25 text-stone-900 font-sans antialiased selection:bg-turmeric-100 selection:text-stone-900">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
