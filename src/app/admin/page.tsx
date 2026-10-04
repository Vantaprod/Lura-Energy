import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { INITIAL_ADMIN_SEAT_LIMIT } from '@/lib/auth/admin-capacity';
import { getServerT } from '@/lib/i18n/server';

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
  const user = await getCurrentUser();
  if (!user) redirect('/admin/login');

  const [products, projects, leads, newLeads, capacity, { t }] = await Promise.all([
    prisma.product.count(),
    prisma.project.count(),
    prisma.lead.count(),
    prisma.lead.count({ where: { status: 'NEW' } }),
    prisma.setting.findUnique({ where: { key: 'adminSeatLimit' } }),
    getServerT('admin'),
  ]);

  const seatLimit =
    typeof capacity?.value === 'number' ? capacity.value : INITIAL_ADMIN_SEAT_LIMIT;

  return (
    <section>
      <p className="eyebrow">{t('admin.dashboard.eyebrow')}</p>
      <h1 style={{ fontSize: 'clamp(2.5rem,5vw,4.5rem)' }}>
        {t('admin.dashboard.welcome')}, {user.name.split(' ')[0]}.
      </h1>
      <div className="stats">
        <div className="stat">
          <strong>{products}</strong>
          {t('admin.dashboard.products')}
        </div>
        <div className="stat">
          <strong>{projects}</strong>
          {t('admin.dashboard.projects')}
        </div>
        <div className="stat">
          <strong>{newLeads}</strong>
          {t('admin.dashboard.newEnquiries')} {'\u00B7'} {leads} {t('admin.dashboard.total')}
        </div>
      </div>
      <div className="empty-panel">
        <strong>{t('admin.dashboard.contentNoteTitle')}</strong>
        {t('admin.dashboard.contentNoteBody')} {t('admin.dashboard.seatCapacity')}: {seatLimit}.
      </div>
    </section>
  );
}