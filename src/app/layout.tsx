import type { ReactNode } from 'react';
import './globals.css';
export const metadata = { title: 'LeadRadar | Evidence to opportunity' };
export default function Layout({ children }: { children: ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}
