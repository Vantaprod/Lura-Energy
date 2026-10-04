import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { getServerT } from '@/lib/i18n/server';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Audit log' };

export default async function AuditLogPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/admin/login');
  if (user.role !== 'OWNER') redirect('/admin');

  const [entries, { t }] = await Promise.all([
    prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: { actor: { select: { name: true, email: true } } },
    }),
    getServerT('admin'),
  ]);

  return (
    <div className="admin-shell">
      <div className="admin-top">
        <div>
          <p className="eyebrow">{t('admin.audit.eyebrow')}</p>
          <h1 style={{ fontSize: '2rem' }}>{t('admin.audit.title')}</h1>
        </div>
      </div>
      <p className="form-note" style={{ marginBottom: '1.5rem' }}>
        {t('admin.audit.intro')}
      </p>

      {entries.length === 0 ? (
        <div className="empty-panel">
          <strong>{t('admin.audit.empty')}</strong>
        </div>
      ) : (
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
                  <td style={{ whiteSpace: 'nowrap' }}>
                    {new Date(entry.createdAt).toLocaleString()}
                  </td>
                  <td>
                    {entry.actor?.name ?? '-'}
                    {entry.actor?.email && (
                      <div className="form-note">{entry.actor.email}</div>
                    )}
                  </td>
                  <td>
                    <code style={{ fontSize: '12px' }}>{entry.action}</code>
                  </td>
                  <td>
                    {entry.entityType}
                    {entry.entityId && (
                      <div className="form-note" style={{ fontSize: '11px' }}>
                        {entry.entityId}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}