import { prisma } from '@/lib/db/prisma';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function ProductsPage() {
  const categories = await prisma.productCategory.findMany({
    where: { published: true },
    orderBy: { sortOrder: 'asc' },
  });

  const products = await prisma.product.findMany({
    where: { published: true },
    include: { media: true, category: true },
    orderBy: [{ featured: 'desc' }, { sortOrder: 'asc' }, { name: 'asc' }],
  });

  const featured = products.filter((p) => p.featured);
  const rest = products.filter((p) => !p.featured);

  return (
    <main className="section">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Products</p>
          <h1 className="display-2">The Lura product line</h1>
        </div>
        <p className="lead" style={{ maxWidth: 400 }}>
          Explore our range of solar inverters, batteries, panels, and accessories designed for reliability and performance.
        </p>
      </div>

      {/* Categories Map */}
      {categories.length > 0 && (
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
          {categories.map((cat) => (
            <Link 
              key={cat.id} 
              href={`/products/${cat.slug}`}
              className="button button-ghost button-small"
              style={{ textTransform: 'capitalize' }}
            >
              {cat.name}
            </Link>
          ))}
        </div>
      )}

      {/* Featured Products */}
      {featured.length > 0 && (
        <div style={{ marginBottom: '3rem' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', fontWeight: 700 }}>Featured Products</h2>
          <div className="grid">
            {featured.map((item) => {
              const image = item.media.find((m) => m.kind === 'IMAGE');
              const href = item.category
                ? `/products/${item.category.slug}/${item.slug}`
                : `/products/${item.slug}`;
              return (
                <article className="record-card" key={item.id}>
                  <div>
                    {image && (
                      <img
                        className="record-image"
                        src={image.url}
                        alt={image.alt ?? ''}
                        loading="lazy"
                        width="900"
                        height="620"
                      />
                    )}
                    {item.brand && (
                      <p className="eyebrow eyebrow-plain">{item.brand}</p>
                    )}
                    <h3>{item.name}</h3>
                    {item.summary && <p>{item.summary}</p>}
                  </div>
                  <Link href={href}>View product</Link>
                </article>
              );
            })}
          </div>
        </div>
      )}

      {/* All Other Products */}
      <div>
         <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', fontWeight: 700 }}>All Products</h2>
         <div className="grid">
            {rest.map((item) => {
              const image = item.media.find((m) => m.kind === 'IMAGE');
              const href = item.category
                ? `/products/${item.category.slug}/${item.slug}`
                : `/products/${item.slug}`;
              return (
                <article className="record-card" key={item.id}>
                  <div>
                    {image && (
                      <img
                        className="record-image"
                        src={image.url}
                        alt={image.alt ?? ''}
                        loading="lazy"
                        width="900"
                        height="620"
                      />
                    )}
                    {item.brand && (
                      <p className="eyebrow eyebrow-plain">{item.brand}</p>
                    )}
                    <h3>{item.name}</h3>
                    {item.summary && <p>{item.summary}</p>}
                  </div>
                  <Link href={href}>View product</Link>
                </article>
              );
            })}
         </div>
      </div>
    </main>
  );
}