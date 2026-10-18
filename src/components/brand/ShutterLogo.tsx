import React from 'react';
import Link from 'next/link';
import { ShutterMark } from './ShutterMark';

export interface ShutterLogoProps {
  size?: number;
  href?: string;
  className?: string;
  showTamilSubtitle?: boolean;
}

export function ShutterLogo({
  size = 28,
  href = '/',
  className = '',
  showTamilSubtitle = false,
}: ShutterLogoProps) {
  const content = (
    <div className={`inline-flex items-center gap-2.5 group ${className}`}>
      <div className="transition-transform duration-200 group-hover:-translate-y-0.5">
        <ShutterMark size={size} />
      </div>
      <div className="flex flex-col">
        <span className="font-display text-2xl font-normal tracking-[-0.02em] text-stone-900 leading-none">
          shopfront
        </span>
        {showTamilSubtitle && (
          <span className="font-tamil text-[10px] text-stone-500 tracking-normal leading-none mt-0.5">
            ஷாப்ஃபிரண்ட் · சென்னை
          </span>
        )}
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex items-center focus:outline-none focus:ring-2 focus:ring-marina-600 rounded-lg">
        {content}
      </Link>
    );
  }

  return content;
}
