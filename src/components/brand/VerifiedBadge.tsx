import React from 'react';
import { Check } from 'lucide-react';

export interface VerifiedBadgeProps {
  verifiedText?: string;
  className?: string;
  showIcon?: boolean;
}

export function VerifiedBadge({
  verifiedText = 'verified',
  className = '',
  showIcon = true,
}: VerifiedBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 text-[11px] font-mono text-stone-600 ${className}`}
      title="Verified physical business in Chennai"
    >
      {showIcon && (
        <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-marina-50 border border-marina-200 text-marina-600">
          <Check className="w-2.5 h-2.5 stroke-[2.5]" />
        </span>
      )}
      <span className="font-sans font-medium text-stone-700">Verified</span>
      {verifiedText && (
        <span className="text-stone-400">· {verifiedText}</span>
      )}
    </span>
  );
}
