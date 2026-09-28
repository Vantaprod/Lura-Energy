import Link from 'next/link';
import { LuraLogo } from './lura-logo';

const NAV_ITEMS = [
  { href: '/products', label: 'Products' },
  { href: '/solutions', label: 'Solutions' },
  { href: '/projects', label: 'Projects' },
  { href: '/services', label: 'Services' },
  { href: '/resources', label: 'Resources' },
  { href: '/about', label: 'About' },
] as const;

export function SiteHeader() {
  return (
    <header className="site-header">
      <Link className="wordmark" href="/" aria-label="Lura Energy, home">
        <LuraLogo height={40} />
      </Link>
      <nav aria-label="Main navigation">
        {NAV_ITEMS.map((item) => (
          <Link key={item.href} href={item.href}>
            {item.label}
          </Link>
        ))}
      </nav>
      <Link className="button button-small" href="/contact">
        Request a quote
      </Link>
    </header>
  );
}