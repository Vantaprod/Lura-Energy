import { redirect } from 'next/navigation';
import { statfs } from 'node:fs/promises';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/auth/session';
import { getServerT } from '@/lib/i18n/server';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'System health' };

function formatBytes(n: number): string {
  if (!n || n < 1) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let i = 0;
  let value = n;
  while (value >= 1024 && i < units.length - 1) {
    value /= 1024;
    i++;
  }
  return `${value.toFixed(value >= 10 || i === 0 ? 0 : 1)} ${units[i]}`;
}

type EnvCheck = {
  label: string;
  present: boolean;
  required: boolean;
  value?: string;
};

export default async function SystemPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/admin/login');
  if (user.role !== 'OWNER') redirect('/admin');

  const { t } = await getServerT('admin');

  // --- DB probe ---
  let dbOk = false;
  let dbError = '';
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbOk = true;
  } catch (e) {
    dbOk = false;
    dbError = e instanceof Error ? e.message : String(e);
  }

  // --- Migrations ---
  let latestMigrations: Array<{
    migration_name: string;
    finished_at: Date | null;
  }> = [];
  let migrationCount = 0;
  try {
    latestMigrations = await prisma.$queryRaw<
      Array<{ migration_name: string; finished_at: Date | null }>
    >`SELECT migration_name, finished_at FROM _prisma_migrations WHERE finished_at IS NOT NULL ORDER BY finished_at DESC LIMIT 5`;
    const c = await prisma.$queryRaw<
      Array<{ count: bigint }>
    >`SELECT COUNT(*)::bigint AS count FROM _prisma_migrations`;
    migrationCount = Number(c[0]?.count ?? 0);
  } catch {
    // Table missing — likely un-migrated DB.
  }

  // --- Env vars ---
  const envChecks: EnvCheck[] = [
    {
      label: 'DATABASE_URL',
      required: true,
      present: Boolean(process.env.DATABASE_URL),
    },
    {
      label: 'NEXT_PUBLIC_SITE_URL',
      required: false,
      present: Boolean(process.env.NEXT_PUBLIC_SITE_URL),
      value: process.env.NEXT_PUBLIC_SITE_URL,
    },
    {
      label: 'SMTP_HOST',
      required: false,
      present: Boolean(process.env.SMTP_HOST),
    },
    {
      label: 'SMTP_USER',
      required: false,
      present: Boolean(process.env.SMTP_USER),
    },
    {
      label: 'SMTP_PASS',
      required: false,
      present: Boolean(process.env.SMTP_PASS),
    },
    {
      label: 'LEAD_NOTIFY_TO',
      required: false,
      present: Boolean(process.env.LEAD_NOTIFY_TO),
      value: process.env.LEAD_NOTIFY_TO,
    },
    {
      label: 'LEAD_NOTIFY_FROM',
      required: false,
      present: Boolean(process.env.LEAD_NOTIFY_FROM),
      value: process.env.LEAD_NOTIFY_FROM,
    },
  ];

  // --- Media stats ---
  const [mediaCount, mediaSize, byKind] = await Promise.all([
    prisma.media.count(),
    prisma.media.aggregate({ _sum: { sizeBytes: true } }),
    prisma.media.groupBy({ by: ['kind'], _count: { _all: true } }),
  ]);

  // --- Filesystem ---
  let fsInfo: { total: number; free: number; used: number } | null = null;
  try {
    const stats = await statfs(process.cwd());
    const total = stats.blocks * stats.bsize;
    const free = stats.bavail * stats.bsize;
    fsInfo = { total, free, used: total - free };
  } catch {
    // statfs not supported on this platform — skip
  }

  const runtime = {
    node: process.version,
    env: process.env.NODE_ENV ?? 'development',
    next: '16.3.5',
    prisma: '5.22.0',
  };

  return (
    <section>
      <div className="admin-top">
        <div>
          <p className="eyebrow">{t('admin.system.eyebrow')}</p>
          <h1 style={{ fontSize: '2rem' }}>{t('admin.system.title')}</h1>
        </div>
      </div>
      <p className="form-note" style={{ marginBottom: '1.5rem' }}>
        {t('admin.system.intro')}
      </p>

      {/* DB status */}
      <section className="admin-panel">
        <h2 className="admin-panel__title">
          {t('admin.system.db.title')}
        </h2>
        <div
          className={
            'admin-status-badge ' +
            (dbOk
              ? 'admin-status-badge--ok'
              : 'admin-status-badge--bad')
          }
        >
          {dbOk ? t('admin.system.db.ok') : t('admin.system.db.fail')}
        </div>
        {!dbOk && (
          <pre
            style={{
              marginTop: 12,
              padding: 12,
              background: '#FBE9E9',
              borderRadius: 6,
              fontSize: 12,
              color: '#B91C1C',
              overflowX: 'auto',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
          >
            {dbError}
          </pre>
        )}
      </section>

      {/* Migrations */}
      <section className="admin-panel">
        <h2 className="admin-panel__title">
          {t('admin.system.migrations.title')} · {migrationCount}
        </h2>
        {latestMigrations.length === 0 ? (
          <p className="form-note">
            {t('admin.system.migrations.empty')}
          </p>
        ) : (
          <ul className="admin-recent-list">
            {latestMigrations.map((m) => (
              <li key={m.migration_name} className="admin-recent-item">
                <code className="admin-recent-item__action">
                  {m.migration_name}
                </code>
                <span className="admin-recent-item__date">
                  {m.finished_at
                    ? new Date(m.finished_at).toLocaleString()
                    : '—'}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Environment variables */}
      <section className="admin-panel">
        <h2 className="admin-panel__title">
          {t('admin.system.env.title')}
        </h2>
        <ul className="admin-recent-list">
          {envChecks.map((e) => (
            <li key={e.label} className="admin-recent-item">
              <div className="admin-recent-item__main">
                <code className="admin-recent-item__action">{e.label}</code>
                {e.value && (
                  <span className="admin-recent-item__meta">{e.value}</span>
                )}
              </div>
              <div className="admin-recent-item__side">
                <span
                  className={
                    'admin-status-pill ' +
                    (e.present
                      ? 'admin-status-pill--won'
                      : e.required
                        ? 'admin-status-pill--lost'
                        : 'admin-status-pill--contacted')
                  }
                >
                  {e.present
                    ? t('admin.system.env.set')
                    : e.required
                      ? t('admin.system.env.missingRequired')
                      : t('admin.system.env.missingOptional')}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* Media */}
      <section className="admin-panel">
        <h2 className="admin-panel__title">
          {t('admin.system.media.title')}
        </h2>
        <div className="admin-health-grid">
          <div className="admin-health-item">
            <span className="admin-health-item__label">
              {t('admin.system.media.total')}
            </span>
            <span className="admin-health-item__value">{mediaCount}</span>
          </div>
          <div className="admin-health-item">
            <span className="admin-health-item__label">
              {t('admin.system.media.size')}
            </span>
            <span className="admin-health-item__value">
              {formatBytes(mediaSize._sum.sizeBytes ?? 0)}
            </span>
          </div>
          {byKind.map((k) => (
            <div className="admin-health-item" key={k.kind}>
              <span className="admin-health-item__label">{k.kind}</span>
              <span className="admin-health-item__value">
                {k._count._all}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Filesystem */}
      {fsInfo && (
        <section className="admin-panel">
          <h2 className="admin-panel__title">
            {t('admin.system.disk.title')}
          </h2>
          <div className="admin-health-grid">
            <div className="admin-health-item">
              <span className="admin-health-item__label">
                {t('admin.system.disk.total')}
              </span>
              <span className="admin-health-item__value">
                {formatBytes(fsInfo.total)}
              </span>
            </div>
            <div className="admin-health-item">
              <span className="admin-health-item__label">
                {t('admin.system.disk.used')}
              </span>
              <span className="admin-health-item__value">
                {formatBytes(fsInfo.used)}
              </span>
            </div>
            <div className="admin-health-item">
              <span className="admin-health-item__label">
                {t('admin.system.disk.free')}
              </span>
              <span className="admin-health-item__value">
                {formatBytes(fsInfo.free)}
              </span>
            </div>
          </div>
        </section>
      )}

      {/* Runtime */}
      <section className="admin-panel">
        <h2 className="admin-panel__title">
          {t('admin.system.runtime.title')}
        </h2>
        <ul className="admin-recent-list">
          <li className="admin-recent-item">
            <div className="admin-recent-item__main">
              <span className="admin-recent-item__meta">Node</span>
            </div>
            <span className="admin-recent-item__date">{runtime.node}</span>
          </li>
          <li className="admin-recent-item">
            <div className="admin-recent-item__main">
              <span className="admin-recent-item__meta">Next.js</span>
            </div>
            <span className="admin-recent-item__date">{runtime.next}</span>
          </li>
          <li className="admin-recent-item">
            <div className="admin-recent-item__main">
              <span className="admin-recent-item__meta">Prisma</span>
            </div>
            <span className="admin-recent-item__date">{runtime.prisma}</span>
          </li>
          <li className="admin-recent-item">
            <div className="admin-recent-item__main">
              <span className="admin-recent-item__meta">
                Environment
              </span>
            </div>
            <span className="admin-recent-item__date">{runtime.env}</span>
          </li>
        </ul>
      </section>
    </section>
  );
}