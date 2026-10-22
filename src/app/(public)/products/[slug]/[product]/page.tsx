import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db/prisma';
import { ProductGallery } from '@/components/public/product-gallery';

export const dynamic = 'force-dynamic';

export default async function ProductDetailPage({ 
  params 
}: { 
  params: Promise<{ slug: string; product: string }> 
}) {
  const { slug, product: productSlug } = await params;

  const product = await prisma.product.findUnique({
    where: { slug: productSlug },
    include: {
      category: true,
      media: { orderBy: { sortOrder: 'asc' } },
      specifications: { orderBy: { sortOrder: 'asc' } }
    }
  });

  if (!product) notFound();

  const heroImage = product.media?.find((m) => m.kind === 'IMAGE')?.url || product.heroImageUrl;

  // Group specifications by their 'group' field if it exists
  const groupedSpecs = product.specifications.reduce((acc, spec) => {
    const group = spec.group || 'General';
    if (!acc[group]) acc[group] = [];
    acc[group].push(spec);
    return acc;
  }, {} as Record<string, typeof product.specifications>);

  return (
    <main className="pdp">
      {/* HERO SECTION */}
      <section className="pdp-hero">
        <div className="pdp-hero__bg" style={{ backgroundImage: heroImage ? `url(${heroImage})` : undefined }} />
        <div className="pdp-hero__overlay" />
        <div className="pdp-hero__inner">
          <div className="pdp-hero__crumbs">
            <Link href="/products">Products</Link>
            <span>/</span>
            <Link href={`/products/${product.category?.slug}`}>{product.category?.name}</Link>
            <span>/</span>
            <span>{product.name}</span>
          </div>
          <div className="pdp-hero__text">
            {product.brand && <p className="pdp-hero__eyebrow">{product.brand}</p>}
            <h1 className="pdp-hero__title">{product.name}</h1>
          </div>
        </div>
      </section>

      {/* PRODUCT INFO & GALLERY */}
      <section className="pdp-product">
        <div className="pdp-product__gallery">
          {product.media.length > 0 ? (
            <ProductGallery items={product.media} />
          ) : (
            <div className="pdp-product__placeholder">No gallery images available</div>
          )}
        </div>
        <div className="pdp-product__info">
          {product.brand && <p className="pdp-product__brand">{product.brand}</p>}
          <h2 className="pdp-product__title">{product.name}</h2>
          {product.modelNumber && <p className="pdp-product__model">Model: {product.modelNumber}</p>}
          
          {product.summary && (
            <p className="pdp-product__summary">{product.summary}</p>
          )}

          {product.datasheetUrl && (
            <div style={{ marginTop: '1.5rem' }}>
              <a href={product.datasheetUrl} target="_blank" rel="noreferrer" className="pdp-datasheet__btn">
                Download Datasheet
              </a>
            </div>
          )}
        </div>
      </section>

      {/* SPECIFICATIONS */}
      {product.specifications.length > 0 && (
        <section className="pdp-specs">
          <h3 className="pdp-specs__title">Specifications</h3>
          {Object.entries(groupedSpecs).map(([group, specs]) => (
            <div key={group} style={{ marginBottom: '2rem' }}>
              <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>{group}</h4>
              <table className="pdp-specs__table">
                <tbody>
                  {specs.map((spec) => (
                    <tr key={spec.id}>
                      <th>{spec.label}</th>
                      <td>{spec.value} {spec.unit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </section>
      )}

      {/* DESCRIPTION */}
      {product.description && (
        <section className="pdp-desc">
          <h3 className="pdp-desc__title">Description</h3>
          <div className="pdp-desc__body" style={{ whiteSpace: 'pre-wrap' }}>
            <p>{product.description}</p>
          </div>
        </section>
      )}
    </main>
  );
}