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

type Lang = 'en' | 'zh' | 'fr';
const LANGUAGES: { code: Lang; label: string; native: string }[] = [
  { code: 'en', label: 'English', native: 'English' },
  { code: 'zh', label: 'Chinese', native: '中文' },
  { code: 'fr', label: 'French', native: 'Français' },
];

const LANG_STORAGE_KEY = 'lura-lang';

function getStoredLang(): Lang {
  if (typeof window === 'undefined') return 'en';
  const v = window.localStorage.getItem(LANG_STORAGE_KEY);
  return v === 'zh' || v === 'fr' ? v : 'en';
}

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [lang, setLang] = useState<Lang>('en');

  useEffect(() => {
    function check() {
      setIsMobile(window.innerWidth <= 900);
    }
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    setLang(getStoredLang());
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
    try {
      window.localStorage.setItem(LANG_STORAGE_KEY, lang);
    } catch {
      // ignore
    }
  }, [lang]);

  useEffect(() => {
    setOpen(false);
    setLangOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open && !langOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOpen(false);
        setLangOpen(false);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, langOpen]);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (pathname?.startsWith('/admin')) return null;

  const currentLang = LANGUAGES.find((l) => l.code === lang) ?? LANGUAGES[0];

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
                  transition: 'color 150ms ease',
                }}
              >
                {item.label}
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
          {/* Language button */}
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              onClick={() => setLangOpen((v) => !v)}
              aria-label="Change language"
              aria-expanded={langOpen}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                background: 'transparent',
                border: 0,
                cursor: 'pointer',
                padding: isMobile ? '6px 6px' : '8px 10px',
                borderRadius: '6px',
                color: '#0A1550',
                fontWeight: 600,
                fontSize: '13px',
                transition: 'background 150ms ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#F4F6F9';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="2" y1="12" x2="22" y2="12" />
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              </svg>
              {!isMobile && <span>{currentLang.code.toUpperCase()}</span>}
            </button>

            {langOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 8px)',
                  right: 0,
                  background: '#FFFFFF',
                  border: '1px solid #E4E7EC',
                  borderRadius: '8px',
                  boxShadow: '0 12px 32px rgba(5, 14, 31, 0.14)',
                  minWidth: '160px',
                  overflow: 'hidden',
                  zIndex: 200,
                }}
              >
                {LANGUAGES.map((l) => (
                  <button
                    key={l.code}
                    type="button"
                    onClick={() => {
                      setLang(l.code);
                      setLangOpen(false);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      width: '100%',
                      padding: '11px 16px',
                      background: lang === l.code ? '#E8EEF9' : 'transparent',
                      border: 0,
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      fontSize: '14px',
                      fontWeight: lang === l.code ? 700 : 500,
                      color: lang === l.code ? '#1428A0' : '#0A1550',
                      textAlign: 'left',
                      transition: 'background 120ms ease',
                    }}
                    onMouseEnter={(e) => {
                      if (lang !== l.code) e.currentTarget.style.background = '#F4F6F9';
                    }}
                    onMouseLeave={(e) => {
                      if (lang !== l.code) e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <span>{l.native}</span>
                    <span
                      style={{
                        fontSize: '11px',
                        color: '#6B7686',
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                        fontWeight: 700,
                      }}
                    >
                      {l.code}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

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
              Request a quote
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
              <span
                style={{
                  display: 'block',
                  width: '20px',
                  height: '2px',
                  background: '#0A1550',
                  borderRadius: '2px',
                  transform: open ? 'translateY(6px) rotate(45deg)' : 'none',
                  transition: 'transform 200ms ease',
                }}
              />
              <span
                style={{
                  display: 'block',
                  width: '20px',
                  height: '2px',
                  background: '#0A1550',
                  borderRadius: '2px',
                  opacity: open ? 0 : 1,
                  transition: 'opacity 150ms ease',
                }}
              />
              <span
                style={{
                  display: 'block',
                  width: '20px',
                  height: '2px',
                  background: '#0A1550',
                  borderRadius: '2px',
                  transform: open ? 'translateY(-6px) rotate(-45deg)' : 'none',
                  transition: 'transform 200ms ease',
                }}
              />
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
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            <nav
              aria-label="Mobile navigation"
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '2px',
              }}
            >
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
                  {item.label}
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
              Request a quote
            </Link>
          </aside>
        </>
      )}
    </>
  );
}