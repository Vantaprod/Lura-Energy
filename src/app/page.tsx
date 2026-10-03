import Link from 'next/link';
import { prisma } from '@/lib/db/prisma';
import { loadHeroSlides } from '@/lib/hero-slides';
import { HeroCarousel, type HeroSlide } from '@/components/public/hero-carousel';
import { ImpactSection, type ImpactContent } from '@/components/public/impact-section';
import { getServerT } from '@/lib/i18n/server';

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
        mobileUrl:
          typeof item.mobileUrl === 'string' && item.mobileUrl.trim()
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

  const { lang, t } = await getServerT();

  const content: Record<string, unknown> = Object.fromEntries(
    settings.map((x) => [x.key, x.value]),
  );

  /**
   * Bilingual resolve:
   * - English: use DB value if present, otherwise the English dictionary default.
   * - Chinese / French: always use the dictionary so the language is fully translated.
   */
  const resolve = (dbKey: string, i18nKey: string): string => {
    if (lang === 'en') {
      const dbValue = content[dbKey];
      if (typeof dbValue === 'string' && dbValue.trim()) return dbValue;
    }
    return t(i18nKey);
  };

  const intro = lang === 'en' && typeof content['company.intro'] === 'string'
    ? String(content['company.intro'])
    : '';
  const ctaTitle = resolve('home.ctaTitle', 'cta.talkToLura');
  const ctaBody = typeof content['home.ctaBody'] === 'string' && lang === 'en'
    ? String(content['home.ctaBody'])
    : '';

  const impactContent: ImpactContent = {
    eyebrow: resolve('impact.eyebrow', 'impact.eyebrow'),
    headingWhite: resolve('impact.headingWhite', 'impact.headingWhite'),
    headingAccent: resolve('impact.headingAccent', 'impact.headingAccent'),
    body1: resolve('impact.body1', 'impact.body1'),
    body2: resolve('impact.body2', 'impact.body2'),
    ctaLabel: resolve('impact.ctaLabel', 'impact.ctaLabel'),
    ctaHref:
      typeof content['impact.ctaHref'] === 'string' && String(content['impact.ctaHref']).trim()
        ? String(content['impact.ctaHref'])
        : '/projects',
    stats: [
      {
        label: resolve('impact.stat1Label', 'impact.stat1Label'),
        value: parseNumber(String(content['impact.stat1Value'] ?? '90'), 90),
        suffix: String(content['impact.stat1Suffix'] ?? '+'),
      },
      {
        label: resolve('impact.stat2Label', 'impact.stat2Label'),
        value: parseNumber(String(content['impact.stat2Value'] ?? '5'), 5),
        suffix: String(content['impact.stat2Suffix'] ?? ''),
      },
      {
        label: resolve('impact.stat3Label', 'impact.stat3Label'),
        value: parseNumber(String(content['impact.stat3Value'] ?? '5000'), 5000),
        suffix: String(content['impact.stat3Suffix'] ?? '+'),
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

      <ImpactSection content={impactContent} />

      {intro && (
        <section className="section-generous">
          <div className="editorial">
            <div>
              <p className="eyebrow">{t('home.aboutEyebrow')}</p>
              <h2 className="display-2">{t('home.aboutHeading')}</h2>
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
            <p className="eyebrow">{t('home.solutionsEyebrow')}</p>
            <h2>{t('home.solutionsHeading')}</h2>
          </div>
          <Link className="button button-ghost button-small" href="/solutions">
            {t('cta.allSolutions')}
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
                <Link href={'/solutions/' + item.slug}>{t('cta.discover')}</Link>
              </article>
            ))}
          </div>
        ) : (
          <div className="empty-panel">
            <strong>{t('empty.solutionsTitle')}</strong>
            {t('empty.solutionsBody')}
          </div>
        )}
      </section>

      <section className="section-generous">
        <div className="section-heading">
          <div>
            <p className="eyebrow">{t('home.productsEyebrow')}</p>
            <h2>{t('home.productsHeading')}</h2>
          </div>
          <Link className="button button-secondary button-small" href="/products">
            {t('cta.allProducts')}
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
                      <img className="record-image" src={image.url} alt={image.alt ?? ''} loading="lazy" width="900" height="620" />
                    )}
                    {item.brand && <p className="eyebrow eyebrow-plain">{item.brand}</p>}
                    <h3>{item.name}</h3>
                    {item.summary && <p>{item.summary}</p>}
                  </div>
                  <Link href={'/products/' + item.slug}>{t('cta.viewProduct')}</Link>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="empty-panel">
            <strong>{t('empty.productsTitle')}</strong>
            {t('empty.productsBody')}
          </div>
        )}
      </section>

      <section className="section section-dark">
        <div className="section-heading">
          <div>
            <p className="eyebrow">{t('home.projectsEyebrow')}</p>
            <h2>{t('home.projectsHeading')}</h2>
          </div>
          <Link className="button button-ghost button-small" href="/projects">
            {t('cta.allProjects')}
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
                      <img className="record-image" src={image.url} alt={image.alt ?? ''} loading="lazy" width="900" height="620" />
                    )}
                    {item.location && <p className="eyebrow eyebrow-plain">{item.location}</p>}
                    <h3>{item.title}</h3>
                    {item.category && <p>{item.category}</p>}
                  </div>
                  <Link href={'/projects/' + item.slug}>{t('cta.viewProject')}</Link>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="empty-panel">
            <strong>{t('empty.projectsTitle')}</strong>
            {t('empty.projectsBody')}
          </div>
        )}
      </section>

      {testimonials.length > 0 && (
        <section className="section-tight">
          <div className="section-heading">
            <div>
              <p className="eyebrow">{t('home.testimonialsEyebrow')}</p>
              <h2>{t('home.testimonialsHeading')}</h2>
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
          <p className="eyebrow">{t('home.ctaEyebrow')}</p>
          <h2 className="display-2">{ctaTitle}</h2>
          {ctaBody && <p className="lead">{ctaBody}</p>}
        </div>
        <div className="hero-actions">
          <Link className="button" href="/contact">{t('cta.quote')}</Link>
          <Link className="button button-ghost" href="/products">{t('cta.exploreProducts')}</Link>
        </div>
      </section>
    </main>
  );
}