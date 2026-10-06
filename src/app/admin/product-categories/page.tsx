import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/session';
import { SeriesManager } from '@/components/admin/series-manager';
import { getServerT } from '@/lib/i18n/server';

export default async function AdminProductCategories() {
  const user = await getCurrentUser();
  if (!user) redirect('/admin/login');

  const { t } = await getServerT('admin');

  return (
    <section>
      <p className="eyebrow">{t('admin.series.eyebrow')}</p>
      <h1 style={{ fontSize: '3rem' }}>{t('admin.series.title')}</h1>
      <p className="form-note">{t('admin.series.intro')}</p>
      <SeriesManager />
    </section>
  );
}