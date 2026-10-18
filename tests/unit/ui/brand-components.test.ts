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

    it('supports standalone mark-light, mark-dark and monochrome variants from Stitch system', () => {
      const light = renderToStaticMarkup(React.createElement(ShutterMark, { variant: 'mark-light' }));
      expect(light).toContain('viewBox="0 0 76 64"');
      expect(light).toContain('#0E6B66');
      expect(light).toContain('#F4B000');

      const dark = renderToStaticMarkup(React.createElement(ShutterMark, { variant: 'mark-dark' }));
      expect(dark).toContain('viewBox="0 0 76 64"');
      expect(dark).toContain('#FFFFFF');
      expect(dark).toContain('#F4B000');

      const monoWhite = renderToStaticMarkup(React.createElement(ShutterMark, { variant: 'mono-white' }));
      expect(monoWhite).toContain('#FFFFFF');

      const monoBlack = renderToStaticMarkup(React.createElement(ShutterMark, { variant: 'mono-black' }));
      expect(monoBlack).toContain('#111817');

      const squircleWhite = renderToStaticMarkup(React.createElement(ShutterMark, { variant: 'squircle-white' }));
      expect(squircleWhite).toContain('stroke="#E6E4DF"');
    });
  });

  describe('ShutterLogo', () => {
    it('renders the shutter mark alongside the lowercase shopfront wordmark', () => {
      const html = renderToStaticMarkup(React.createElement(ShutterLogo));
      expect(html).toContain('shopfront');
      expect(html).toContain('<svg');
    });

    it('renders verified dot badge and stacked emblem variant', () => {
      const withDot = renderToStaticMarkup(React.createElement(ShutterLogo, { showVerifiedDot: true }));
      expect(withDot).toContain('bg-turmeric-500');

      const stacked = renderToStaticMarkup(
        React.createElement(ShutterLogo, { variant: 'stacked', subtitle: 'LIVE DATA ENGINE' })
      );
      expect(stacked).toContain('LIVE DATA ENGINE');
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
