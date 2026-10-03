import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db/prisma';
import type { Metadata } from 'next';
import { getServerT } from '@/lib/i18n/server';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  if (
    process.env.NODE_ENV === 'development' &&
    process.env.PREVIEW_WITHOUT_DATABASE === 'true'
  ) {
    return {};
  }
  const item = await prisma.project.findFirst({
    where: { slug, published: true },
    select: { title: true, description: true },
  });
  return item
    ? { title: item.title, description: item.description ?? undefined }
    : {};
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [item, { t }] = await Promise.all([
    prisma.project.findFirst({
      where: { slug, published: true },
      include: { media: true },
    }),
    getServerT(),
  ]);
  if (!item) notFound();

  return (
    <main>
      <section className="page-intro">
        <p className="eyebrow">
          {[item.category, item.location].filter(Boolean).join(' \u00B7 ')}
        </p>
        <h1>{item.title}</h1>
        {item.systemCapacity && (
          <p>
            {t('detail.systemCapacity')}: {item.systemCapacity}
          </p>
        )}
      </section>
      <section className="content-section">
        {item.media.length > 0 && (
          <div className="media-gallery">
            {item.media.map((media) =>
              media.kind === 'IMAGE' ? (
                <img
                  className="record-image"
                  key={media.id}
                  src={media.url}
                  alt={media.alt ?? media.title ?? item.title}
                  loading="lazy"
                  width="1200"
                  height="800"
                />
              ) : media.kind === 'VIDEO' ? (
                <video
                  key={media.id}
                  controls
                  preload="none"
                  aria-label={media.title ?? item.title}
                >
                  <source src={media.url} />
                </video>
              ) : (
                <a
                  key={media.id}
                  href={media.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  {media.title ?? t('detail.document')}
                </a>
              ),
            )}
          </div>
        )}
        <h2>{t('detail.projectOverview')}</h2>
        {item.description && <p className="form-note">{item.description}</p>}
      </section>
    </main>
  );
}