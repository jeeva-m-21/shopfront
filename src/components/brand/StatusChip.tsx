import React from 'react';

export type ShopStatusType = 'open' | 'closed' | 'break' | 'stale' | 'draft' | 'paused' | 'live';

export interface StatusChipProps {
  status: ShopStatusType;
  returnTime?: string | null;
  className?: string;
  size?: 'sm' | 'md';
}

export function StatusChip({
  status,
  returnTime,
  className = '',
  size = 'md',
}: StatusChipProps) {
  const isSmall = size === 'sm';

  switch (status) {
    case 'open':
    case 'live':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-[#E8F5EC] text-[#1B7F45] border border-[#BFE3CB] ${
            isSmall ? 'text-xs px-2 py-0.5' : 'text-xs px-2.5 py-1'
          } ${className}`}
        >
          <span className="relative flex h-2 w-2" aria-hidden="true">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#1B7F45] opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#1B7F45] animate-pulse" />
          </span>
          <span>Open now</span>
        </span>
      );

    case 'closed':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-[#FCEDEA] text-[#C2412D] border border-[#F2C4BC] ${
            isSmall ? 'text-xs px-2 py-0.5' : 'text-xs px-2.5 py-1'
          } ${className}`}
        >
          <span className="h-2 w-2 rounded-full bg-[#C2412D]" aria-hidden="true" />
          <span>Closed</span>
        </span>
      );

    case 'break':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-[#FFF3D6] text-[#8A5A00] border border-[#F5D78A] ${
            isSmall ? 'text-xs px-2 py-0.5' : 'text-xs px-2.5 py-1'
          } ${className}`}
        >
          <span className="h-2 w-2 rounded-full bg-[#F4B000]" aria-hidden="true" />
          <span>{returnTime ? `Back at ${returnTime}` : 'On Break'}</span>
        </span>
      );

    case 'paused':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-[#FCEDEA] text-[#C2412D] border border-[#F2C4BC] ${
            isSmall ? 'text-xs px-2 py-0.5' : 'text-xs px-2.5 py-1'
          } ${className}`}
        >
          <span className="h-2 w-2 rounded-full bg-[#C2412D]" aria-hidden="true" />
          <span>Paused</span>
        </span>
      );

    case 'draft':
    case 'stale':
    default:
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-[#F3F1EC] text-[#7D786D] border border-[#D3CFC4] ${
            isSmall ? 'text-xs px-2 py-0.5' : 'text-xs px-2.5 py-1'
          } ${className}`}
        >
          <span className="h-2 w-2 rounded-full bg-[#A8A398]" aria-hidden="true" />
          <span>{status === 'draft' ? 'Draft' : 'Unverified'}</span>
        </span>
      );
  }
}
