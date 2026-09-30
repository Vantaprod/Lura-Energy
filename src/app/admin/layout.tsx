import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth/session';
import { AdminLogout } from '@/components/admin/admin-logout';

const NAV_LINKS = [
  { href: '/admin', label: 'Overview' },
  { href: '/admin/service-centres', label: 'Service Centres' },
  { href: '/admin/products', label: 'Products' },
  { href: '/admin/product-categories', label: 'Product categories' },
  { href: '/admin/projects', label: 'Projects' },
  { href: '/admin/services', label: 'Services' },
  { href: '/admin/solutions', label: 'Solutions' },
  { href: '/admin/media', label: 'Media' },
  { href: '/admin/testimonials', label: 'Testimonials' },
  { href: '/admin/faqs', label: 'FAQs' },
  { href: '/admin/resources', label: 'Resources' },
  { href: '/admin/leads', label: 'Leads' },
] as const;

const OWNER_LINKS = [
  { href: '/admin/content', label: 'Site settings' },
  { href: '/admin/administrators', label: 'Administrators' },
  { href: '/admin/audit-log', label: 'Audit log' },
] as const;

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  return (
    <>
      <div className="admin-shell">
        <div className="admin-top">
          <div>
            <p className="eyebrow">Lura workspace</p>
            <h2 style={{ fontSize: '1.7rem' }}>Administration</h2>
          </div>
          {user ? (
            <div>
              <span className="form-note">
                {user.name} - {user.role.toLowerCase()}
              </span>{' '}
              <AdminLogout />
            </div>
          ) : (
            <Link href="/admin/login">Staff sign in</Link>
          )}
        </div>

        {user && (
          <nav className="admin-nav" aria-label="Admin navigation">
            {NAV_LINKS.map((item) => (
              <Link key={item.href} href={item.href}>
                {item.label}
              </Link>
            ))}
            {user.role === 'OWNER' &&
              OWNER_LINKS.map((item) => (
                <Link key={item.href} href={item.href}>
                  {item.label}
                </Link>
              ))}
          </nav>
        )}

        {children}
      </div>
    </>
  );
}