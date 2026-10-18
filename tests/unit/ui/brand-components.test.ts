import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ShutterMark } from '@/components/brand/ShutterMark';
import { ShutterLogo } from '@/components/brand/ShutterLogo';
import { StatusChip } from '@/components/brand/StatusChip';
import { VerifiedBadge } from '@/components/brand/VerifiedBadge';

describe('Brand & UI Component Primitives', () => {
  describe('ShutterMark', () => {
    it('renders the SVG shutter-slat mark with exact specified colors', () => {
      const html = renderToStaticMarkup(React.createElement(ShutterMark, { size: 24 }));
      expect(html).toContain('<svg');
      expect(html).toContain('viewBox="0 0 24 24"');
      // Container Marina 600
      expect(html).toContain('#0E6B66');
      // Top slat Turmeric 500
      expect(html).toContain('#F4B000');
      // Lower slats White
      expect(html).toContain('#FFFFFF');
    });

    it('supports custom size and dark mode variant', () => {
      const html = renderToStaticMarkup(React.createElement(ShutterMark, { size: 32, dark: true }));
      expect(html).toContain('width="32"');
      expect(html).toContain('height="32"');
    });
  });

  describe('ShutterLogo', () => {
    it('renders the shutter mark alongside the lowercase shopfront wordmark', () => {
      const html = renderToStaticMarkup(React.createElement(ShutterLogo));
      expect(html).toContain('shopfront');
      expect(html).toContain('<svg');
    });
  });

  describe('StatusChip', () => {
    it('renders open status with pulsing indicator dot and accessible label', () => {
      const html = renderToStaticMarkup(React.createElement(StatusChip, { status: 'open' }));
      expect(html).toContain('Open now');
      expect(html).toContain('animate-pulse');
    });

    it('renders closed status with static dot', () => {
      const html = renderToStaticMarkup(React.createElement(StatusChip, { status: 'closed' }));
      expect(html).toContain('Closed');
      expect(html).not.toContain('animate-pulse');
    });

    it('renders break status with return time if provided', () => {
      const html = renderToStaticMarkup(
        React.createElement(StatusChip, { status: 'break', returnTime: '4:00 PM' })
      );
      expect(html).toContain('Back at 4:00 PM');
    });
  });

  describe('VerifiedBadge', () => {
    it('renders verified icon and relative timestamp', () => {
      const html = renderToStaticMarkup(
        React.createElement(VerifiedBadge, { verifiedText: 'verified 9m ago' })
      );
      expect(html).toContain('Verified');
      expect(html).toContain('verified 9m ago');
    });
  });
});
