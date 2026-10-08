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
  group: string | null;
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
  categorySummary: string | null;
  keyFeatures: string[];
  specifications: ProductSpec[];
  media: ProductMedia[];
  featureBanners: FeatureBanner[];
  t: (key: string) => string;
};

const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const DownloadIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

const WarnIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

function SpecTable({ specs, t }: { specs: ProductSpec[]; t: (k: string) => string }) {
  return (
    <table className="pdp-specs__table">
      <thead>
        <tr>
          <th scope="col">{t('product.specsParameter')}</th>
          <th scope="col">{t('product.specsValue')}</th>
        </tr>
      </thead>
      <tbody>
        {specs.map((spec) => (
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
  );
}

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
  categorySummary,
  keyFeatures,
  specifications,
  media,
  featureBanners,
  t,
}: ProductDetailProps) {
  const firstImage = media.find((m) => m.kind === 'IMAGE');
  const hero = heroImageUrl ?? firstImage?.url ?? null;
  const imageCount = media.filter((m) => m.kind === 'IMAGE').length;

  const heroEyebrow = brand ? `${brand} \u00B7 ${categoryName}` : categoryName;
  const heroHeading = categorySummary || name;

  const paragraphs = description
    ? description.split(/\n\n+/).map((p) => p.trim()).filter(Boolean)
    : [];

  // Group specs by their `group` field; anything without a group
  // falls into the "Full Technical Specifications" table.
  const groupedMap = new Map<string, ProductSpec[]>();
  const ungrouped: ProductSpec[] = [];
  for (const spec of specifications) {
    const g = spec.group?.trim();
    if (g) {
      if (!groupedMap.has(g)) groupedMap.set(g, []);
      groupedMap.get(g)!.push(spec);
    } else {
      ungrouped.push(spec);
    }
  }
  const grouped = [...groupedMap.entries()];
  const hasGroups = grouped.length > 0;

  return (
    <main className="pdp">
      {/* HERO */}
      <section className="pdp-hero">
        {hero && (
          <div className="pdp-hero__bg" style={{ backgroundImage: `url(${hero})` }} aria-hidden="true" />
        )}
        <div className="pdp-hero__overlay" aria-hidden="true" />
        <div className="pdp-hero__inner">
          <nav className="pdp-hero__crumbs" aria-label="Breadcrumb">
            <Link href="/products">{t('series.back')}</Link>
            <span aria-hidden="true">/</span>
            <Link href={`/products/${categorySlug}`}>{categoryName}</Link>
          </nav>
          <div className="pdp-hero__text">
            <p className="pdp-hero__eyebrow">{heroEyebrow}</p>
            <h1 className="pdp-hero__title">{heroHeading}</h1>
          </div>
        </div>
      </section>

      {/* PRODUCT */}
      <section className="pdp-product">
        <div className="pdp-product__gallery">
          {imageCount > 0 ? (
            <ProductGallery items={media} emptyLabel={t('product.gallery.empty')} />
          ) : (
            <div className="pdp-product__placeholder">
              {t('product.gallery.empty')}
            </div>
          )}
        </div>
        <div className="pdp-product__info">
          {brand && <p className="pdp-product__brand">{brand}</p>}
          <h2 className="pdp-product__title">{name}</h2>
          {modelNumber && <p className="pdp-product__model">{modelNumber}</p>}
          {summary && <p className="pdp-product__summary">{summary}</p>}
          {keyFeatures.length > 0 && (
            <ul className="pdp-product__features">
              {keyFeatures.map((feature, i) => (
                <li key={i}>
                  <span className="pdp-product__check"><CheckIcon /></span>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          )}
          <Link href="/quote" className="pdp-product__cta">
            <span>{t('product.quote')}</span>
            <span aria-hidden="true">{'\u2192'}</span>
          </Link>
        </div>
      </section>

      {/* SPECIFICATIONS */}
      {specifications.length > 0 && (
        <>
          {hasGroups ? (
            <>
              {grouped.map(([groupName, specs]) => (
                <section key={groupName} className="pdp-specs">
                  <h2 className="pdp-specs__title">{groupName}</h2>
                  <SpecTable specs={specs} t={t} />
                </section>
              ))}
              {ungrouped.length > 0 && (
                <section className="pdp-specs">
                  <h2 className="pdp-specs__title">{t('product.fullSpecsTitle')}</h2>
                  <SpecTable specs={ungrouped} t={t} />
                </section>
              )}
            </>
          ) : (
            <section className="pdp-specs">
              <h2 className="pdp-specs__title">{t('product.specsTitle')}</h2>
              <SpecTable specs={specifications} t={t} />
            </section>
          )}
        </>
      )}

      {/* DESCRIPTION */}
      {paragraphs.length > 0 && (
        <section className="pdp-desc">
          <h2 className="pdp-desc__title">{t('product.descriptionTitle')}</h2>
          <div className="pdp-desc__body">
            {paragraphs.map((para, i) => <p key={i}>{para}</p>)}
          </div>
        </section>
      )}

      {/* FEATURE BANNERS */}
      {featureBanners.length > 0 && (
        <section className="pdp-banners">
          {featureBanners.map((banner, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={i} src={banner.url} alt={banner.alt || name} loading="lazy" />
          ))}
        </section>
      )}

      {/* NOTICE */}
      {notice && (
        <section className="pdp-notice">
          <div className="pdp-notice__card">
            <div className="pdp-notice__icon" aria-hidden="true"><WarnIcon /></div>
            <div className="pdp-notice__body">
              <strong className="pdp-notice__label">{t('product.noticeTitle')}:</strong>{' '}
              <span>{notice}</span>
            </div>
          </div>
        </section>
      )}

      {/* WARRANTY */}
      {warranty && (
        <section className="pdp-warranty">
          <h2 className="pdp-warranty__title">{t('product.warranty')}</h2>
          <p className="pdp-warranty__body">{warranty}</p>
        </section>
      )}

      {/* DATASHEET */}
      {datasheetUrl && (
        <section className="pdp-datasheet">
          <h2 className="pdp-datasheet__title">{t('product.datasheetTitle')}</h2>
          <div className="pdp-datasheet__card">
            <div className="pdp-datasheet__info">
              <div className="pdp-datasheet__icon" aria-hidden="true"><span>PDF</span></div>
              <div className="pdp-datasheet__text">
                <p className="pdp-datasheet__name">
                  {name}
                  {modelNumber ? ` \u2014 ${modelNumber}` : ''}
                </p>
                <p className="pdp-datasheet__sub">{t('product.datasheetPdf')}</p>
              </div>
            </div>
            <a href={datasheetUrl} className="pdp-datasheet__btn" target="_blank" rel="noreferrer">
              <DownloadIcon size={18} />
              <span>{t('product.downloadPdf')}</span>
            </a>
          </div>
        </section>
      )}
    </main>
  );
}