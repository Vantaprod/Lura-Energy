import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { prisma } from '@/lib/db/prisma';
import { getServerT } from '@/lib/i18n/server';
import { ProductGallery } from '@/components/public/product-gallery';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ series: string; product: string }>;
}): Promise<Metadata> {
  const { product } = await params;
  const item = await prisma.product.findUnique({
    where: { slug: product },
    select: { seoTitle: true, seoDescription: true, name: true, summary: true },
  });
  if (!item) return {};
  return {
    title: item.seoTitle ?? item.name,
    description: item.seoDescription ?? item.summary ?? undefined,
  };
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ series: string; product: string }>;
}) {
  const { series, product } = await params;
  const { t } = await getServerT('front');

  const item = await prisma.product.findUnique({
    where: { slug: product, published: true },
    include: {
      category: true,
      media: { orderBy: { createdAt: 'asc' } },
      specifications: true,
    },
  });

  if (!item || !item.category || item.category.slug !== series) notFound();

  const keyFeatures: string[] = Array.isArray(item.keyFeatures)
    ? (item.keyFeatures as string[])
    : [];

  const galleryItems = item.media.map((m) => ({
    id: m.id,
    url: m.url,
    alt: m.alt ?? item.name,
    kind: m.kind,
  }));

  return (
    <main>
      <section className="page-intro" style={{ paddingBottom: '2rem' }}>
        <p className="eyebrow">
          <Link href="/products">{t('series.back')}</Link>
          {' \u00B7 '}
          <Link href={`/products/${item.category.slug}`}>{item.category.name}</Link>
        </p>
        <h1>{item.name}</h1>
        {item.modelNumber && (
          <p className="form-note" style={{ marginTop: '0.5rem' }}>
            {t('product.modelNumber')}: <code>{item.modelNumber}</code>
          </p>
        )}
        {item.summary && <p style={{ marginTop: '1rem' }}>{item.summary}</p>}
      </section>

      <section className="section-generous">
        <div className="product-detail__grid">
          <div className="product-detail__gallery">
            <ProductGallery items={galleryItems} emptyLabel={t('product.gallery.empty')} />
          </div>

          <div>
            {keyFeatures.length > 0 && (
              <>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>
                  {t('product.featuresTitle')}
                </h2>
                <ul className="key-features" style={{ marginBottom: '2.5rem' }}>
                  {keyFeatures.map((feature, i) => (
                    <li key={i}>{feature}</li>
                  ))}
                </ul>
              </>
            )}

            {item.datasheetUrl && (
              <a
                href={item.datasheetUrl}
                className="datasheet-button"
                target="_blank"
                rel="noreferrer"
                style={{ marginBottom: '2rem' }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                {t('product.datasheet')}
              </a>
            )}

            <div>
              <Link href="/quote" className="button" style={{ display: 'inline-block' }}>
                {t('product.quote')}
              </Link>
            </div>
          </div>
        </div>

        {item.description && (
          <section style={{ marginTop: '4rem', maxWidth: 820 }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>
              {t('product.descriptionTitle')}
            </h2>
            <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.7, color: '#2B3441' }}>
              {item.description}
            </div>
          </section>
        )}

        {item.specifications.length > 0 && (
          <section style={{ marginTop: '3rem', maxWidth: 820 }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>
              {t('product.specsTitle')}
            </h2>
            <table className="spec-table">
              <tbody>
                {item.specifications.map((spec) => (
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

        {item.warranty && (
          <section style={{ marginTop: '2rem', maxWidth: 820 }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>
              {t('product.warranty')}
            </h2>
            <p style={{ color: '#2B3441', lineHeight: 1.7 }}>{item.warranty}</p>
          </section>
        )}
      </section>
    </main>
  );
}