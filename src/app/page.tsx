import Link from 'next/link';
import { prisma } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const isPreview =
    process.env.NODE_ENV === 'development' &&
    process.env.PREVIEW_WITHOUT_DATABASE === 'true';

  const [settings, products, projects, solutions, testimonials] = isPreview
    ? ([[], [], [], [], []] as const)
    : await Promise.all([
        prisma.setting.findMany({
          where: {
            key: {
              in: [
                'home.heroEyebrow',
                'home.heroTitle',
                'home.heroBody',
                'home.heroImageUrl',
                'home.heroImageAlt',
                'home.heroVideoUrl',
                'home.heroPrimaryLabel',
                'home.heroPrimaryHref',
                'home.heroSecondaryLabel',
                'home.heroSecondaryHref',
                'home.ctaTitle',
                'home.ctaBody',
                'company.intro',
              ],
            },
          },
        }),
        prisma.product.findMany({
          where: { published: true, featured: true },
          include: { media: true, category: true },
          orderBy: { sortOrder: 'asc' },
          take: 3,
        }),
        prisma.project.findMany({
          where: { published: true, featured: true },
          include: { media: true },
          orderBy: { sortOrder: 'asc' },
          take: 3,
        }),
        prisma.solution.findMany({
          where: { published: true },
          orderBy: { sortOrder: 'asc' },
          take: 3,
        }),
        prisma.testimonial.findMany({
          where: { published: true },
          orderBy: { sortOrder: 'asc' },
          take: 3,
        }),
      ]);

  const content: Record<string, unknown> = Object.fromEntries(
    settings.map((x) => [x.key, x.value]),
  );
  const pick = (key: string, fallback: string): string => {
    const value = content[key];
    return typeof value === 'string' && value.trim() ? value : fallback;
  };

  const heroEyebrow = pick('home.heroEyebrow', 'Energy, by Lura');
  const heroTitle = pick('home.heroTitle', 'Lura Energy');
  const heroBody = pick('home.heroBody', '');
  const heroImageUrl = pick('home.heroImageUrl', '');
  const heroImageAlt = pick('home.heroImageAlt', '');
  const heroVideoUrl = pick('home.heroVideoUrl', '');
  const primaryLabel = pick('home.heroPrimaryLabel', 'Request a quote');
  const primaryHref = pick('home.heroPrimaryHref', '/contact');
  const secondaryLabel = pick('home.heroSecondaryLabel', 'Explore products');
  const secondaryHref = pick('home.heroSecondaryHref', '/products');
  const ctaTitle = pick('home.ctaTitle', 'Talk to Lura.');
  const ctaBody = pick('home.ctaBody', '');
  const intro = pick('company.intro', '');

  const hasHeroMedia = Boolean(heroVideoUrl || heroImageUrl);

  return (
    <main>
      <section className="hero">
        {heroVideoUrl ? (
          <div className="hero-media">
            <video
              src={heroVideoUrl}
              autoPlay
              muted
              loop
              playsInline
              poster={heroImageUrl || undefined}
            />
          </div>
        ) : heroImageUrl ? (
          <div className="hero-media">
            <img src={heroImageUrl} alt={heroImageAlt} />
          </div>
        ) : null}
        {hasHeroMedia && <div className="hero-scrim" aria-hidden="true" />}
        <div className="hero-content">
          <p className="eyebrow">{heroEyebrow}</p>
          <h1 className="display">{heroTitle}</h1>
          {heroBody && <p className="lead">{heroBody}</p>}
          <div className="hero-actions">
            <Link className="button" href={primaryHref}>
              {primaryLabel}
            </Link>
            <Link className="button button-ghost" href={secondaryHref}>
              {secondaryLabel}
            </Link>
          </div>
        </div>
      </section>

      <section className="section-generous">
        <div className="editorial">
          <div>
            <p className="eyebrow">Company</p>
            <h2 className="display-2">About Lura</h2>
          </div>
          <div>
            {intro ? (
              <p className="lead">{intro}</p>
            ) : (
              <p className="form-note">
                Company introduction pending publication. Lura administrators can add approved
                company information in site settings.
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="section section-dark">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Solutions</p>
            <h2>Solutions from Lura.</h2>
          </div>
          <Link className="button button-ghost button-small" href="/solutions">
            All solutions
          </Link>
        </div>
        {solutions.length ? (
          <div className="grid">
            {solutions.map((item) => (
              <article className="record-card" key={item.id}>
                <div>
                  <h3>{item.name}</h3>
                  {item.summary && <p>{item.summary}</p>}
                </div>
                <Link href={`/solutions/${item.slug}`}>Discover {'\u2192'}</Link>
              </article>
            ))}
          </div>
        ) : (
          <div className="empty-panel">
            <strong>Solutions are being prepared</strong>
            Published Lura solutions will appear here.
          </div>
        )}
      </section>

      <section className="section-generous">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Products</p>
            <h2>The Lura product line.</h2>
          </div>
          <Link className="button button-secondary button-small" href="/products">
            All products
          </Link>
        </div>
        {products.length ? (
          <div className="grid">
            {products.map((item) => {
              const image = item.media.find((m) => m.kind === 'IMAGE');
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
                    {item.category?.name && (
                      <p className="eyebrow eyebrow-plain">{item.category.name}</p>
                    )}
                    <h3>{item.name}</h3>
                    {item.summary && <p>{item.summary}</p>}
                  </div>
                  <Link href={`/products/${item.slug}`}>View product {'\u2192'}</Link>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="empty-panel">
            <strong>Product information is being prepared</strong>
            Approved Lura products will appear here as they are added to the catalog.
          </div>
        )}
      </section>

      <section className="section section-dark">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Projects</p>
            <h2>Selected installations.</h2>
          </div>
          <Link className="button button-ghost button-small" href="/projects">
            All projects
          </Link>
        </div>
        {projects.length ? (
          <div className="grid">
            {projects.map((item) => {
              const image = item.media.find((m) => m.kind === 'IMAGE');
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
                    {item.location && (
                      <p className="eyebrow eyebrow-plain">{item.location}</p>
                    )}
                    <h3>{item.title}</h3>
                    {item.category && <p>{item.category}</p>}
                  </div>
                  <Link href={`/projects/${item.slug}`}>View project {'\u2192'}</Link>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="empty-panel">
            <strong>Project stories are being prepared</strong>
            Published installation projects will appear here.
          </div>
        )}
      </section>

      {testimonials.length > 0 && (
        <section className="section-tight">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Customers</p>
              <h2>In their words.</h2>
            </div>
          </div>
          <div className="grid">
            {testimonials.map((item) => (
              <figure className="record-card testimonial-card" key={item.id}>
                <blockquote>
                  <p>&ldquo;{item.quote}&rdquo;</p>
                </blockquote>
              </figure>
            ))}
          </div>
        </section>
      )}

      <section className="split-cta">
        <div>
          <p className="eyebrow">Start a project</p>
          <h2 className="display-2">{ctaTitle}</h2>
          {ctaBody && <p className="lead">{ctaBody}</p>}
        </div>
        <div className="hero-actions">
          <Link className="button" href="/contact">
            Request a quote
          </Link>
          <Link className="button button-ghost" href="/products">
            Explore products
          </Link>
        </div>
      </section>
    </main>
  );
}