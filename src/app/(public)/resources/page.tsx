import { prisma } from '@/lib/db/prisma';
import { ContentIndex } from '@/components/public/content-index';
import { getServerT } from '@/lib/i18n/server';

export const dynamic = 'force-dynamic';

export default async function ResourcesPage() {
  const isPreview =
    process.env.NODE_ENV === 'development' &&
    process.env.PREVIEW_WITHOUT_DATABASE === 'true';

  const [items, { t }] = await Promise.all([
    isPreview
      ? Promise.resolve([])
      : prisma.resource.findMany({
          where: { published: true },
          orderBy: { publishedAt: 'desc' },
        }),
    getServerT(),
  ]);

  return (
    <ContentIndex
      title={t('resources.title')}
      eyebrow={t('resources.eyebrow')}
      description={t('resources.description')}
      items={items}
      path="/resources"
      viewLabel={t('cta.learnMore')}
      emptyTitle={t('empty.genericTitle')}
      emptyBody={t('empty.genericBody')}
    />
  );
}