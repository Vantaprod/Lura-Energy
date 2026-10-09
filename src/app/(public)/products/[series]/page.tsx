import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { prisma } from '@/lib/db/prisma';
import { getServerT } from '@/lib/i18n/server';
import { tField } from '@/lib/i18n/resolve';
export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ series: string }>;
}): Promise<Metadata> {
  const { series } = await params;
  const cat = await prisma.productCategory.findUnique({
    where: { slug: series },
    select: { name: true, summary: true },
  });
  return cat ? { title: cat.name, description: cat.summary ?? undefined } : {};
}

export default async function SeriesPage({
  params,
}: {
  params: Promise<{ series: string }>;
}) {
  const { series } = await params;
  const { lang, t } = await getServerT('front');

  const category = await prisma.productCategory.findUnique({
    where: { slug: series, published: true },
    include: {
      products: {
        where: { published: true },
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
        include: { media: { orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }], take: 1 } },
      },
    },
  });

  if (!category) notFound();

  return (
    <main>
      <section className="page-intro">
        <p className="eyebrow">
          <Link href="/products">{t('series.back')}</Link>
        </p>
        <h1>
          {tField<string>(
            category.translations as Record<string, Record<string, unknown>> | null,
            lang,
            'name',
            category.name,
          )}
        </h1>
        {(() => {
          const resolvedCategoryDescription = tField<string | null>(
            category.translations as Record<string, Record<string, unknown>> | null,
            lang,
            'description',
            category.description,
          );
          return resolvedCategoryDescription ? <p>{resolvedCategoryDescription}</p> : null;
        })()}
      </section>

      <section className="section-generous">
        <h2 style={{ marginBottom: '2rem' }}>{t('series.modelsTitle')}</h2>

        {category.products.length === 0 ? (
          <div className="empty-panel">
            <strong>{t('series.modelsEmpty')}</strong>
          </div>
        ) : (
          <div className="model-grid">
            {category.products.map((product) => {
              const image = product.media[0];
              return (
                <Link
                  key={product.id}
                  href={`/products/${category.slug}/${product.slug}`}
                  className="model-card"
                >
                  <div className="model-card__media">
                    {image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={image.url}
                        alt={image.alt ?? product.name}
                        className="model-card__img"
                        loading="lazy"
                      />
                    ) : (
                      <span className="model-card__placeholder">
                        {t('product.gallery.empty')}
                      </span>
                    )}
                  </div>
                  <div className="model-card__body">
                    {product.brand && (
                      <p className="model-card__brand">{product.brand}</p>
                    )}
                    <h3 className="model-card__title">{product.name}</h3>
                    {product.modelNumber && (
                      <p className="model-card__model">{product.modelNumber}</p>
                    )}
                    {product.summary && (
                      <p className="model-card__summary">{product.summary}</p>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}