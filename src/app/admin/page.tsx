import Link from 'next/link';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { INITIAL_ADMIN_SEAT_LIMIT } from '@/lib/auth/admin-capacity';
import { getServerT } from '@/lib/i18n/server';
import { PresenceCard } from '@/components/admin/presence-card';

export const dynamic = 'force-dynamic';

type LeadStatus = 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'QUOTED' | 'WON' | 'LOST';
const LEAD_STATUSES: LeadStatus[] = [
  'NEW',
  'CONTACTED',
  'QUALIFIED',
  'QUOTED',
  'WON',
  'LOST',
];

function formatBytes(bytes: number | null | undefined): string {
  if (!bytes || bytes < 1) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  let i = 0;
  let n = bytes;
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i++;
  }
  return `${n.toFixed(n >= 10 || i === 0 ? 0 : 1)} ${units[i]}`;
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
  }).format(date);
}

function fill(template: string, vars: Record<string, string | number>): string {
  return Object.entries(vars).reduce(
    (acc, [key, value]) => acc.replaceAll(`{${key}}`, String(value)),
    template,
  );
}

export default async function AdminDashboard() {
  const user = await getCurrentUser();
  if (!user) redirect('/admin/login');

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [
    productTotal,
    productPublished,
    projectTotal,
    projectPublished,
    serviceTotal,
    servicePublished,
    solutionTotal,
    solutionPublished,
    leadTotal,
    newLeadsThisWeek,
    leadsByStatus,
    mediaTotal,
    mediaByKind,
    mediaSizeAgg,
    recentLeads,
    recentAudit,
    capacity,
    { t },
  ] = await Promise.all([
    prisma.product.count(),
    prisma.product.count({ where: { published: true } }),
    prisma.project.count(),
    prisma.project.count({ where: { published: true } }),
    prisma.service.count(),
    prisma.service.count({ where: { published: true } }),
    prisma.solution.count(),
    prisma.solution.count({ where: { published: true } }),
    prisma.lead.count(),
    prisma.lead.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
    prisma.lead.groupBy({ by: ['status'], _count: { _all: true } }),
    prisma.media.count(),
    prisma.media.groupBy({ by: ['kind'], _count: { _all: true } }),
    prisma.media.aggregate({ _sum: { sizeBytes: true } }),
    prisma.lead.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
        createdAt: true,
        message: true,
      },
    }),
    prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 8,
      include: { actor: { select: { name: true } } },
    }),
    prisma.setting.findUnique({ where: { key: 'adminSeatLimit' } }),
    getServerT('admin'),
  ]);

  const productDraft = productTotal - productPublished;
  const projectDraft = projectTotal - projectPublished;

  const seatLimit =
    typeof capacity?.value === 'number' ? capacity.value : INITIAL_ADMIN_SEAT_LIMIT;

  // Lead status counts as a map for quick lookup
  const leadCountMap = new Map<LeadStatus, number>(
    LEAD_STATUSES.map((s) => [s, 0]),
  );
  for (const row of leadsByStatus) {
    leadCountMap.set(row.status as LeadStatus, row._count._all);
  }
  const leadMax = Math.max(1, ...[...leadCountMap.values()]);

  // Media kind breakdown
  const mediaImageCount =
    mediaByKind.find((r) => r.kind === 'IMAGE')?._count._all ?? 0;
  const mediaVideoCount =
    mediaByKind.find((r) => r.kind === 'VIDEO')?._count._all ?? 0;
  const mediaDocCount =
    mediaByKind.find((r) => r.kind === 'DOCUMENT')?._count._all ?? 0;
  const mediaTotalSize = mediaSizeAgg._sum.sizeBytes ?? 0;

  const firstName = user.name.split(' ')[0];

  return (
    <section>
      <p className="eyebrow">{t('admin.dashboard.eyebrow')}</p>
      <h1 style={{ fontSize: 'clamp(2.2rem,4vw,3.5rem)', marginBottom: '2rem' }}>
        {t('admin.dashboard.welcome')}, {firstName}.
      </h1>

      <PresenceCard />

      {/* ============ TOP STAT GRID ============ */}
      <div className="admin-stat-grid">
        <article className="admin-stat-card">
          <span className="admin-stat-card__label">
            {t('admin.dashboard.products')}
          </span>
          <strong className="admin-stat-card__value">{productTotal}</strong>
          <span className="admin-stat-card__hint">
            {fill(t('admin.dashboard.hint.publishedDraft'), {
              published: productPublished,
              draft: productDraft,
            })}
          </span>
        </article>

        <article className="admin-stat-card">
          <span className="admin-stat-card__label">
            {t('admin.dashboard.newEnquiries')}
          </span>
          <strong className="admin-stat-card__value">{leadTotal}</strong>
          <span className="admin-stat-card__hint">
            {fill(t('admin.dashboard.hint.newThisWeek'), {
              n: newLeadsThisWeek,
            })}
          </span>
        </article>

        <article className="admin-stat-card">
          <span className="admin-stat-card__label">
            {t('admin.dashboard.projects')}
          </span>
          <strong className="admin-stat-card__value">{projectTotal}</strong>
          <span className="admin-stat-card__hint">
            {fill(t('admin.dashboard.hint.publishedDraft'), {
              published: projectPublished,
              draft: projectDraft,
            })}
          </span>
        </article>

        <article className="admin-stat-card">
          <span className="admin-stat-card__label">
            {t('admin.dashboard.mediaLabel')}
          </span>
          <strong className="admin-stat-card__value">{mediaTotal}</strong>
          <span className="admin-stat-card__hint">
            {fill(t('admin.dashboard.hint.totalSize'), {
              size: formatBytes(mediaTotalSize),
            })}
          </span>
        </article>
      </div>

      {/* ============ CATALOG HEALTH ============ */}
      <section className="admin-panel">
        <h2 className="admin-panel__title">
          {t('admin.dashboard.catalogTitle')}
        </h2>
        <div className="admin-health-grid">
          <div className="admin-health-item">
            <span className="admin-health-item__label">
              {t('admin.dashboard.products')}
            </span>
            <span className="admin-health-item__value">
              {productPublished} / {productTotal}
            </span>
          </div>
          <div className="admin-health-item">
            <span className="admin-health-item__label">
              {t('admin.dashboard.services')}
            </span>
            <span className="admin-health-item__value">
              {servicePublished} / {serviceTotal}
            </span>
          </div>
          <div className="admin-health-item">
            <span className="admin-health-item__label">
              {t('admin.dashboard.solutions')}
            </span>
            <span className="admin-health-item__value">
              {solutionPublished} / {solutionTotal}
            </span>
          </div>
          <div className="admin-health-item">
            <span className="admin-health-item__label">
              {t('admin.dashboard.mediaLabel')}
            </span>
            <span className="admin-health-item__value">
              {mediaImageCount} IMG · {mediaVideoCount} VID · {mediaDocCount} DOC
            </span>
          </div>
        </div>
      </section>

      {/* ============ TWO-COLUMN: LEADS + ACTIVITY ============ */}
      <div className="admin-two-col">
        <section className="admin-panel">
          <h2 className="admin-panel__title">
            {t('admin.dashboard.breakdown.title')}
          </h2>
          <div className="admin-breakdown">
            {LEAD_STATUSES.map((status) => {
              const count = leadCountMap.get(status) ?? 0;
              const pct = Math.round((count / leadMax) * 100);
              return (
                <div className="admin-breakdown__row" key={status}>
                  <span className="admin-breakdown__label">
                    {t(`admin.leads.status.${status}`)}
                  </span>
                  <div className="admin-breakdown__bar">
                    <div
                      className={
                        'admin-breakdown__fill admin-breakdown__fill--' +
                        status.toLowerCase()
                      }
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="admin-breakdown__count">{count}</span>
                </div>
              );
            })}
          </div>
        </section>

        <section className="admin-panel">
          <h2 className="admin-panel__title">
            {t('admin.dashboard.recentLeads.title')}
          </h2>
          {recentLeads.length === 0 ? (
            <p className="form-note">{t('admin.dashboard.recentLeads.empty')}</p>
          ) : (
            <ul className="admin-recent-list">
              {recentLeads.map((lead) => (
                <li key={lead.id} className="admin-recent-item">
                  <div className="admin-recent-item__main">
                    <strong>{lead.name}</strong>
                    <span className="admin-recent-item__meta">
                      {lead.email}
                    </span>
                  </div>
                  <div className="admin-recent-item__side">
                    <span
                      className={
                        'admin-status-pill admin-status-pill--' +
                        lead.status.toLowerCase()
                      }
                    >
                      {t(`admin.leads.status.${lead.status}`)}
                    </span>
                    <span className="admin-recent-item__date">
                      {formatDate(lead.createdAt)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <Link
            href="/admin/leads"
            className="admin-panel__link"
          >
            {t('admin.dashboard.recentLeads.viewAll')} {'\u2192'}
          </Link>
        </section>
      </div>

      {/* ============ RECENT ACTIVITY ============ */}
      <section className="admin-panel">
        <h2 className="admin-panel__title">
          {t('admin.dashboard.recentActivity.title')}
        </h2>
        {recentAudit.length === 0 ? (
          <p className="form-note">
            {t('admin.dashboard.recentActivity.empty')}
          </p>
        ) : (
          <ul className="admin-recent-list">
            {recentAudit.map((entry) => (
              <li key={entry.id} className="admin-recent-item">
                <div className="admin-recent-item__main">
                  <code className="admin-recent-item__action">
                    {entry.action}
                  </code>
                  <span className="admin-recent-item__meta">
                    {entry.actor?.name ??
                      t('admin.dashboard.recentActivity.systemActor')}
                  </span>
                </div>
                <div className="admin-recent-item__side">
                  <span className="admin-recent-item__date">
                    {formatDate(entry.createdAt)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ============ CONTENT NOTE ============ */}
      <div className="empty-panel">
        <strong>{t('admin.dashboard.contentNoteTitle')}</strong>
        {t('admin.dashboard.contentNoteBody')}{' '}
        {t('admin.dashboard.seatCapacity')}: {seatLimit}.
      </div>
    </section>
  );
}