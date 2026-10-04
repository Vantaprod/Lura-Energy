import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/session';
import { AdminsManager } from '@/components/admin/admins-manager';
import { getServerT } from '@/lib/i18n/server';

export default async function AdministratorsPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/admin/login');
  if (user.role !== 'OWNER') redirect('/admin');

  const { t } = await getServerT('admin');

  return (
    <section>
      <p className="eyebrow">{t('admin.admins.eyebrow')}</p>
      <h1 style={{ fontSize: '3rem' }}>{t('admin.admins.title')}</h1>
      <p className="form-note">{t('admin.admins.intro')}</p>
      <AdminsManager />
    </section>
  );
}