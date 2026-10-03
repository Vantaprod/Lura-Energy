import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db/prisma';
import Link from 'next/link';
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
  const item = await prisma.product.findFirst({
    where: { slug, published: true },
    select: { name: true, seoTitle: true, seoDescription: true, summary: true },
  });
  return item
    ? {
        title: item.seoTitle ?? item.name,
        description: item.seoDescription ?? item.summary ?? undefined,
      }
    : {};
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [item, { t }] = await Promise.all([
    prisma.product.findFirst({
      where: { slug, published: true },
      include: {
        category: true,
        specifications: { orderBy: { sortOrder: 'asc' } },
        media: true,
      },
    }),
    getServerT(),
  ]);
  if (!item) notFound();

  return (
    <main>
      <section className="page-intro">
        <p className="eyebrow">{item.category?.name ?? t('detail.productEyebrow')}</p>
        <h1>{item.name}</h1>
        {item.summary && <p>{item.summary}</p>}
        <Link
          className="button"
          href={'/contact?product=' + encodeURIComponent(item.name)}
        >
          {t('detail.requestInfo')} {'\u2192'}
        </Link>
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
        <div className="editorial">
          <div>
            <h2>{t('detail.productDetails')}</h2>
            {item.description && <p>{item.description}</p>}
          </div>
          {item.specifications.length > 0 && (
            <table className="detail-specs">
              <tbody>
                {item.specifications.map((spec) => (
                  <tr key={spec.id}>
                    <td>{spec.label}</td>
                    <td>
                      {spec.value}
                      {spec.unit ? ' ' + spec.unit : ''}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        {item.warranty && (
          <p className="form-note">
            {t('detail.warranty')}: {item.warranty}
          </p>
        )}
      </section>
    </main>
  );
}