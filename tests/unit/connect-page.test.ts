import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import nextConfig from '../../next.config.mjs';
import { ConnectInterface } from '../../src/app/connect/ConnectInterface';

describe('Connect & Developer Onboarding (SPRINT-10.2)', () => {
  it('defines 301 permanent redirect from /developers to /connect in next.config.mjs', async () => {
    expect(nextConfig.redirects).toBeDefined();
    if (typeof nextConfig.redirects === 'function') {
      const redirects = await nextConfig.redirects();
      const devRedirect = redirects.find((r: { source: string }) => r.source === '/developers');
      expect(devRedirect).toBeDefined();
      expect(devRedirect?.destination).toBe('/connect');
      expect(devRedirect?.permanent).toBe(true);
    }
  });

  it('renders ConnectInterface with client tabs, prompt chips, and tool references', () => {
    const html = renderToStaticMarkup(
      React.createElement(ConnectInterface, { baseUrl: 'https://shopfront-rouge.vercel.app' })
    );

    // Headline & Brand
    expect(html).toContain('Connect Shopfront to Your AI Agent in 60 Seconds');
    expect(html).toContain('io.github.jeeva-m-21/shopfront');

    // Client tabs
    expect(html).toContain('Claude Desktop');
    expect(html).toContain('Claude Code CLI');
    expect(html).toContain('Cursor IDE');
    expect(html).toContain('VS Code (Cline / Roo)');

    // Live Ping button
    expect(html).toContain('Ping MCP Server');

    // Prompt chips
    expect(html).toContain('MacBook screen repair in Adyar');
    expect(html).toContain('Emergency iPhone battery replacement in Anna Nagar');

    // Tool reference
    expect(html).toContain('find_shops');
    expect(html).toContain('get_shop_info');
    expect(html).toContain('get_catalog');
    expect(html).toContain('search_catalog');
    expect(html).toContain('get_action_link');
  });
});
