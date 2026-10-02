import type { Metadata } from 'next';
import './globals.css';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
import { SiteHeader } from '@/components/layout/site-header';
import { SiteFooter } from '@/components/layout/site-footer';
import { FloatingWhatsAppLoader } from '@/components/public/floating-whatsapp-loader';

export const metadata: Metadata = {
  title: { default: 'Lura Energy', template: '%s | Lura Energy' },
  description: 'Lura Energy - Home of Premium Solar.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=Manrope:wght@600;700;800&display=swap"
        />
      </head>
      <body>
        <a className="skip-link" href="#main-content">Skip to content</a>
        <SiteHeader />
        <div id="main-content">{children}</div>
        <SiteFooter />
        <FloatingWhatsAppLoader />
      </body>
    </html>
  );
}