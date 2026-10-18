import React from 'react';
import Link from 'next/link';
import { ShutterMark } from './ShutterMark';

export interface ShutterLogoProps {
  size?: number;
  href?: string;
  className?: string;
  showTamilSubtitle?: boolean;
  showVerifiedDot?: boolean;
  subtitle?: string;
  variant?: 'light' | 'dark' | 'hero' | 'stacked';
}

export function ShutterLogo({
  size = 28,
  href = '/',
  className = '',
  showTamilSubtitle = false,
  showVerifiedDot = false,
  subtitle,
  variant = 'light',
}: ShutterLogoProps) {
  const isDarkSurface = variant === 'dark' || variant === 'hero';
  const isStacked = variant === 'stacked';

  const markVariant =
    variant === 'dark'
      ? 'squircle-dark'
      : variant === 'hero'
        ? 'mark-dark'
        : 'squircle-teal';

  const content = isStacked ? (
    <div className={`inline-flex flex-col items-center text-center gap-3 group ${className}`}>
      <div className="transition-transform duration-200 group-hover:-translate-y-1">
        <ShutterMark size={size * 1.5} variant="mark-light" />
      </div>
      <div className="flex flex-col items-center">
        <div className="inline-flex items-center">
          <span className="font-display text-3xl font-normal tracking-[-0.02em] text-stone-900 leading-none">
            shopfront
          </span>
          {showVerifiedDot && (
            <span
              className="inline-block w-2 h-2 rounded-full bg-turmeric-500 ml-1.5 -mt-2 animate-pulse"
              aria-label="Verified real-time system"
            />
          )}
        </div>
        <span className="font-mono text-[11px] font-semibold tracking-[0.1em] text-marina-600 uppercase mt-1">
          {subtitle ?? 'Live Data Engine'}
        </span>
      </div>
    </div>
  ) : (
    <div className={`inline-flex items-center gap-2.5 group ${className}`}>
      <div className="transition-transform duration-200 group-hover:-translate-y-0.5">
        <ShutterMark size={size} variant={markVariant} dark={isDarkSurface} />
      </div>
      <div className="flex flex-col">
        <div className="inline-flex items-center">
          <span
            className={`font-display text-2xl font-normal tracking-[-0.02em] leading-none ${
              isDarkSurface ? 'text-white' : 'text-stone-900'
            }`}
          >
            shopfront
          </span>
          {showVerifiedDot && (
            <span
              className="inline-block w-2 h-2 rounded-full bg-turmeric-500 ml-1 -mt-2.5 shadow-sm"
              aria-label="Verified real-time system"
            />
          )}
        </div>
        {subtitle ? (
          <span
            className={`font-mono text-[10px] tracking-normal leading-none mt-0.5 ${
              isDarkSurface ? 'text-marina-200' : 'text-stone-500'
            }`}
          >
            {subtitle}
          </span>
        ) : showTamilSubtitle ? (
          <span className="font-tamil text-[10px] text-stone-500 tracking-normal leading-none mt-0.5">
            ஷாப்ஃபிரண்ட் · சென்னை
          </span>
        ) : null}
      </div>
    </div>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="inline-flex items-center focus:outline-none focus:ring-2 focus:ring-marina-600 rounded-lg"
      >
        {content}
      </Link>
    );
  }

  return content;
}
