import { redirect, notFound } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/session';
import { ContentManager } from '@/components/admin/content-manager';
import { getServerT } from '@/lib/i18n/server';

const titleKeys: Record<string, string> = {
  'product-categories': 'admin.cms.title.productCategories',
  services: 'admin.cms.title.services',
  solutions: 'admin.cms.title.solutions',
  testimonials: 'admin.cms.title.testimonials',
  faqs: 'admin.cms.title.faqs',
  resources: 'admin.cms.title.resources',
  media: 'admin.cms.title.media',
};

export default async function AdminCollection({
  params,
}: {
  params: Promise<{ collection: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect('/admin/login');

  const { collection } = await params;
  const titleKey = titleKeys[collection];
  if (!titleKey) notFound();

  const { t } = await getServerT('admin');

  return (
    <section>
      <p className="eyebrow">{t('admin.cms.eyebrow')}</p>
      <h1 style={{ fontSize: '3rem' }}>{t(titleKey)}</h1>
      <p className="form-note">{t('admin.cms.intro')}</p>
      <ContentManager collection={collection} />
    </section>
  );
}