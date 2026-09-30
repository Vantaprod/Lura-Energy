import Link from 'next/link';
import { prisma } from '@/lib/db/prisma';
import { loadHeroSlides } from '@/lib/hero-slides';
import { HeroCarousel, type HeroSlide } from '@/components/public/hero-carousel';
import { ImpactSection } from '@/components/public/impact-section';

export const dynamic = 'force-dynamic';

function parseHeroImages(value: unknown): HeroSlide[] {
  if (typeof value !== 'string' || !value.trim()) return [];
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (item): item is { url: string; alt?: string } =>
          item && typeof item === 'object' && typeof item.url === 'string',
      )
      .map((item) => ({ url: item.url, alt: item.alt ?? '' }));
  } catch {
    return [];
  }
}

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
                'home.heroImages',
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

  const ctaTitle = pick('home.ctaTitle', 'Talk to Lura.');
  const ctaBody = pick('home.ctaBody', '');
  const intro = pick('company.intro', '');

  const settingSlides = parseHeroImages(content['home.heroImages']);
  const diskSlides = settingSlides.length === 0 ? await loadHeroSlides() : [];
  const heroSlides = settingSlides.length > 0 ? settingSlides : diskSlides;

  return (
    <main>
      <section className="hero">
        <HeroCarousel slides={heroSlides} />
      </section>

      <ImpactSection />

      <section className="section section-dark">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Solutions</p>
            <h2>Solutions from Lura.</h2>
          </div>
          <Link className="button button-ghost button-small" href="/solutions">All solutions</Link>
        </div>
        {solutions.length ? (
          <div className="grid">
            {solutions.map((item) => (
              <article className="record-card" key={item.id}>
                <div>
                  <h3>{item.name}</h3>
                  {item.summary && <p>{item.summary}</p>}
                </div>
                <Link href={'/solutions/' + item.slug}>Discover</Link>
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
          <Link className="button button-secondary button-small" href="/products">All products</Link>
        </div>
        {products.length ? (
          <div className="grid">
            {products.map((item) => {
              const image = item.media.find((m) => m.kind === 'IMAGE');
              return (
                <article className="record-card" key={item.id}>
                  <div>
                    {image && (
                      <img className="record-image" src={image.url} alt={image.alt ?? ''} loading="lazy" width="900" height="620" />
                    )}
                    {item.category?.name && <p className="eyebrow eyebrow-plain">{item.category.name}</p>}
                    <h3>{item.name}</h3>
                    {item.summary && <p>{item.summary}</p>}
                  </div>
                  <Link href={'/products/' + item.slug}>View product</Link>
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
          <Link className="button button-ghost button-small" href="/projects">All projects</Link>
        </div>
        {projects.length ? (
          <div className="grid">
            {projects.map((item) => {
              const image = item.media.find((m) => m.kind === 'IMAGE');
              return (
                <article className="record-card" key={item.id}>
                  <div>
                    {image && (
                      <img className="record-image" src={image.url} alt={image.alt ?? ''} loading="lazy" width="900" height="620" />
                    )}
                    {item.location && <p className="eyebrow eyebrow-plain">{item.location}</p>}
                    <h3>{item.title}</h3>
                    {item.category && <p>{item.category}</p>}
                  </div>
                  <Link href={'/projects/' + item.slug}>View project</Link>
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
                  <p>{'\u201C'}{item.quote}{'\u201D'}</p>
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
          <Link className="button" href="/contact">Request a quote</Link>
          <Link className="button button-ghost" href="/products">Explore products</Link>
        </div>
      </section>
    </main>
  );
}