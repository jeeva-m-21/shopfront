import React from 'react';

export interface ShutterMarkProps {
  size?: number;
  className?: string;
  dark?: boolean;
}

export function ShutterMark({ size = 24, className = '', dark = false }: ShutterMarkProps) {
  const containerFill = dark ? '#0A4542' : '#0E6B66';
  const topSlatFill = '#F4B000';
  const lowerSlatFill = dark ? '#FFEFC2' : '#FFFFFF';

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <rect width="24" height="24" rx="6" fill={containerFill} />
      <rect x="9" y="6" width="9" height="2" rx="1" fill={topSlatFill} />
      <rect x="6" y="11" width="12" height="2" rx="1" fill={lowerSlatFill} />
      <rect x="6" y="16" width="12" height="2" rx="1" fill={lowerSlatFill} />
    </svg>
  );
}
