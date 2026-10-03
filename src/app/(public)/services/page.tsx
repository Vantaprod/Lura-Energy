import { prisma } from '@/lib/db/prisma';
import { ContentIndex } from '@/components/public/content-index';
import { getServerT } from '@/lib/i18n/server';

export const dynamic = 'force-dynamic';

export default async function ServicesPage() {
  const isPreview =
    process.env.NODE_ENV === 'development' &&
    process.env.PREVIEW_WITHOUT_DATABASE === 'true';

  const [items, { t }] = await Promise.all([
    isPreview
      ? Promise.resolve([])
      : prisma.service.findMany({
          where: { published: true },
          orderBy: { sortOrder: 'asc' },
        }),
    getServerT(),
  ]);

  return (
    <ContentIndex
      title={t('services.title')}
      eyebrow={t('services.eyebrow')}
      description={t('services.description')}
      items={items}
      path="/services"
      viewLabel={t('cta.viewService')}
      emptyTitle={t('empty.servicesTitle')}
      emptyBody={t('empty.servicesBody')}
    />
  );
}