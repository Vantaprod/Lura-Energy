import Link from 'next/link';
import { prisma } from '@/lib/db/prisma';
import { requireMaster } from '@/lib/auth/require-master';

export const dynamic = 'force-dynamic';

export default async function MasterOverviewPage() {
  const me = await requireMaster();
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
  ]);

  const firstName = (me.name ?? me.email).split(' ')[0];

  return (
    <>
      <p className="eyebrow">MASTER OVERVIEW</p>
      <h2 className="master-h2">Welcome, {firstName}.</h2>

      <div className="master-grid">
        <Link href="/admin/master/presence" className="master-card">
          <p className="master-card-label">ONLINE NOW</p>
          <p className="master-card-number">{onlineAdmins.length}</p>
          <p className="master-card-sub">of {adminCount} admins</p>
        </Link>
        <Link href="/admin/master/requests" className="master-card">
          <p className="master-card-label">ACCESS REQUESTS{pendingRequests > 0 && <span className="master-card-badge">{pendingRequests}</span>}</p>
          <p className="master-card-number">{pendingRequests}</p>
          <p className="master-card-sub">{pendingRequests === 0 ? `No pending requests` : `${pendingRequests} awaiting review`}</p>
        </Link>
        <Link href="/admin/master/messages" className="master-card">
          <p className="master-card-label">MESSAGES</p>
          <p className="master-card-number">{pendingRequests}</p>
          <p className="master-card-sub">Coming in Chunk D</p>
        </Link>
        <Link href="/admin/administrators" className="master-card">
          <p className="master-card-label">ADMINS</p>
          <p className="master-card-number">{adminCount}</p>
          <p className="master-card-sub">active accounts</p>
        </Link>
      </div>

      <section className="master-section">
        <h3 className="master-h3">Online now</h3>
        {onlineAdmins.length === 0 ? (
          <p className="master-empty">No admins online.</p>
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
        <h3 className="master-h3">Recent sign-ins</h3>
        <ul className="master-list">
          {recent.map((a) => (
            <li key={a.id} className="master-list-item">
              <span className="master-user-avatar master-user-avatar--fallback">
                {(a.name ?? a.email).slice(0, 1).toUpperCase()}
              </span>
              <div>
                <p className="master-list-name">
                  {a.name ?? a.email}{' '}
                  {a.role === 'OWNER' && <span className="master-role-tag">master</span>}
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