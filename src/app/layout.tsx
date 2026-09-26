import type { ReactNode } from 'react';
import type { Metadata, Viewport } from 'next';
import { Outfit } from 'next/font/google';
import './globals.css';

const outfit = Outfit({ subsets: ['latin', 'latin-ext'], weight: ['300', '400', '500'], variable: '--font-outfit', display: 'swap' });

export const metadata: Metadata = { title: 'LeadRadar', description: "Don't find leads. Find reasons to call. Evidence-based B2B sales signals for Romania and Moldova." };
export const viewport: Viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover', themeColor: [{ media: '(prefers-color-scheme: dark)', color: '#040814' }, { media: '(prefers-color-scheme: light)', color: '#f4f4f8' }] };

export default function Layout({ children }: { children: ReactNode }) {
  return <html lang="en" className={outfit.variable} suppressHydrationWarning><body>{children}</body></html>;
}
