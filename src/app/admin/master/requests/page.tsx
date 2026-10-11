import { prisma } from '@/lib/db/prisma';
import { requireMaster } from '@/lib/auth/require-master';
import { AccessRequestRow } from '@/components/admin/access-request-row';
import { getServerT } from '@/lib/i18n/server';

export const dynamic = 'force-dynamic';

function fill(template: string, vars: Record<string, string | number>): string {
  return Object.entries(vars).reduce(
    (acc, [k, v]) => acc.replaceAll(`{${k}}`, String(v)),
    template,
  );
}

export default async function RequestsPage() {
  await requireMaster();
  const { t } = await getServerT('admin');

  const [pending, resolved] = await Promise.all([
    prisma.accessRequest.findMany({
      where: { status: 'PENDING' },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.accessRequest.findMany({
      where: { status: { in: ['APPROVED', 'REJECTED'] } },
      orderBy: { reviewedAt: 'desc' },
      take: 30,
    }),
  ]);

  const toItem = (r: typeof pending[number]) => ({
    id: r.id,
    fullName: r.fullName,
    email: r.email,
    phone: r.phone,
    role: r.role,
    reason: r.reason,
    status: r.status as 'PENDING' | 'APPROVED' | 'REJECTED',
    rejectionReason: r.rejectionReason,
    createdAt: r.createdAt.toISOString(),
    reviewedAt: r.reviewedAt ? r.reviewedAt.toISOString() : null,
  });

  return (
    <>
      <p className="eyebrow">{t('master.requests.eyebrow')}</p>
      <h2 className="master-h2">{t('master.requests.title')}</h2>
      <p className="master-meta">{t('master.requests.subtitle')}</p>

      <section className="master-section">
        <h3 className="master-h3">{fill(t('master.requests.pending'), { n: pending.length })}</h3>
        {pending.length === 0 ? (
          <p className="master-empty">{t('master.requests.nonePending')}</p>
        ) : (
          <ul className="ar-list">
            {pending.map((r) => <AccessRequestRow key={r.id} item={toItem(r)} />)}
          </ul>
        )}
      </section>

      <section className="master-section">
        <h3 className="master-h3">{fill(t('master.requests.reviewed'), { n: resolved.length })}</h3>
        {resolved.length === 0 ? (
          <p className="master-empty">{t('master.requests.noneReviewed')}</p>
        ) : (
          <ul className="ar-list">
            {resolved.map((r) => <AccessRequestRow key={r.id} item={toItem(r)} />)}
          </ul>
        )}
      </section>
    </>
  );
}