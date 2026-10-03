import Image from 'next/image';
import Link from 'next/link';
import { prisma } from '@/lib/db/prisma';
import { getServerT } from '@/lib/i18n/server';

export const dynamic = 'force-dynamic';

type ContactSettings = { email: string; phone: string; whatsapp: string };

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

export async function SiteFooter() {
  const [{ email, phone, whatsapp }, { t }] = await Promise.all([
    loadContactSettings(),
    getServerT(),
  ]);
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="footer-grid">
        <div>
          <Link href="/" className="footer-logo" aria-label="Lura Energy, home">
            <Image src="/brand/lura-logo.png" alt="Lura Energy" width={110} height={32} />
          </Link>
          <p style={{ marginTop: '16px' }}>{t('footer.tagline')}</p>
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