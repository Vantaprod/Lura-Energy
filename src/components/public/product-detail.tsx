import Link from 'next/link';
import { ProductGallery } from '@/components/public/product-gallery';

export type ProductMedia = {
  id: string;
  url: string;
  alt: string;
  kind: 'IMAGE' | 'VIDEO' | 'DOCUMENT';
};

export type ProductSpec = {
  id: string;
  label: string;
  value: string;
  unit: string | null;
};

export type FeatureBanner = {
  url: string;
  alt: string;
};

export type ProductDetailProps = {
  name: string;
  modelNumber: string | null;
  brand: string | null;
  summary: string | null;
  description: string | null;
  warranty: string | null;
  notice: string | null;
  heroImageUrl: string | null;
  datasheetUrl: string | null;
  categorySlug: string;
  categoryName: string;
  keyFeatures: string[];
  specifications: ProductSpec[];
  media: ProductMedia[];
  featureBanners: FeatureBanner[];
  t: (key: string) => string;
};

export function ProductDetail({
  name,
  modelNumber,
  brand,
  summary,
  description,
  warranty,
  notice,
  heroImageUrl,
  datasheetUrl,
  categorySlug,
  categoryName,
  keyFeatures,
  specifications,
  media,
  featureBanners,
  t,
}: ProductDetailProps) {
  // Fallback: if no dedicated hero image, use the first gallery image.
  const firstImage = media.find((m) => m.kind === 'IMAGE');
  const hero = heroImageUrl ?? firstImage?.url ?? null;

  // Hide the gallery block entirely if the hero already shows the only image.
  const showGallery = media.length > 1;

  return (
    <main className="pd">
      <nav className="pd__crumbs" aria-label="Breadcrumb">
        <Link href="/products">{t('series.back')}</Link>
        <span aria-hidden="true">/</span>
        <Link href={`/products/${categorySlug}`}>{categoryName}</Link>
      </nav>

      <section className="pd__hero">
        <div className="pd__hero-media">
          {showGallery ? (
            <ProductGallery items={media} emptyLabel={t('product.gallery.empty')} />
          ) : hero ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={hero}
              alt={name}
              className="pd__hero-img"
              loading="eager"
            />
          ) : (
            <div className="pd__hero-placeholder">
              {t('product.gallery.empty')}
            </div>
          )}
        </div>

        <div className="pd__hero-info">
          {brand && <p className="pd__eyebrow">{brand}</p>}
          <h1 className="pd__title">{name}</h1>
          {modelNumber && (
            <p className="pd__model">
              <span className="pd__model-label">{t('product.modelNumber')}</span>
              <code className="pd__model-code">{modelNumber}</code>
            </p>
          )}
          {summary && <p className="pd__summary">{summary}</p>}

          {keyFeatures.length > 0 && (
            <>
              <h2 className="pd__subhead">{t('product.featuresTitle')}</h2>
              <ul className="pd__features-short">
                {keyFeatures.slice(0, 5).map((feature, i) => (
                  <li key={i}>{feature}</li>
                ))}
              </ul>
            </>
          )}

          <div className="pd__actions">
            <Link href="/quote" className="button">
              {t('product.quote')}
            </Link>
            {datasheetUrl && (
              <a
                href={datasheetUrl}
                className="pd__datasheet-btn"
                target="_blank"
                rel="noreferrer"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                {t('product.datasheet')}
              </a>
            )}
          </div>
        </div>
      </section>

      {specifications.length > 0 && (
        <section className="pd__section">
          <h2 className="pd__heading">{t('product.specsTitle')}</h2>
          <table className="pd__specs">
            <tbody>
              {specifications.map((spec) => (
                <tr key={spec.id}>
                  <th scope="row">{spec.label}</th>
                  <td>
                    {spec.value}
                    {spec.unit ? ` ${spec.unit}` : ''}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {description && (
        <section className="pd__section">
          <h2 className="pd__heading">{t('product.descriptionTitle')}</h2>
          <div className="pd__prose">{description}</div>
        </section>
      )}

      {featureBanners.length > 0 && (
        <section className="pd__banners">
          {featureBanners.map((banner, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={i}
              src={banner.url}
              alt={banner.alt || name}
              loading="lazy"
            />
          ))}
        </section>
      )}

      {notice && (
        <section className="pd__section">
          <div className="pd__notice">
            <h2 className="pd__notice-title">{t('product.noticeTitle')}</h2>
            <div className="pd__notice-body">{notice}</div>
          </div>
        </section>
      )}

      {warranty && (
        <section className="pd__section">
          <h2 className="pd__heading">{t('product.warranty')}</h2>
          <p className="pd__prose">{warranty}</p>
        </section>
      )}

      {datasheetUrl && (
        <section className="pd__section">
          <div className="pd__datasheet-card">
            <div>
              <h2 className="pd__datasheet-title">{t('product.datasheetTitle')}</h2>
              <p className="pd__datasheet-sub">
                {modelNumber ? `${modelNumber} — ` : ''}
                Datasheet PDF
              </p>
            </div>
            <a
              href={datasheetUrl}
              className="pd__datasheet-btn pd__datasheet-btn--lg"
              target="_blank"
              rel="noreferrer"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              {t('product.downloadPdf')}
            </a>
          </div>
        </section>
      )}
    </main>
  );
}