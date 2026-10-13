import { prisma } from '@/lib/db/prisma';
import { ContentIndex } from '@/components/public/content-index';
import { getServerT } from '@/lib/i18n/server';

export const revalidate = 300;

export default async function SolutionsPage() {
  const isPreview =
    process.env.NODE_ENV === 'development' &&
    process.env.PREVIEW_WITHOUT_DATABASE === 'true';

  const [items, { t }] = await Promise.all([
    isPreview
      ? Promise.resolve([])
      : prisma.solution.findMany({
          where: { published: true },
          include: { media: { orderBy: { createdAt: 'asc' } } },
          orderBy: { sortOrder: 'asc' },
        }),
    getServerT(),
  ]);

  return (
    <ContentIndex
      title={t('solutions.title')}
      eyebrow={t('solutions.eyebrow')}
      description={t('solutions.description')}
      items={items}
      path="/solutions"
      viewLabel={t('cta.viewSolution')}
      emptyTitle={t('empty.solutionsTitle')}
      emptyBody={t('empty.solutionsBody')}
    />
  );
}