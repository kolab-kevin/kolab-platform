import './globals.css';

import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';

import { AppProviders } from '@/components/app-providers';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Kōlab Manager Portal',
  description: 'Agency command center for portfolio, campaigns, recruiting, and operations',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} bg-background text-foreground min-h-screen font-sans antialiased`}
      >
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
