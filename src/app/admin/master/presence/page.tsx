import { prisma } from '@/lib/db/prisma';
import { requireMaster } from '@/lib/auth/require-master';

export const dynamic = 'force-dynamic';

export default async function PresencePage() {
  await requireMaster();
  const cutoff = new Date(Date.now() - 2 * 60 * 1000);
  const [online, offline] = await Promise.all([
    prisma.user.findMany({
      where: { active: true, lastSeenAt: { gte: cutoff } },
      select: { id: true, name: true, email: true, role: true, lastSeenAt: true },
      orderBy: { lastSeenAt: 'desc' },
    }),
    prisma.user.findMany({
      where: { active: true, OR: [{ lastSeenAt: null }, { lastSeenAt: { lt: cutoff } }] },
      select: { id: true, name: true, email: true, role: true, lastSeenAt: true },
      orderBy: { lastSeenAt: 'desc' },
    }),
  ]);

  return (
    <>
      <p className="eyebrow">PRESENCE</p>
      <h2 className="master-h2">Who&rsquo;s online</h2>
      <p className="master-meta">Refreshes when you reload. Live updates land with a later chunk.</p>

      <section className="master-section">
        <h3 className="master-h3">Online ({online.length})</h3>
        {online.length === 0 ? <p className="master-empty">Nobody online right now.</p> : (
          <ul className="master-list">
            {online.map((a) => (
              <li key={a.id} className="master-list-item">
                <span className="master-user-avatar master-user-avatar--fallback">
                  {(a.name ?? a.email).slice(0, 1).toUpperCase()}
                </span>
                <div>
                  <p className="master-list-name">{a.name ?? a.email}</p>
                  <p className="master-list-meta">{a.email}</p>
                </div>
                <span className="master-dot" />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="master-section">
        <h3 className="master-h3">Offline ({offline.length})</h3>
        <ul className="master-list">
          {offline.map((a) => (
            <li key={a.id} className="master-list-item">
              <span className="master-user-avatar master-user-avatar--fallback">
                {(a.name ?? a.email).slice(0, 1).toUpperCase()}
              </span>
              <div>
                <p className="master-list-name">{a.name ?? a.email}</p>
                <p className="master-list-meta">{a.email}</p>
              </div>
              <span className="master-list-meta">
                {a.lastSeenAt ? new Date(a.lastSeenAt).toLocaleString() : 'never'}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}