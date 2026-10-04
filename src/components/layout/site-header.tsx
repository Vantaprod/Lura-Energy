'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslation } from '@/lib/i18n/context';
import { LanguageSwitcher } from './language-switcher';

const NAV_ITEMS: { href: string; key: string }[] = [
  { href: '/', key: 'nav.home' },
  { href: '/products', key: 'nav.products' },
  { href: '/solutions', key: 'nav.solutions' },
  { href: '/projects', key: 'nav.projects' },
  { href: '/services', key: 'nav.services' },
  { href: '/resources', key: 'nav.resources' },
  { href: '/service-centres', key: 'nav.serviceCentres' },
  { href: '/about', key: 'nav.about' },
];

export function SiteHeader() {
  const pathname = usePathname();
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    function check() {
      setIsMobile(window.innerWidth <= 900);
    }
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

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

  // Hide the public header on any admin route.
  if (pathname?.startsWith('/admin')) return null;

  return (
    <>
      <header
        style={{
          height: isMobile ? '44px' : '68px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: isMobile ? '0 10px' : '0 28px',
          background: '#FFFFFF',
          borderBottom: '1px solid #E4E7EC',
          position: 'sticky',
          top: 0,
          zIndex: 100,
          gap: '10px',
        }}
      >
        <Link
          href="/"
          aria-label="Lura Energy, home"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            textDecoration: 'none',
            flexShrink: 0,
          }}
        >
          <Image
            src="/brand/lura-logo.png"
            alt="Lura Energy"
            width={140}
            height={40}
            priority
            style={{
              height: isMobile ? '22px' : '34px',
              width: 'auto',
              display: 'block',
            }}
          />
        </Link>

        {!isMobile && (
          <nav
            aria-label="Main navigation"
            style={{
              display: 'flex',
              gap: '22px',
              fontSize: '14px',
              alignItems: 'center',
            }}
          >
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  color: pathname === item.href ? '#1428A0' : '#2B3441',
                  textDecoration: 'none',
                  fontWeight: pathname === item.href ? 700 : 500,
                }}
              >
                {t(item.key)}
              </Link>
            ))}
          </nav>
        )}

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: isMobile ? '4px' : '10px',
            marginLeft: isMobile ? 'auto' : 0,
          }}
        >
          <LanguageSwitcher showCode={!isMobile} />

          {!isMobile && (
            <Link
              href="/quote"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#F58220',
                color: '#FFFFFF',
                fontWeight: 700,
                fontSize: '13px',
                padding: '8px 16px',
                borderRadius: '4px',
                textDecoration: 'none',
                minHeight: '36px',
                flexShrink: 0,
              }}
            >
              {t('cta.quote')}
            </Link>
          )}

          {isMobile && (
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-label={open ? 'Close menu' : 'Open menu'}
              aria-expanded={open}
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                alignItems: 'center',
                width: '32px',
                height: '32px',
                padding: '8px 5px',
                background: 'transparent',
                border: 0,
                cursor: 'pointer',
                flexShrink: 0,
              }}
            >
              <span style={{ display: 'block', width: '20px', height: '2px', background: '#0A1550', borderRadius: '2px', transform: open ? 'translateY(6px) rotate(45deg)' : 'none', transition: 'transform 200ms ease' }} />
              <span style={{ display: 'block', width: '20px', height: '2px', background: '#0A1550', borderRadius: '2px', opacity: open ? 0 : 1, transition: 'opacity 150ms ease' }} />
              <span style={{ display: 'block', width: '20px', height: '2px', background: '#0A1550', borderRadius: '2px', transform: open ? 'translateY(-6px) rotate(-45deg)' : 'none', transition: 'transform 200ms ease' }} />
            </button>
          )}
        </div>
      </header>

      {isMobile && (
        <>
          <div
            onClick={() => setOpen(false)}
            aria-hidden="true"
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(5, 14, 31, 0.55)',
              backdropFilter: 'blur(3px)',
              WebkitBackdropFilter: 'blur(3px)',
              opacity: open ? 1 : 0,
              pointerEvents: open ? 'auto' : 'none',
              transition: 'opacity 200ms ease',
              zIndex: 998,
            }}
          />
          <aside
            aria-hidden={!open}
            style={{
              position: 'fixed',
              top: 0,
              right: 0,
              width: 'min(260px, 78vw)',
              height: '100vh',
              background: '#FFFFFF',
              boxShadow: '-8px 0 28px rgba(5, 14, 31, 0.18)',
              transform: open ? 'translateX(0)' : 'translateX(100%)',
              transition: 'transform 240ms cubic-bezier(.2,.7,.2,1)',
              zIndex: 999,
              display: 'flex',
              flexDirection: 'column',
              paddingTop: '56px',
              paddingBottom: '20px',
              paddingLeft: '10px',
              paddingRight: '10px',
              overflowY: 'auto',
            }}
          >
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close menu"
              style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                width: '36px',
                height: '36px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'transparent',
                border: 0,
                borderRadius: '6px',
                cursor: 'pointer',
                color: '#0A1550',
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            <nav aria-label="Mobile navigation" style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  tabIndex={open ? 0 : -1}
                  onClick={() => setOpen(false)}
                  style={{
                    display: 'block',
                    padding: '11px 14px',
                    borderRadius: '6px',
                    fontFamily: 'inherit',
                    fontSize: '15px',
                    fontWeight: 600,
                    color: pathname === item.href ? '#1428A0' : '#0A1550',
                    background: pathname === item.href ? '#E8EEF9' : 'transparent',
                    textDecoration: 'none',
                  }}
                >
                  {t(item.key)}
                </Link>
              ))}
            </nav>

            <Link
              href="/quote"
              tabIndex={open ? 0 : -1}
              onClick={() => setOpen(false)}
              style={{
                marginTop: '14px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
                background: '#F58220',
                color: '#FFFFFF',
                fontWeight: 700,
                fontSize: '14px',
                padding: '12px 18px',
                borderRadius: '6px',
                textDecoration: 'none',
                minHeight: '44px',
              }}
            >
              {t('cta.quote')}
            </Link>
          </aside>
        </>
      )}
    </>
  );
}