'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslation } from '@/lib/i18n/context';
import { AdminLogout } from '@/components/admin/admin-logout';
import { LanguageSwitcher } from './language-switcher';
import type { Lang } from '@/lib/i18n/dictionaries';

type User = { name: string; role: string } | null;

const POLL_MS = 1000;

export function AdminShell({
  user,
  children,
}: {
  user: User;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { t, lang, applyServerLang } = useTranslation();

  const langRef = useRef<Lang>(lang);
  useEffect(() => {
    langRef.current = lang;
  }, [lang]);

  useEffect(() => {
    let cancelled = false;
    let timer: number | null = null;

    async function poll() {
      if (cancelled) return;

      if (typeof document !== 'undefined' && document.hidden) {
        schedule();
        return;
      }

      try {
        const res = await fetch('/api/admin/language', { cache: 'no-store' });
        if (res.ok) {
          const data = (await res.json()) as { lang?: Lang };
          if (data.lang && data.lang !== langRef.current) {
            applyServerLang(data.lang);
            router.refresh();
          }
        }
      } catch {
        // next tick retries
      }
      schedule();
    }

    function schedule() {
      if (cancelled) return;
      timer = window.setTimeout(poll, POLL_MS);
    }

    function onVisibility() {
      if (!document.hidden) {
        if (timer) window.clearTimeout(timer);
        void poll();
      }
    }

    schedule();
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      cancelled = true;
      if (timer) window.clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [applyServerLang, router]);

  const NAV_LINKS = [
    { href: '/admin', label: t('admin.nav.overview') },
    { href: '/admin/service-centres', label: t('admin.nav.serviceCentres') },
    { href: '/admin/products', label: t('admin.nav.products') },
    { href: '/admin/product-categories', label: t('admin.nav.productCategories') },
    { href: '/admin/projects', label: t('admin.nav.projects') },
    { href: '/admin/services', label: t('admin.nav.services') },
    { href: '/admin/solutions', label: t('admin.nav.solutions') },
    { href: '/admin/media', label: t('admin.nav.media') },
    { href: '/admin/testimonials', label: t('admin.nav.testimonials') },
    { href: '/admin/faqs', label: t('admin.nav.faqs') },
    { href: '/admin/resources', label: t('admin.nav.resources') },
    { href: '/admin/leads', label: t('admin.nav.leads') },
  ];

  const OWNER_LINKS = [
    { href: '/admin/content', label: t('admin.nav.siteSettings') },
    { href: '/admin/administrators', label: t('admin.nav.administrators') },
    { href: '/admin/audit-log', label: t('admin.nav.auditLog') },
  ];

  return (
    <div className="admin-shell">
      <div className="admin-top">
        <div>
          <p className="eyebrow">{t('admin.workspaceEyebrow')}</p>
          <h2 style={{ fontSize: '1.7rem' }}>{t('admin.heading')}</h2>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            flexWrap: 'wrap',
          }}
        >
          <LanguageSwitcher />
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span className="form-note">
                {user.name} - {user.role.toLowerCase()}
              </span>
              <AdminLogout />
            </div>
          ) : (
            <Link href="/admin/login">{t('admin.staffSignIn')}</Link>
          )}
        </div>
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
  );
}