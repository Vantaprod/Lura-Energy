import Link from 'next/link';
import { prisma } from '@/lib/db/prisma';
import { loadHeroSlides } from '@/lib/hero-slides';
import { HeroCarousel, type HeroSlide } from '@/components/public/hero-carousel';
import { ImpactSection, type ImpactContent } from '@/components/public/impact-section';

export const dynamic = 'force-dynamic';

function parseHeroImages(value: unknown): HeroSlide[] {
  if (typeof value !== 'string' || !value.trim()) return [];
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (item): item is { url: string; alt?: string; mobileUrl?: string } =>
          item && typeof item === 'object' && typeof item.url === 'string',
      )
      .map((item) => ({
        url: item.url,
        alt: item.alt ?? '',
        mobileUrl: typeof item.mobileUrl === 'string' && item.mobileUrl.trim()
          ? item.mobileUrl
          : undefined,
      }));
  } catch {
    return [];
  }
}

function parseNumber(raw: string, fallback: number): number {
  const cleaned = raw.replace(/[^0-9.]/g, '');
  const n = Number.parseFloat(cleaned);
  return Number.isFinite(n) ? n : fallback;
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
                'impact.eyebrow',
                'impact.headingWhite',
                'impact.headingAccent',
                'impact.body1',
                'impact.body2',
                'impact.ctaLabel',
                'impact.ctaHref',
                'impact.stat1Label',
                'impact.stat1Value',
                'impact.stat1Suffix',
                'impact.stat2Label',
                'impact.stat2Value',
                'impact.stat2Suffix',
                'impact.stat3Label',
                'impact.stat3Value',
                'impact.stat3Suffix',
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

  const impactContent: ImpactContent = {
    eyebrow: pick('impact.eyebrow', 'Our Impact'),
    headingWhite: pick('impact.headingWhite', 'Powering'),
    headingAccent: pick('impact.headingAccent', 'Possibility'),
    body1: pick(
      'impact.body1',
      'What started with a vision for more accessible and reliable energy is becoming a growing presence across Nigeria. Lura continues to expand through successful solar projects, strategic distributor partnerships, and an increasing operational footprint across key regions.',
    ),
    body2: pick(
      'impact.body2',
      'Every project represents more than an installation \u2014 it represents a home, business, or organization gaining greater access to dependable energy.',
    ),
    ctaLabel: pick('impact.ctaLabel', 'Learn more'),
    ctaHref: pick('impact.ctaHref', '/projects'),
    stats: [
      {
        label: pick('impact.stat1Label', 'Operating Regions in Nigeria'),
        value: parseNumber(pick('impact.stat1Value', '90'), 90),
        suffix: pick('impact.stat1Suffix', '+'),
      },
      {
        label: pick('impact.stat2Label', 'Successful Projects'),
        value: parseNumber(pick('impact.stat2Value', '5'), 5),
        suffix: pick('impact.stat2Suffix', ''),
      },
      {
        label: pick('impact.stat3Label', 'Distribution Partners'),
        value: parseNumber(pick('impact.stat3Value', '5000'), 5000),
        suffix: pick('impact.stat3Suffix', '+'),
      },
    ],
  };

  const settingSlides = parseHeroImages(content['home.heroImages']);
  const diskSlides = settingSlides.length === 0 ? await loadHeroSlides() : [];
  const heroSlides = settingSlides.length > 0 ? settingSlides : diskSlides;

  return (
    <main>
      <section className="hero">
        <HeroCarousel slides={heroSlides} />
      </section>

      {intro && (
        <section className="section-generous">
          <div className="editorial">
            <div>
              <p className="eyebrow">Company</p>
              <h2 className="display-2">About Lura</h2>
            </div>
            <div>
              <p className="lead">{intro}</p>
            </div>
          </div>
        </section>
      )}

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
                    {item.brand && <p className="eyebrow eyebrow-plain">{item.brand}</p>}
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

      <ImpactSection content={impactContent} />

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