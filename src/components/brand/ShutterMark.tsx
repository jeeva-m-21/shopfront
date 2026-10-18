import React from 'react';

export type ShutterMarkVariant =
  | 'squircle-teal'
  | 'squircle-dark'
  | 'squircle-white'
  | 'mark-light'
  | 'mark-dark'
  | 'mono-white'
  | 'mono-black';

export interface ShutterMarkProps {
  size?: number;
  className?: string;
  dark?: boolean;
  variant?: ShutterMarkVariant;
}

export function ShutterMark({
  size = 24,
  className = '',
  dark = false,
  variant,
}: ShutterMarkProps) {
  // If variant is not explicitly set, derive from dark flag
  const effectiveVariant: ShutterMarkVariant =
    variant ?? (dark ? 'squircle-dark' : 'squircle-teal');

  if (effectiveVariant === 'mark-light') {
    return (
      <svg
        width={size}
        height={(size * 64) / 76}
        viewBox="0 0 76 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        aria-hidden="true"
      >
        <rect x="6" y="44" width="56" height="10" rx="5" fill="#0E6B66" />
        <rect x="6" y="27" width="56" height="10" rx="5" fill="#0E6B66" />
        <rect x="14" y="10" width="56" height="10" rx="5" fill="#F4B000" />
      </svg>
    );
  }

  if (effectiveVariant === 'mark-dark') {
    return (
      <svg
        width={size}
        height={(size * 64) / 76}
        viewBox="0 0 76 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        aria-hidden="true"
      >
        <rect x="6" y="44" width="56" height="10" rx="5" fill="#FFFFFF" />
        <rect x="6" y="27" width="56" height="10" rx="5" fill="#FFFFFF" />
        <rect x="14" y="10" width="56" height="10" rx="5" fill="#F4B000" />
      </svg>
    );
  }

  if (effectiveVariant === 'mono-white') {
    return (
      <svg
        width={size}
        height={(size * 64) / 76}
        viewBox="0 0 76 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        aria-hidden="true"
      >
        <rect x="6" y="44" width="56" height="10" rx="5" fill="#FFFFFF" />
        <rect x="6" y="27" width="56" height="10" rx="5" fill="#FFFFFF" />
        <rect x="14" y="10" width="56" height="10" rx="5" fill="#FFFFFF" fillOpacity="0.88" />
      </svg>
    );
  }

  if (effectiveVariant === 'mono-black') {
    return (
      <svg
        width={size}
        height={(size * 64) / 76}
        viewBox="0 0 76 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        aria-hidden="true"
      >
        <rect x="6" y="44" width="56" height="10" rx="5" fill="#111817" />
        <rect x="6" y="27" width="56" height="10" rx="5" fill="#111817" />
        <rect x="14" y="10" width="56" height="10" rx="5" fill="#111817" fillOpacity="0.75" />
      </svg>
    );
  }

  if (effectiveVariant === 'squircle-white') {
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
        <rect width="24" height="24" rx="6" fill="#FFFFFF" stroke="#E6E4DF" strokeWidth="1" />
        <rect x="9" y="6" width="9" height="2" rx="1" fill="#F4B000" />
        <rect x="6" y="11" width="12" height="2" rx="1" fill="#0E6B66" />
        <rect x="6" y="16" width="12" height="2" rx="1" fill="#0E6B66" />
      </svg>
    );
  }

  // Squircle Dark or Squircle Teal
  const isDark = effectiveVariant === 'squircle-dark';
  const containerFill = isDark ? '#100F0D' : '#0E6B66';
  const topSlatFill = '#F4B000';
  const lowerSlatFill = isDark ? (dark ? '#FFEFC2' : '#FFFFFF') : '#FFFFFF';

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
