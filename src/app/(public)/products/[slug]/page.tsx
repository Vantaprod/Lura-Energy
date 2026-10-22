import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const category = await prisma.productCategory.findUnique({
    where: { slug },
    include: {
      products: {
        where: { published: true },
        include: { media: true },
        orderBy: { sortOrder: 'asc' }
      }
    }
  });

  if (!category) notFound();

  return (
    <main className="section">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Series</p>
          <h1 className="display-2">{category.name}</h1>
        </div>
        {category.summary && (
          <p className="lead" style={{ maxWidth: 400 }}>{category.summary}</p>
        )}
      </div>

      {category.products.length === 0 ? (
        <div className="empty-panel">
          <strong>No products found</strong>
          <p>Products for this series will appear here once added.</p>
        </div>
      ) : (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', 
          gap: '2rem',
          marginTop: '2rem'
        }}>
          {category.products.map((product) => {
            const image = product.media?.find((m) => m.kind === 'IMAGE')?.url || product.heroImageUrl;
            
            return (
              <Link 
                key={product.id} 
                href={`/products/${category.slug}/${product.slug}`} 
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  background: '#FFFFFF',
                  border: '1px solid #E4E7EC',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  textDecoration: 'none',
                  color: 'inherit',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                }}
              >
                <div style={{ 
                  height: '240px', 
                  backgroundColor: '#F7F8FA', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  padding: '1.5rem'
                }}>
                  {image ? (
                    <img 
                      src={image} 
                      alt={product.name} 
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
                    />
                  ) : (
                    <span style={{ color: '#939AA5', fontSize: '14px' }}>No image available</span>
                  )}
                </div>
                
                <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {product.brand && (
                    <p style={{ margin: 0, fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#F58220' }}>
                      {product.brand}
                    </p>
                  )}
                  <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: '#0A1550' }}>
                    {product.name}
                  </h3>
                  {product.modelNumber && (
                    <p style={{ margin: 0, fontSize: '13px', color: '#6B7686', fontFamily: 'monospace' }}>
                      {product.modelNumber}
                    </p>
                  )}
                  {product.summary && (
                    <p style={{ margin: '0.5rem 0 0', fontSize: '14px', lineHeight: 1.5, color: '#2B3441', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {product.summary}
                    </p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}