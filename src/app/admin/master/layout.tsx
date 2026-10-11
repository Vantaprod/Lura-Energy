import Link from 'next/link';
import { requireMaster } from '@/lib/auth/require-master';
import { PresenceHeartbeat } from '@/components/admin/presence-heartbeat';
import { LanguageSwitcher } from '@/components/layout/language-switcher';

export default async function MasterLayout({ children }: { children: React.ReactNode }) {
  const me = await requireMaster();
  const initials = (me.name ?? me.email).slice(0, 1).toUpperCase();

  return (
    <div className="master-shell">
      <PresenceHeartbeat />
      <header className="master-header">
        <div>
          <p className="eyebrow">LURA MASTER</p>
          <h1 className="master-title">Master console</h1>
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
          <Link href="/admin" className="button button-quiet">Site admin</Link>
          <form action="/api/auth/logout" method="post">
            <button className="button">Sign out</button>
          </form>
        </div>
      </header>
      <nav className="master-nav" aria-label="Master navigation">
        <Link href="/admin/master">Overview</Link>
        <Link href="/admin/master/presence">Presence</Link>
        <Link href="/admin/master/requests">Requests</Link>
        <Link href="/admin/master/messages">Messages</Link>
        <Link href="/admin/administrators">Administrators</Link>
      </nav>
      <main className="master-main">{children}</main>
    </div>
  );
}