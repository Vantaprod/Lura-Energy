import { prisma } from '@/lib/db/prisma';
import { requireMaster } from '@/lib/auth/require-master';
import { getServerT } from '@/lib/i18n/server';

export const dynamic = 'force-dynamic';

function fill(template: string, vars: Record<string, string | number>): string {
  return Object.entries(vars).reduce(
    (acc, [k, v]) => acc.replaceAll(`{${k}}`, String(v)),
    template,
  );
}

export default async function PresencePage() {
  await requireMaster();
  const { t } = await getServerT('admin');
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
      <p className="eyebrow">{t('master.presence.eyebrow')}</p>
      <h2 className="master-h2">{t('master.presence.title')}</h2>
      <p className="master-meta">{t('master.presence.subtitle')}</p>

      <section className="master-section">
        <h3 className="master-h3">{fill(t('master.presence.online'), { n: online.length })}</h3>
        {online.length === 0 ? (
          <p className="master-empty">{t('master.presence.none')}</p>
        ) : (
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
        <h3 className="master-h3">{fill(t('master.presence.offline'), { n: offline.length })}</h3>
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
                {a.lastSeenAt ? new Date(a.lastSeenAt).toLocaleString() : t('master.presence.never')}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}