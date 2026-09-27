import type { Metadata } from 'next';
import './globals.css';
import './utilities.css';
import { SiteHeader } from '@/components/layout/site-header';
import { SiteFooter } from '@/components/layout/site-footer';

export const metadata: Metadata = { title: { default: 'Lura Energy', template: '%s | Lura Energy' }, description: 'Explore Lura Energy products, services and projects.' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body><a className="skip-link" href="#main-content">Skip to content</a><SiteHeader /><div id="main-content">{children}</div><SiteFooter /></body></html>;
}
