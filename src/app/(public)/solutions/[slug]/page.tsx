import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db/prisma';
import Link from 'next/link';
import { getServerT } from '@/lib/i18n/server';

export const dynamic = 'force-dynamic';

export default async function SolutionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (
    process.env.NODE_ENV === 'development' &&
    process.env.PREVIEW_WITHOUT_DATABASE === 'true'
  ) {
    notFound();
  }
  const [item, { t }] = await Promise.all([
    prisma.solution.findFirst({
      where: { slug, published: true },
      include: { media: { orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }] } },
    }),
    getServerT(),
  ]);
  if (!item) notFound();

  return (
    <main>
      <section className="page-intro">
        <p className="eyebrow">{t('detail.solutionEyebrow')}</p>
        <h1>{item.name}</h1>
        {item.summary && <p>{item.summary}</p>}
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
                  alt={media.alt ?? media.title ?? item.name}
                  loading="lazy"
                  width="1200"
                  height="800"
                />
              ) : media.kind === 'VIDEO' ? (
                <video
                  key={media.id}
                  controls
                  preload="none"
                  aria-label={media.title ?? item.name}
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
        <h2>{t('detail.solutionOverview')}</h2>
        {item.description && <p>{item.description}</p>}
        <Link className="button" href="/contact">
          {t('detail.discuss')} {'\u2192'}
        </Link>
      </section>
    </main>
  );
}