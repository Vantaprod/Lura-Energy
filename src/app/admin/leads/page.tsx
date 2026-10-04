import { LeadsManager } from '@/components/admin/leads-manager';
import { getCurrentUser } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { getServerT } from '@/lib/i18n/server';

export default async function AdminLeads() {
  if (!(await getCurrentUser())) redirect('/admin/login');

  const { t } = await getServerT('admin');

  return (
    <section>
      <p className="eyebrow">{t('admin.leads.eyebrow')}</p>
      <h1 style={{ fontSize: '3rem' }}>{t('admin.leads.title')}</h1>
      <LeadsManager />
    </section>
  );
}