import React from 'react';
import type { Metadata } from 'next';
import { ConnectInterface } from './ConnectInterface';

export const metadata: Metadata = {
  title: 'Connect AI Agents to Shopfront (Claude Desktop, Cursor, MCP)',
  description:
    'Onboard Claude Desktop, Claude Code, Cursor, or your AI agents to Chennai hyperlocal merchants in under 60 seconds with our official Model Context Protocol server.',
  alternates: {
    canonical: '/connect',
  },
};

export default function ConnectPage() {
  const baseUrl = process.env.APP_BASE_URL || 'https://shopfront-rouge.vercel.app';

  return <ConnectInterface baseUrl={baseUrl} />;
}
