import Link from 'next/link';

type Category = {
  id: string;
  name: string;
  slug: string;
  summary: string | null;
  coverUrl: string | null;
  coverAlt: string | null;
  _count: { products: number };
};

type Props = {
  category: Category;
  featured?: boolean;
  wide?: boolean;
  t: (key: string) => string;
};

function fill(template: string, vars: Record<string, string | number>): string {
  return Object.entries(vars).reduce(
    (acc, [key, value]) => acc.replaceAll(`{${key}}`, String(value)),
    template,
  );
}

export function SeriesCard({ category, featured = false, wide = false, t }: Props) {
  const className =
    'series-card' +
    (featured ? ' series-card--featured' : '') +
    (wide ? ' series-card--wide' : '');

  const count = category._count.products;
  const modelsLabel = fill(t('products.series.modelsCount'), { n: count });

  return (
    <Link href={`/products/${category.slug}`} className={className}>
      <div className="series-card__media">
        {category.coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={category.coverUrl}
            alt={category.coverAlt ?? category.name}
            className="series-card__img"
            loading={featured ? 'eager' : 'lazy'}
          />
        ) : (
          <div
            className="series-card__img"
            style={{
              background:
                'linear-gradient(135deg, #1428A0 0%, #0A1550 60%, #2547CC 100%)',
            }}
          />
        )}
      </div>
      <div className="series-card__overlay" aria-hidden="true" />

      <div className="series-card__content">
        <p className="series-card__eyebrow">{modelsLabel}</p>
        <h2 className="series-card__title">{category.name}</h2>
        {category.summary && (
          <p className="series-card__summary">{category.summary}</p>
        )}
        <span className="series-card__cta">
          {t('products.series.viewModels')}
          <span className="series-card__cta-arrow" aria-hidden="true">{'\u2192'}</span>
        </span>
      </div>
    </Link>
  );
}