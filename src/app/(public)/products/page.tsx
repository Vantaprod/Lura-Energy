import Link from 'next/link';
import { prisma } from '@/lib/db/prisma';
import { Reveal } from '@/components/ui/reveal';

export const dynamic = 'force-dynamic';

export default async function ProductsPage() {
  // Fetch categories and count the products in each
  const categories = await prisma.productCategory.findMany({
    where: { published: true },
    orderBy: { sortOrder: 'asc' },
    include: {
      _count: {
        select: { products: true }
      }
    }
  });

  if (categories.length === 0) {
    return (
      <main className="section">
        <div className="empty-panel">
          <strong>No categories found</strong>
          <p>Product categories will appear here once added.</p>
        </div>
      </main>
    );
  }

  // Split into the first category (Hero) and the rest (Tiles)
  const heroCategory = categories[0];
  const otherCategories = categories.slice(1);

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

      {/* 1. HERO CATEGORY (First item) */}
      <Reveal>
        <Link href={`/products/${heroCategory.slug}`} className="series-hero">
          <div className="series-hero__media">
            {heroCategory.coverUrl ? (
              <img
                src={heroCategory.coverUrl}
                alt={heroCategory.coverAlt || heroCategory.name}
                loading="eager"
              />
            ) : (
              <div style={{ width: '100%', height: '100%', background: '#0A1550' }} />
            )}
          </div>
          <div className="series-hero__body">
            <p className="series-hero__eyebrow">
              {heroCategory._count.products} MODELS
            </p>
            <h2 className="series-hero__title">{heroCategory.name}</h2>
            {heroCategory.summary && (
              <p className="series-hero__summary">{heroCategory.summary}</p>
            )}
            <span className="series-hero__cta">View models →</span>
          </div>
        </Link>
      </Reveal>

      {/* 2. OTHER CATEGORIES (Grid) */}
      {otherCategories.length > 0 && (
        <div className="series-tiles" style={{ marginTop: '2rem' }}>
          {otherCategories.map((cat, index) => (
            <Reveal key={cat.id} delay={index * 0.1}>
              <Link href={`/products/${cat.slug}`} className="series-tile">
                <div className="series-tile__media">
                  {cat.coverUrl ? (
                    <img
                      src={cat.coverUrl}
                      alt={cat.coverAlt || cat.name}
                      loading="lazy"
                    />
                  ) : (
                    <div style={{ width: '100%', height: '100%', background: '#0A1550' }} />
                  )}
                </div>
                <div className="series-tile__body">
                  <p className="series-tile__eyebrow">
                    {cat._count.products} MODELS
                  </p>
                  <h3 className="series-tile__title">{cat.name}</h3>
                  {cat.summary && (
                    <p className="series-tile__summary">{cat.summary}</p>
                  )}
                  <span className="series-tile__cta">View series →</span>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      )}
    </main>
  );
}