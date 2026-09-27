import Image from 'next/image';
import Link from 'next/link';

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
        <Image
          src="/brand/lura-logo.png"
          alt="Lura Energy"
          width={184}
          height={80}
          priority
          className="brand-logo"
        />
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