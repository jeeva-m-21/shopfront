import React from 'react';
import type { Metadata } from 'next';
import { requireAdmin } from '../../../auth/guards.js';
import { SearchDebuggerInterface } from './SearchDebuggerInterface';

export const metadata: Metadata = {
  title: 'Two-Stage Search Engine Debugger — Shopfront Admin',
  description: 'Inspect PostGIS SQL candidate filtering and Jev Decisions semantic reranker decisions.',
};

export default async function AdminSearchDebuggerPage() {
  await requireAdmin();

  return <SearchDebuggerInterface />;
}
