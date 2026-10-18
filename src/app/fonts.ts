import {
  Instrument_Serif,
  Geist,
  Geist_Mono,
  Noto_Sans_Tamil,
  Noto_Serif_Tamil,
} from 'next/font/google';

export const instrumentSerif = Instrument_Serif({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

export const geistSans = Geist({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

export const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const notoSansTamil = Noto_Sans_Tamil({
  subsets: ['tamil'],
  variable: '--font-tamil-sans',
  display: 'swap',
});

export const notoSerifTamil = Noto_Serif_Tamil({
  subsets: ['tamil'],
  variable: '--font-tamil-serif',
  display: 'swap',
});

export const fontVariables = `${instrumentSerif.variable} ${geistSans.variable} ${geistMono.variable} ${notoSansTamil.variable} ${notoSerifTamil.variable}`;
