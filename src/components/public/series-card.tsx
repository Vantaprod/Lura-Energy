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
  t: (key: string) => string;
};

function fill(template: string, vars: Record<string, string | number>): string {
  return Object.entries(vars).reduce(
    (acc, [key, value]) => acc.replaceAll(`{${key}}`, String(value)),
    template,
  );
}

function Fallback() {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background:
          'linear-gradient(135deg, #1428A0 0%, #0A1550 60%, #2547CC 100%)',
      }}
    />
  );
}

/** Large horizontal hero card — image left, text right, white background. */
export function SeriesFeaturedCard({ category, t }: Props) {
  const count = category._count.products;
  const modelsLabel = fill(t('products.series.modelsCount'), { n: count });

  return (
    <Link href={`/products/${category.slug}`} className="series-hero">
      <div className="series-hero__media">
        {category.coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={category.coverUrl}
            alt={category.coverAlt ?? category.name}
            loading="eager"
          />
        ) : (
          <Fallback />
        )}
      </div>
      <div className="series-hero__body">
        <p className="series-hero__eyebrow">{modelsLabel}</p>
        <h2 className="series-hero__title">{category.name}</h2>
        {category.summary && (
          <p className="series-hero__summary">{category.summary}</p>
        )}
        <span className="series-hero__cta">
          {t('products.series.viewModels')}
          <span aria-hidden="true">{'\u2192'}</span>
        </span>
      </div>
    </Link>
  );
}

/** Standard vertical card — image on top, text below on white. */
export function SeriesCard({ category, t }: Props) {
  const count = category._count.products;
  const modelsLabel = fill(t('products.series.modelsCount'), { n: count });

  return (
    <Link href={`/products/${category.slug}`} className="series-tile">
      <div className="series-tile__media">
        {category.coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={category.coverUrl}
            alt={category.coverAlt ?? category.name}
            loading="lazy"
          />
        ) : (
          <Fallback />
        )}
      </div>
      <div className="series-tile__body">
        <p className="series-tile__eyebrow">{modelsLabel}</p>
        <h3 className="series-tile__title">{category.name}</h3>
        {category.summary && (
          <p className="series-tile__summary">{category.summary}</p>
        )}
        <span className="series-tile__cta">
          {t('products.series.viewModels')}
          <span aria-hidden="true">{'\u2192'}</span>
        </span>
      </div>
    </Link>
  );
}