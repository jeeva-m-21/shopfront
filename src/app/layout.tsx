import type { Metadata } from 'next';
import React from 'react';

export const metadata: Metadata = {
  title: 'Shopfront — Chennai Local Business Directory',
  description: 'Find verified local shops and services in Chennai.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body>
        <main>{children}</main>
      </body>
    </html>
  );
}
