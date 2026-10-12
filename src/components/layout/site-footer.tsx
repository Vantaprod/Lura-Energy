import Image from 'next/image';
import Link from 'next/link';
import { prisma } from '@/lib/db/prisma';
import { getServerT } from '@/lib/i18n/server';

export const dynamic = 'force-dynamic';

type ContactSettings = { email: string; phone: string; whatsapp: string };

const SOCIAL_LINKS = [
  {
    key: 'tiktok',
    href: 'https://www.tiktok.com/@luraenergy',
    label: 'TikTok',
  },
  {
    key: 'facebook',
    href: 'https://www.facebook.com/share/1DmUupvwws/?mibextid=wwXIfr',
    label: 'Facebook',
  },
  {
    key: 'instagram',
    href: 'https://www.instagram.com/wunmiola8660/',
    label: 'Instagram',
  },
] as const;

async function loadContactSettings(): Promise<ContactSettings> {
  const empty: ContactSettings = { email: '', phone: '', whatsapp: '' };
  if (
    process.env.NODE_ENV === 'development' &&
    process.env.PREVIEW_WITHOUT_DATABASE === 'true'
  ) {
    return empty;
  }
  try {
    const rows = await prisma.setting.findMany({
      where: { key: { in: ['contact.email', 'contact.phone', 'contact.whatsapp'] } },
    });
    const map = Object.fromEntries(
      rows.map((row) => [row.key, typeof row.value === 'string' ? row.value : '']),
    );
    return {
      email: map['contact.email'] ?? '',
      phone: map['contact.phone'] ?? '',
      whatsapp: (map['contact.whatsapp'] ?? '').replace(/\D/g, ''),
    };
  } catch {
    return empty;
  }
}

function TikTokIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c5.05-.5 9-4.76 9-9.95z" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

const SOCIAL_ICONS: Record<string, () => React.ReactElement> = {
  tiktok: TikTokIcon,
  facebook: FacebookIcon,
  instagram: InstagramIcon,
};

export async function SiteFooter() {
  const [{ email, phone, whatsapp }, { t }] = await Promise.all([
    loadContactSettings(),
    getServerT('front'),
  ]);
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="footer-grid">
        <div>
          <Link href="/" className="footer-logo" aria-label={t('aria.siteHome')}>
            <Image src="/brand/lura-logo.png" alt="Lura Energy" width={110} height={32} />
          </Link>
          <p style={{ marginTop: '16px' }}>{t('footer.tagline')}</p>
          <div className="footer-social">
            {SOCIAL_LINKS.map(({ key, href, label }) => {
              const Icon = SOCIAL_ICONS[key];
              return (
                <a
                  key={key}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Lura Energy on ${label}`}
                  title={label}
                >
                  <Icon />
                </a>
              );
            })}
          </div>
        </div>
        <div className="footer-links">
          {email && <a href={'mailto:' + email}>{email}</a>}
          {phone && <a href={'tel:' + phone.replace(/[^+\d]/g, '')}>{phone}</a>}
          {whatsapp && (
            <a href={'https://wa.me/' + whatsapp} target="_blank" rel="noreferrer">
              {t('footer.whatsapp')}
            </a>
          )}
          <Link href="/products">{t('footer.products')}</Link>
          <Link href="/projects">{t('footer.projects')}</Link>
          <Link href="/contact">{t('footer.contact')}</Link>
          <Link href="/admin/login">{t('footer.staffSignIn')}</Link>
        </div>
      </div>
      <small>{'\u00A9'} {year} {t('footer.copyright')}</small>
    </footer>
  );
}