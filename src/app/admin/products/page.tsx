import { ProductsManager } from '@/components/admin/products-manager';
import { getCurrentUser } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { getServerT } from '@/lib/i18n/server';

export default async function AdminProducts() {
  const user = await getCurrentUser();
  if (!user) redirect('/admin/login');

  const { t } = await getServerT('admin');

  return (
    <section>
      <p className="eyebrow">{t('admin.prod.eyebrow')}</p>
      <h1 style={{ fontSize: '3rem' }}>{t('admin.prod.title')}</h1>
      <p className="form-note">{t('admin.prod.intro')}</p>
      <ProductsManager />
    </section>
  );
}