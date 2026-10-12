import Link from 'next/link';
import { requireMaster } from '@/lib/auth/require-master';
import { PresenceHeartbeat } from '@/components/admin/presence-heartbeat';
import { LanguageSwitcher } from '@/components/layout/language-switcher';
import { AdminLogout } from '@/components/admin/admin-logout';
import { AdminLogout } from '@/components/admin/admin-logout';
import { getServerT } from '@/lib/i18n/server';

export default async function MasterLayout({ children }: { children: React.ReactNode }) {
  const me = await requireMaster();
  const { t } = await getServerT('admin');
  const initials = (me.name ?? me.email).slice(0, 1).toUpperCase();

  return (
    <div className="master-shell">
      <PresenceHeartbeat />
      <header className="master-header">
        <div>
          <p className="eyebrow">{t('master.eyebrow')}</p>
          <h1 className="master-title">{t('master.title')}</h1>
        </div>
        <div className="master-header-right">
          <LanguageSwitcher />
          <span className="master-user-chip">
            {me.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={me.avatarUrl} alt="" className="master-user-avatar" />
            ) : (
              <span className="master-user-avatar master-user-avatar--fallback">{initials}</span>
            )}
            <span>{me.name ?? me.email}</span>
          </span>
          <Link href="/admin" className="button button-quiet">{t('master.siteAdmin')}</Link>
          <AdminLogout />
        </div>
      </header>
      <nav className="master-nav" aria-label="Master navigation">
        <Link href="/admin/master">{t('master.nav.overview')}</Link>
        <Link href="/admin/master/presence">{t('master.nav.presence')}</Link>
        <Link href="/admin/master/requests">{t('master.nav.requests')}</Link>
        <Link href="/admin/master/messages">{t('master.nav.messages')}</Link>
        <Link href="/admin/administrators">{t('master.nav.administrators')}</Link>
      </nav>
      <main className="master-main">{children}</main>
    </div>
  );
}