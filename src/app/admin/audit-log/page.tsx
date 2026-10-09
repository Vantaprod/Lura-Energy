import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { getServerT } from '@/lib/i18n/server';
import Link from 'next/link';
import { AuditLogFilters } from '@/components/admin/audit-log-filters';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Audit log' };

const PAGE_SIZE = 50;

function rangeToDate(range: string | undefined): Date | null {
  if (!range || range === 'all') return null;
  const now = Date.now();
  if (range === '24h') return new Date(now - 24 * 60 * 60 * 1000);
  if (range === '7d') return new Date(now - 7 * 24 * 60 * 60 * 1000);
  if (range === '30d') return new Date(now - 30 * 24 * 60 * 60 * 1000);
  return null;
}

function formatDate(d: Date): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(d);
}

export default async function AuditLogPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect('/admin/login');
  if (user.role !== 'OWNER') redirect('/admin');

  const sp = await searchParams;
  const q = typeof sp.q === 'string' ? sp.q.trim().slice(0, 120) : '';
  const range = typeof sp.range === 'string' ? sp.range : 'all';
  const pageRaw = typeof sp.page === 'string' ? Number(sp.page) : 1;
  const page = Number.isFinite(pageRaw) && pageRaw > 0 ? Math.floor(pageRaw) : 1;

  const since = rangeToDate(range);

  const where: Record<string, unknown> = {};
  if (since) where.createdAt = { gte: since };
  if (q) {
    where.OR = [
      { action: { contains: q, mode: 'insensitive' } },
      { entityType: { contains: q, mode: 'insensitive' } },
      { entityId: { contains: q, mode: 'insensitive' } },
      { actor: { name: { contains: q, mode: 'insensitive' } } },
      { actor: { email: { contains: q, mode: 'insensitive' } } },
    ];
  }

  const [{ t }, total, entries] = await Promise.all([
    getServerT('admin'),
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { actor: { select: { name: true, email: true } } },
    }),
  ]);

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);

  // Build pagination links preserving filters
  function pageHref(p: number): string {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (range !== 'all') params.set('range', range);
    if (p > 1) params.set('page', String(p));
    const qs = params.toString();
    return '/admin/audit-log' + (qs ? '?' + qs : '');
  }

  const hasFilters = Boolean(q) || range !== 'all';

  return (
    <div className="admin-shell">
      <div className="admin-top">
        <div>
          <p className="eyebrow">{t('admin.audit.eyebrow')}</p>
          <h1 style={{ fontSize: '2rem' }}>{t('admin.audit.title')}</h1>
        </div>
      </div>
      <p className="form-note" style={{ marginBottom: '1.25rem' }}>
        {t('admin.audit.intro')}
      </p>

      <AuditLogFilters />

      <p className="form-note" aria-live="polite" style={{ marginBottom: '1rem' }}>
        {total}{' '}
        {total === 1 ? t('admin.audit.countOne') : t('admin.audit.countMany')}
        {hasFilters ? ' · ' + t('admin.audit.filtered') : ''}
      </p>

      {entries.length === 0 ? (
        <div className="empty-panel">
          <strong>
            {hasFilters ? t('admin.audit.emptyFiltered') : t('admin.audit.empty')}
          </strong>
        </div>
      ) : (
        <>
          <div style={{ overflowX: 'auto' }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>{t('admin.audit.colTime')}</th>
                  <th>{t('admin.audit.colActor')}</th>
                  <th>{t('admin.audit.colAction')}</th>
                  <th>{t('admin.audit.colEntity')}</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr key={entry.id}>
                    <td style={{ whiteSpace: 'nowrap', fontSize: '12.5px' }}>
                      {formatDate(entry.createdAt)}
                    </td>
                    <td>
                      {entry.actor?.name ?? t('admin.audit.systemActor')}
                      {entry.actor?.email && (
                        <div className="form-note" style={{ fontSize: '11.5px' }}>
                          {entry.actor.email}
                        </div>
                      )}
                    </td>
                    <td>
                      <code
                        style={{
                          fontSize: '11.5px',
                          background: '#EEF1F7',
                          color: '#0A1550',
                          padding: '2px 6px',
                          borderRadius: '4px',
                        }}
                      >
                        {entry.action}
                      </code>
                    </td>
                    <td>
                      {entry.entityType}
                      {entry.entityId && (
                        <div
                          className="form-note"
                          style={{
                            fontSize: '11px',
                            fontFamily: 'ui-monospace, monospace',
                          }}
                        >
                          {entry.entityId.slice(-8)}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pageCount > 1 && (
            <nav
              className="pagination"
              aria-label={t('aria.pagination.audit')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                marginTop: '1.5rem',
              }}
            >
              <Link
                href={pageHref(safePage - 1)}
                aria-disabled={safePage <= 1}
                className="admin-action"
                style={{
                  pointerEvents: safePage <= 1 ? 'none' : 'auto',
                  opacity: safePage <= 1 ? 0.4 : 1,
                }}
              >
                {t('admin.audit.pagination.previous')}
              </Link>
              <span className="form-note">
                {safePage} / {pageCount}
              </span>
              <Link
                href={pageHref(safePage + 1)}
                aria-disabled={safePage >= pageCount}
                className="admin-action"
                style={{
                  pointerEvents: safePage >= pageCount ? 'none' : 'auto',
                  opacity: safePage >= pageCount ? 0.4 : 1,
                }}
              >
                {t('admin.audit.pagination.next')}
              </Link>
            </nav>
          )}
        </>
      )}
    </div>
  );
}