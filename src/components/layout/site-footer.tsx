import Link from 'next/link';
import { prisma } from '@/lib/db/prisma';
export async function SiteFooter() {
  const rows = (process.env.NODE_ENV === 'development' && process.env.PREVIEW_WITHOUT_DATABASE) === 'true' ? [] : await prisma.setting.findMany({ where: { key: { in: ['contact.email', 'contact.phone', 'contact.whatsapp'] } } });
  const settings = Object.fromEntries(rows.map(row => [row.key, typeof row.value === 'string' ? row.value : '']));
  const phone = settings['contact.phone'] ?? ''; const email = settings['contact.email'] ?? ''; const whatsapp = (settings['contact.whatsapp'] ?? '').replace(/\D/g, '');
  return <footer className="site-footer"><div><Link className="wordmark" href="/">LURA<span>ENERGY</span></Link><p>Energy information from Lura.</p></div><div>{email && <a href={`mailto:${email}`}>{email}</a>}{phone && <a href={`tel:${phone.replace(/[^+\d]/g, '')}`}>{phone}</a>}{whatsapp && <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noreferrer">WhatsApp ↗</a>}<Link href="/products">Products</Link><Link href="/projects">Projects</Link><Link href="/contact">Contact</Link><Link href="/admin/login">Staff sign in</Link></div><small>© {new Date().getFullYear()} Lura Energy</small></footer>;
}
