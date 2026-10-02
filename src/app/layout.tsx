import type { Metadata } from 'next';
import './globals.css';
import { SiteHeader } from '@/components/layout/site-header';
import { SiteFooter } from '@/components/layout/site-footer';
import { FloatingWhatsApp } from '@/components/public/floating-whatsapp';

export const metadata: Metadata = {
  title: { default: 'Lura Energy', template: '%s | Lura Energy' },
  description:
    'Lura Energy - Home of Premium Solar. Solar systems, storage, and installation.',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <SiteHeader />
        <div id="main-content">{children}</div>
        <SiteFooter />
        <FloatingWhatsApp />
      </body>
    </html>
  );
}