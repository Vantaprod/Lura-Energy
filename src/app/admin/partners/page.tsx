import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/session';
import { PartnersManager } from '@/components/admin/partners-manager';
import { getServerT } from '@/lib/i18n/server';

export default async function PartnersPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/admin/login');

  const { t } = await getServerT('admin');

  return (
    <section>
      <p className="eyebrow">{t('admin.partners.eyebrow')}</p>
      <h1 style={{ fontSize: '3rem' }}>{t('admin.partners.title')}</h1>
      <p className="form-note">{t('admin.partners.intro')}</p>
      <PartnersManager />
    </section>
  );
}