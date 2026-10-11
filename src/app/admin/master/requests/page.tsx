import { prisma } from '@/lib/db/prisma';
import { requireMaster } from '@/lib/auth/require-master';
import { AccessRequestRow } from '@/components/admin/access-request-row';

export const dynamic = 'force-dynamic';

export default async function RequestsPage() {
  await requireMaster();

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
    reason: r.reason,
    status: r.status as 'PENDING' | 'APPROVED' | 'REJECTED',
    rejectionReason: r.rejectionReason,
    createdAt: r.createdAt.toISOString(),
    reviewedAt: r.reviewedAt ? r.reviewedAt.toISOString() : null,
  });

  return (
    <>
      <p className="eyebrow">ACCESS REQUESTS</p>
      <h2 className="master-h2">Approval queue</h2>
      <p className="master-meta">
        Public requests arrive from <code>/admin/request-access</code>. Approving creates an ADMIN login and shows a one-time temporary password.
      </p>

      <section className="master-section">
        <h3 className="master-h3">Pending ({pending.length})</h3>
        {pending.length === 0 ? (
          <p className="master-empty">No pending requests.</p>
        ) : (
          <ul className="ar-list">
            {pending.map((r) => <AccessRequestRow key={r.id} item={toItem(r)} />)}
          </ul>
        )}
      </section>

      <section className="master-section">
        <h3 className="master-h3">Recently reviewed ({resolved.length})</h3>
        {resolved.length === 0 ? (
          <p className="master-empty">Nothing reviewed yet.</p>
        ) : (
          <ul className="ar-list">
            {resolved.map((r) => <AccessRequestRow key={r.id} item={toItem(r)} />)}
          </ul>
        )}
      </section>
    </>
  );
}