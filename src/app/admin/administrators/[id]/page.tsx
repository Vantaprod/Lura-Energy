import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/auth/session';
import { getServerT } from '@/lib/i18n/server';

export const dynamic = 'force-dynamic';

const ACTION_LIMIT = 50;

function formatDate(d: Date): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

export default async function AdminActivityPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const me = await getCurrentUser();
  if (!me) redirect('/admin/login');
  if (me.role !== 'OWNER') redirect('/admin');

  const { id } = await params;
  const { t } = await getServerT('admin');

  const target = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      active: true,
      createdAt: true,
      lastLoginAt: true,
    },
  });
  if (!target) notFound();

  const [actionCount, recentActions, activeSessions, pendingInvitesSent] =
    await Promise.all([
      prisma.auditLog.count({ where: { actorId: id } }),
      prisma.auditLog.findMany({
        where: { actorId: id },
        orderBy: { createdAt: 'desc' },
        take: ACTION_LIMIT,
      }),
      prisma.session.count({
        where: { userId: id, expiresAt: { gt: new Date() } },
      }),
      prisma.adminInvitation.count({
        where: {
          inviterId: id,
          usedAt: null,
          expiresAt: { gt: new Date() },
        },
      }),
    ]);

  return (
    <section>
      <div className="admin-top">
        <div>
          <p className="eyebrow">{t('admin.admins.activity.eyebrow')}</p>
          <h1 style={{ fontSize: '2rem' }}>{target.name}</h1>
          <p className="form-note">{target.email}</p>
        </div>
        <Link href="/admin/administrators" className="admin-action">
          {t('admin.admins.activity.back')}
        </Link>
      </div>

      <div className="admin-stat-grid" style={{ marginBottom: 28 }}>
        <article className="admin-stat-card">
          <span className="admin-stat-card__label">
            {t('admin.admins.activity.actions')}
          </span>
          <strong className="admin-stat-card__value">{actionCount}</strong>
        </article>
        <article className="admin-stat-card">
          <span className="admin-stat-card__label">
            {t('admin.admins.activity.sessions')}
          </span>
          <strong className="admin-stat-card__value">{activeSessions}</strong>
        </article>
        <article className="admin-stat-card">
          <span className="admin-stat-card__label">
            {t('admin.admins.activity.role')}
          </span>
          <strong
            className="admin-stat-card__value"
            style={{ fontSize: '22px' }}
          >
            {target.role}
          </strong>
        </article>
        <article className="admin-stat-card">
          <span className="admin-stat-card__label">
            {t('admin.admins.activity.status')}
          </span>
          <strong
            className="admin-stat-card__value"
            style={{ fontSize: '22px' }}
          >
            {target.active
              ? t('admin.admins.status.active')
              : t('admin.admins.status.disabled')}
          </strong>
        </article>
      </div>

      <section className="admin-panel">
        <h2 className="admin-panel__title">
          {t('admin.admins.activity.timeline')}
        </h2>
        <p className="form-note" style={{ marginBottom: 14 }}>
          {t('admin.admins.activity.lastLogin')}:{' '}
          {target.lastLoginAt
            ? formatDate(target.lastLoginAt)
            : t('admin.admins.status.never')}
          {' · '}
          {t('admin.admins.activity.createdAt')}:{' '}
          {formatDate(target.createdAt)}
          {pendingInvitesSent > 0 && (
            <>
              {' · '}
              {pendingInvitesSent} {t('admin.admins.activity.pendingInvites')}
            </>
          )}
        </p>

        {recentActions.length === 0 ? (
          <p className="form-note">{t('admin.admins.activity.empty')}</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>{t('admin.audit.colTime')}</th>
                  <th>{t('admin.audit.colAction')}</th>
                  <th>{t('admin.audit.colEntity')}</th>
                </tr>
              </thead>
              <tbody>
                {recentActions.map((entry) => (
                  <tr key={entry.id}>
                    <td
                      style={{ whiteSpace: 'nowrap', fontSize: '12.5px' }}
                    >
                      {formatDate(entry.createdAt)}
                    </td>
                    <td>
                      <code className="audit-action-chip">
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
        )}
      </section>
    </section>
  );
}