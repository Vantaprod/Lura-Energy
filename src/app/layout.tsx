import type { Metadata } from 'next';
import './globals.css';
import { SiteHeader } from '@/components/layout/site-header';
import { SiteFooter } from '@/components/layout/site-footer';
import { FloatingWhatsApp } from '@/components/public/floating-whatsapp';
import { LanguageProvider } from '@/lib/i18n/context';

export const metadata: Metadata = {
  title: { default: 'Lura Energy', template: '%s | Lura Energy' },
  description:
    'Lura Energy - Home of Premium Solar. Solar systems, storage, and installation.',
  other: {
    google: 'notranslate',
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" translate="no" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <LanguageProvider scope="front">
          <SiteHeader />
          <div id="main-content">{children}</div>
          <SiteFooter />
          <FloatingWhatsApp />
        </LanguageProvider>
      </body>
    </html>
  );
}