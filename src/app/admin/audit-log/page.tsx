import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { getServerT } from '@/lib/i18n/server';
import Link from 'next/link';
import { AuditLogFilters } from '@/components/admin/audit-log-filters';
import { AuditLogTable, type AuditEntry } from '@/components/admin/audit-log-table';

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
  const actorId = typeof sp.actor === 'string' ? sp.actor : '';
  const pageRaw = typeof sp.page === 'string' ? Number(sp.page) : 1;
  const page = Number.isFinite(pageRaw) && pageRaw > 0 ? Math.floor(pageRaw) : 1;

  const since = rangeToDate(range);

  const where: Record<string, unknown> = {};
  if (since) where.createdAt = { gte: since };
  if (actorId) where.actorId = actorId;
  if (q) {
    where.OR = [
      { action: { contains: q, mode: 'insensitive' } },
      { entityType: { contains: q, mode: 'insensitive' } },
      { entityId: { contains: q, mode: 'insensitive' } },
      { actor: { name: { contains: q, mode: 'insensitive' } } },
      { actor: { email: { contains: q, mode: 'insensitive' } } },
    ];
  }

  const [{ t }, total, entries, distinctActors] = await Promise.all([
    getServerT('admin'),
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { actor: { select: { id: true, name: true, email: true } } },
    }),
    prisma.auditLog.findMany({
      where: { actorId: { not: null } },
      distinct: ['actorId'],
      select: { actorId: true },
      take: 500,
    }),
  ]);

  const actorIds = distinctActors
    .map((d) => d.actorId)
    .filter((id): id is string => Boolean(id));
  const actorRecords = actorIds.length
    ? await prisma.user.findMany({
        where: { id: { in: actorIds } },
        select: { id: true, name: true, email: true },
      })
    : [];
  actorRecords.sort((a, b) =>
    (a.name || a.email).localeCompare(b.name || b.email),
  );

  const serialized: AuditEntry[] = entries.map((e) => ({
    id: e.id,
    createdAtIso: e.createdAt.toISOString(),
    action: e.action,
    entityType: e.entityType,
    entityId: e.entityId,
    ipAddress: e.ipAddress,
    metadata: e.metadata,
    actor: e.actor
      ? { id: e.actor.id, name: e.actor.name, email: e.actor.email }
      : null,
  }));

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);

  function pageHref(p: number): string {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (range !== 'all') params.set('range', range);
    if (actorId) params.set('actor', actorId);
    if (p > 1) params.set('page', String(p));
    const qs = params.toString();
    return '/admin/audit-log' + (qs ? '?' + qs : '');
  }

  const hasFilters = Boolean(q) || range !== 'all' || Boolean(actorId);

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

      <AuditLogFilters actors={actorRecords} />

      <p
        className="form-note"
        aria-live="polite"
        style={{ marginBottom: '1rem' }}
      >
        {total}{' '}
        {total === 1 ? t('admin.audit.countOne') : t('admin.audit.countMany')}
        {hasFilters ? ' · ' + t('admin.audit.filtered') : ''}
      </p>

      {entries.length === 0 ? (
        <div className="empty-panel">
          <strong>
            {hasFilters
              ? t('admin.audit.emptyFiltered')
              : t('admin.audit.empty')}
          </strong>
        </div>
      ) : (
        <>
          <AuditLogTable entries={serialized} />

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