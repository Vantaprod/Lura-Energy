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
      <body suppressHydrationWarning>
        <Script id="sw-nuke" strategy="beforeInteractive">
          {`
            (function () {
              if (typeof window === 'undefined') return;
              if (!('serviceWorker' in navigator)) return;
              var host = window.location.hostname;
              if (host !== 'localhost' && host !== '127.0.0.1' && host.indexOf('192.168.') !== 0) return;
              navigator.serviceWorker.getRegistrations().then(function (regs) {
                if (!regs.length) return;
                Promise.all(regs.map(function (r) { return r.unregister(); }))
                  .then(function () {
                    if (!window.caches) return;
                    return caches.keys().then(function (keys) {
                      return Promise.all(keys.map(function (k) { return caches.delete(k); }));
                    });
                  })
                  .then(function () {
                    var key = '__sw_nuked__';
                    if (!sessionStorage.getItem(key)) {
                      sessionStorage.setItem(key, '1');
                      window.location.reload();
                    }
                  });
              });
            })();
          `}
        </Script>
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