import { prisma } from '@/lib/db/prisma';
import { getServerT } from '@/lib/i18n/server';
import { SeriesCard, SeriesFeaturedCard } from '@/components/public/series-card';

export const revalidate = 300;

export default async function ProductsPage() {
  const isPreview =
    process.env.NODE_ENV === 'development' &&
    process.env.PREVIEW_WITHOUT_DATABASE === 'true';

  const [categories, { t }] = await Promise.all([
    isPreview
      ? Promise.resolve([])
      : prisma.productCategory.findMany({
          where: { published: true },
          orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
          include: {
            _count: {
              select: { products: { where: { published: true } } },
            },
          },
        }),
    getServerT('front'),
  ]);

  const [featured, ...rest] = categories;

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