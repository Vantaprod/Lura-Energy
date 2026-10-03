import { prisma } from '@/lib/db/prisma';
import { ContentIndex } from '@/components/public/content-index';
import { getServerT } from '@/lib/i18n/server';

export const dynamic = 'force-dynamic';

export default async function ProjectsPage() {
  const isPreview =
    process.env.NODE_ENV === 'development' &&
    process.env.PREVIEW_WITHOUT_DATABASE === 'true';

  const [items, { t }] = await Promise.all([
    isPreview
      ? Promise.resolve([])
      : prisma.project.findMany({
          where: { published: true },
          include: { media: true },
          orderBy: { sortOrder: 'asc' },
        }),
    getServerT(),
  ]);

  return (
    <ContentIndex
      title={t('projects.title')}
      eyebrow={t('projects.eyebrow')}
      description={t('projects.description')}
      items={items}
      path="/projects"
      viewLabel={t('cta.viewProject')}
      emptyTitle={t('empty.projectsTitle')}
      emptyBody={t('empty.projectsBody')}
    />
  );
}