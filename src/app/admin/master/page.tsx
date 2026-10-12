import Link from 'next/link';
import { prisma } from '@/lib/db/prisma';
import { requireMaster } from '@/lib/auth/require-master';
import { getServerT } from '@/lib/i18n/server';
import { BroadcastCard } from '@/components/admin/broadcast-card';
import { DigestSettingsCard } from '@/components/admin/digest-settings-card';

export const dynamic = 'force-dynamic';

function fill(template: string, vars: Record<string, string | number>): string {
  return Object.entries(vars).reduce(
    (acc, [k, v]) => acc.replaceAll(`{${k}}`, String(v)),
    template,
  );
}

export default async function MasterOverviewPage() {
  const me = await requireMaster();
  const { t } = await getServerT('admin');
  const onlineCutoff = new Date(Date.now() - 2 * 60 * 1000);

  const [adminCount, onlineAdmins, recent, pendingRequests] = await Promise.all([
    prisma.user.count({ where: { active: true } }),
    prisma.user.findMany({
      where: { active: true, lastSeenAt: { gte: onlineCutoff } },
      select: { id: true, name: true, email: true, avatarUrl: true, lastSeenAt: true },
      orderBy: { lastSeenAt: 'desc' },
    }),
    prisma.user.findMany({
      where: { active: true },
      select: { id: true, name: true, email: true, role: true, lastLoginAt: true, avatarUrl: true },
      orderBy: { lastLoginAt: 'desc' },
      take: 6,
    }),
    prisma.accessRequest.count({ where: { status: 'PENDING' } }),
  ]);

  const firstName = (me.name ?? me.email).split(' ')[0];

  return (
    <>
      <p className="eyebrow">{t('master.overviewEyebrow')}</p>
      <h2 className="master-h2">{fill(t('master.welcome'), { name: firstName })}</h2>

      <div className="master-grid">
        <Link href="/admin/master/presence" className="master-card">
          <p className="master-card-label">{t('master.card.onlineNow')}</p>
          <p className="master-card-number">{onlineAdmins.length}</p>
          <p className="master-card-sub">{fill(t('master.card.ofAdmins'), { n: adminCount })}</p>
        </Link>
        <Link href="/admin/master/requests" className="master-card">
          <p className="master-card-label">
            {t('master.card.accessRequests')}
            {pendingRequests > 0 && <span className="master-card-badge">{pendingRequests}</span>}
          </p>
          <p className="master-card-number">{pendingRequests}</p>
          <p className="master-card-sub">
            {pendingRequests === 0
              ? t('master.card.noPending')
              : fill(t('master.card.pendingCount'), { n: pendingRequests })}
          </p>
        </Link>
        <Link href="/admin/master/messages" className="master-card">
          <p className="master-card-label">{t('master.card.messages')}</p>
          <p className="master-card-number">&mdash;</p>
          <p className="master-card-sub">{t('master.card.comingLater')}</p>
        </Link>
        <Link href="/admin/administrators" className="master-card">
          <p className="master-card-label">{t('master.card.admins')}</p>
          <p className="master-card-number">{adminCount}</p>
          <p className="master-card-sub">{t('master.card.activeAccounts')}</p>
        </Link>
      </div>

      <BroadcastCard />

      <DigestSettingsCard />

      <section className="master-section">
        <h3 className="master-h3">{t('master.onlineNow')}</h3>
        {onlineAdmins.length === 0 ? (
          <p className="master-empty">{t('master.noOnline')}</p>
        ) : (
          <ul className="master-list">
            {onlineAdmins.map((a) => (
              <li key={a.id} className="master-list-item">
                <span className="master-user-avatar master-user-avatar--fallback">
                  {(a.name ?? a.email).slice(0, 1).toUpperCase()}
                </span>
                <div>
                  <p className="master-list-name">{a.name ?? a.email}</p>
                  <p className="master-list-meta">{a.email}</p>
                </div>
                <span className="master-dot" aria-label="online" />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="master-section">
        <h3 className="master-h3">{t('master.recentSignIns')}</h3>
        <ul className="master-list">
          {recent.map((a) => (
            <li key={a.id} className="master-list-item">
              <span className="master-user-avatar master-user-avatar--fallback">
                {(a.name ?? a.email).slice(0, 1).toUpperCase()}
              </span>
              <div>
                <p className="master-list-name">
                  {a.name ?? a.email}{' '}
                  {a.role === 'OWNER' && <span className="master-role-tag">{t('master.roleMaster')}</span>}
                </p>
                <p className="master-list-meta">{a.email}</p>
              </div>
              <span className="master-list-meta">
                {a.lastLoginAt ? new Date(a.lastLoginAt).toLocaleString() : '—'}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}