import { prisma } from '@/lib/db/prisma';
import { ContentIndex } from '@/components/public/content-index';
import { getServerT } from '@/lib/i18n/server';
import { SeriesCard, SeriesFeaturedCard } from '@/components/public/series-card';

export const revalidate = 300;

export default async function ProductsPage() {
  const isPreview =
    process.env.NODE_ENV === 'development' &&
    process.env.PREVIEW_WITHOUT_DATABASE === 'true';

  const [items, { t }] = await Promise.all([
    isPreview
      ? Promise.resolve([])
      : prisma.product.findMany({
          where: { published: true },
          include: { category: true, media: true },
          orderBy: { sortOrder: 'asc' },
        }),
    getServerT(),
  ]);

  return (
    <main>
      <section className="page-intro">
        <p className="eyebrow">{t('products.eyebrow')}</p>
        <h1>{t('products.title')}</h1>
        <p>{t('products.description')}</p>
      </section>

      <section className="section-generous">
        {categories.length === 0 ? (
          <div className="empty-panel">
            <strong>{t('products.emptyTitle')}</strong>
            {t('products.emptyBody')}
          </div>
        ) : (
          <>
            {featured && <SeriesFeaturedCard category={featured} t={t} />}
            {rest.length > 0 && (
              <div className="series-tiles">
                {rest.map((cat) => (
                  <SeriesCard key={cat.id} category={cat} t={t} />
                ))}
              </div>
            )}
          </>
        )}
      </section>
    </main>
  );
}
