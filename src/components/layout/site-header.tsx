'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { href: '/', label: 'Home' },
  { href: '/products', label: 'Products' },
  { href: '/solutions', label: 'Solutions' },
  { href: '/projects', label: 'Projects' },
  { href: '/services', label: 'Services' },
  { href: '/resources', label: 'Resources' },
  { href: '/service-centres', label: 'Service Centres' },
  { href: '/about', label: 'About' },
] as const;

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (pathname?.startsWith('/admin')) return null;

  return (
    <>
      <header className="site-header">
        <Link className="wordmark" href="/" aria-label="Lura Energy, home">
          <Image
            src="/brand/lura-logo.png"
            alt="Lura Energy"
            width={140}
            height={40}
            priority
          />
        </Link>

        <nav className="site-header__nav" aria-label="Main navigation">
          {NAV_ITEMS.map((item) => (
            <Link key={item.href} href={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>

        <Link className="button button-small site-header__cta" href="/quote">
          Request a quote
        </Link>

        <button
          type="button"
          className={'site-header__burger' + (open ? ' is-open' : '')}
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          aria-controls="mobile-nav"
          onClick={() => setOpen((v) => !v)}
        >
          <span className="site-header__burger-bar" aria-hidden="true" />
          <span className="site-header__burger-bar" aria-hidden="true" />
          <span className="site-header__burger-bar" aria-hidden="true" />
        </button>
      </header>

      <div
        className="mobile-drawer-scrim"
        onClick={() => setOpen(false)}
        aria-hidden="true"
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(5, 14, 31, 0.55)',
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
          opacity: open ? 1 : 0,
          pointerEvents: open ? 'auto' : 'none',
          transition: 'opacity 140ms ease',
          zIndex: 998,
        }}
      />

      <aside
        id="mobile-nav"
        className="mobile-drawer"
        aria-hidden={!open}
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          width: 'min(190px, 58vw)',
          maxHeight: '100vh',
          background: '#FFFFFF',
          boxShadow: '-12px 0 32px rgba(5, 14, 31, 0.18)',
          borderRadius: '14px 0 0 14px',
          padding: '56px 12px 14px',
          transform: open ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 160ms cubic-bezier(.2, .7, .2, 1)',
          zIndex: 999,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'stretch',
        }}
      >
        <nav className="mobile-drawer__nav" aria-label="Mobile navigation">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="mobile-drawer__link"
              tabIndex={open ? 0 : -1}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <Link
          className="button mobile-drawer__cta"
          href="/quote"
          tabIndex={open ? 0 : -1}
        >
          Request a quote
        </Link>
      </aside>
    </>
  );
}