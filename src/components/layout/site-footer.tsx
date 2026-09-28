import Link from 'next/link';
import { prisma } from '@/lib/db/prisma';
import { LuraLogo } from './lura-logo';

type ContactSettings = {
  email: string;
  phone: string;
  whatsapp: string;
};

async function loadContactSettings(): Promise<ContactSettings> {
  const empty: ContactSettings = { email: '', phone: '', whatsapp: '' };

  const previewMode =
    process.env.NODE_ENV === 'development' &&
    process.env.PREVIEW_WITHOUT_DATABASE === 'true';

  if (previewMode) return empty;

  try {
    const rows = await prisma.setting.findMany({
      where: {
        key: { in: ['contact.email', 'contact.phone', 'contact.whatsapp'] },
      },
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
  const { email, phone, whatsapp } = await loadContactSettings();
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div>
        <Link className="wordmark" href="/" aria-label="Lura Energy, home">
          <LuraLogo variant="white" height={44} />
        </Link>
        <p style={{ marginTop: '1rem' }}>Home of Premium Solar.</p>
      </div>
      <div>
        {email && <a href={`mailto:${email}`}>{email}</a>}
        {phone && <a href={`tel:${phone.replace(/[^+\d]/g, '')}`}>{phone}</a>}
        {whatsapp && (
          <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noreferrer">
            WhatsApp {'\u2192'}
          </a>
        )}
        <Link href="/products">Products</Link>
        <Link href="/projects">Projects</Link>
        <Link href="/contact">Contact</Link>
        <Link href="/admin/login">Staff sign in</Link>
      </div>
      <small>
        {'\u00A9'} {year} Lura Energy
      </small>
    </footer>
  );
}