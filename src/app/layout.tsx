import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import './globals.css';
import { SiteHeader } from '@/components/layout/site-header';
import { SiteFooter } from '@/components/layout/site-footer';
import { FloatingWhatsApp } from '@/components/public/floating-whatsapp';
import { LanguageProvider } from '@/lib/i18n/context';
import { JsonLd } from '@/components/public/json-ld';
import { organizationSchema } from '@/lib/seo/schemas';
import { PwaRegister } from '@/components/pwa/pwa-register';

export const metadata: Metadata = {
  title: { default: 'Lura Energy', template: '%s | Lura Energy' },
  description:
    'Lura Energy - Home of Premium Solar. Solar systems, storage, and installation.',
  other: { google: 'notranslate' },
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    title: 'Lura Admin',
    statusBarStyle: 'black-translucent',
  },
};

export const viewport: Viewport = {
  themeColor: '#1428A0',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" translate="no" suppressHydrationWarning>
      <head>
        <Script src="/sw-nuke.js" strategy="beforeInteractive" />
      </head>
      <body suppressHydrationWarning>
        <JsonLd data={organizationSchema()} />
        <LanguageProvider scope="front">
          <SiteHeader />
          <div id="main-content">{children}</div>
          <SiteFooter />
          <FloatingWhatsApp />
        </LanguageProvider>
        <PwaRegister />
      </body>
    </html>
  );
}