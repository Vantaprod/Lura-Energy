import Link from 'next/link';
import { prisma } from '@/lib/db/prisma';
import { loadHeroSlides } from '@/lib/hero-slides';
import { HeroCarousel, type HeroSlide } from '@/components/public/hero-carousel';
import { ImpactSection, type ImpactContent } from '@/components/public/impact-section';
import { CapabilityPath } from '@/components/public/capability-path';
import { Reveal } from '@/components/ui/reveal';
import { PartnerMarquee } from '@/components/public/partner-marquee';
import { getServerT } from '@/lib/i18n/server';
import { JsonLd } from '@/components/public/json-ld';
import { websiteSchema } from '@/lib/seo/schemas';

export const revalidate = 60;

const ROTATION_WINDOW_MS = 30 * 60 * 1000;
const ROTATION_COUNT = 3;

function rotate<T>(pool: readonly T[], count: number): T[] {
  if (pool.length === 0) return [];
  if (pool.length <= count) return [...pool];
  const windowIndex = Math.floor(Date.now() / ROTATION_WINDOW_MS);
  const start = (windowIndex * count) % pool.length;
  const result: T[] = [];
  for (let i = 0; i < count; i++) {
    result.push(pool[(start + i) % pool.length]);
  }
  return result;
}

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

  const [settings, productPool, projectPool, solutions, testimonials, partners] =
    isPreview
      ? ([[], [], [], [], [], []] as const)
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
                  'impact.stat4Label',
                  'impact.stat4Value',
                  'impact.stat4Suffix',
                ],
              },
            },
          }),
          prisma.product.findMany({
            where: { published: true, category: { published: true } },
            include: { media: true, category: true },
            orderBy: [
              { featured: 'desc' },
              { sortOrder: 'asc' },
              { name: 'asc' },
            ],
          }),
          prisma.project.findMany({
            where: { published: true },
            include: { media: true },
            orderBy: [
              { featured: 'desc' },
              { sortOrder: 'asc' },
              { title: 'asc' },
            ],
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
          prisma.partner.findMany({
            where: { published: true },
            orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
          }),
        ]);

  const featuredProducts = rotate(productPool, ROTATION_COUNT);
  const featuredProjects = rotate(projectPool, ROTATION_COUNT);

  const { lang, t } = await getServerT();

  const content: Record<string, unknown> = Object.fromEntries(
    settings.map((x) => [x.key, x.value]),
  );

  const resolve = (dbKey: string, i18nKey: string): string => {
    if (lang === 'en') {
      const dbValue = content[dbKey];
      if (typeof dbValue === 'string' && dbValue.trim()) return dbValue;
    }
    return t(i18nKey);
  };

  const intro =
    lang === 'en' && typeof content['company.intro'] === 'string'
      ? String(content['company.intro'])
      : '';
  const ctaTitle = resolve('home.ctaTitle', 'cta.talkToLura');
  const ctaBody =
    typeof content['home.ctaBody'] === 'string' && lang === 'en'
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
      typeof content['impact.ctaHref'] === 'string' &&
      String(content['impact.ctaHref']).trim()
        ? String(content['impact.ctaHref'])
        : '/projects',
    stats: [
      {
        label: resolve('impact.stat1Label', 'PV installed'),
        value: parseNumber(String(content['impact.stat1Value'] ?? '30'), 30),
        suffix: String(content['impact.stat1Suffix'] ?? '+ MW'),
      },
      {
        label: resolve('impact.stat2Label', 'Energy storage'),
        value: parseNumber(String(content['impact.stat2Value'] ?? '20'), 20),
        suffix: String(content['impact.stat2Suffix'] ?? '+ MWh'),
      },
      {
        label: resolve('impact.stat3Label', 'C&I projects'),
        value: parseNumber(String(content['impact.stat3Value'] ?? '30'), 30),
        suffix: String(content['impact.stat3Suffix'] ?? '+'),
      },
      {
        label: resolve('impact.stat4Label', 'Operating Regions in Nigeria'),
        value: parseNumber(String(content['impact.stat4Value'] ?? '90'), 90),
        suffix: String(content['impact.stat4Suffix'] ?? '+'),
      },
    ],
  };

  const settingSlides = parseHeroImages(content['home.heroImages']);
  const diskSlides = settingSlides.length === 0 ? await loadHeroSlides() : [];
  const heroSlides = settingSlides.length > 0 ? settingSlides : diskSlides;

  return (
    <main>
      <JsonLd data={websiteSchema()} />
      <section className="hero">
        <HeroCarousel slides={heroSlides} />
      </section>

      <ImpactSection content={impactContent} />

      <CapabilityPath />

      {intro && (
        <section className="section-generous">
          <div className="editorial">
            <Reveal direction="right" hover>
              <div>
                <p className="eyebrow">{t('home.aboutEyebrow')}</p>
                <h2 className="display-2">{t('home.aboutHeading')}</h2>
              </div>
            </Reveal>
            <Reveal direction="left" delay={0.2} hover>
              <div>
                <p className="lead">{intro}</p>
              </div>
            </Reveal>
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
            {solutions.map((item, index) => (
              <Reveal key={item.id} delay={index * 0.1} hover>
                <article className="record-card">
                  <div>
                    <h3>{item.name}</h3>
                    {item.summary && <p>{item.summary}</p>}
                  </div>
                  <Link href={'/solutions/' + item.slug}>{t('cta.discover')}</Link>
                </article>
              </Reveal>
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
        <Reveal>
          <div className="section-heading">
            <div>
              <p className="eyebrow">{t('home.productsEyebrow')}</p>
              <h2>{t('home.productsHeading')}</h2>
            </div>
            <Link className="button button-secondary button-small" href="/products">
              {t('cta.allProducts')}
            </Link>
          </div>
        </Reveal>
        {featuredProducts.length ? (
          <div className="grid">
            {featuredProducts.map((item, index) => {
              const image = item.media.find((m) => m.kind === 'IMAGE');
              const href = item.category
                ? `/products/${item.category.slug}/${item.slug}`
                : `/products/${item.slug}`;
              return (
                <Reveal key={item.id} delay={index * 0.1} hover>
                  <article className="record-card">
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
                    <Link href={href}>{t('cta.viewProduct')}</Link>
                  </article>
                </Reveal>
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
        <Reveal>
          <div className="section-heading">
            <div>
              <p className="eyebrow">{t('home.projectsEyebrow')}</p>
              <h2>{t('home.projectsHeading')}</h2>
            </div>
            <Link className="button button-ghost button-small" href="/projects">
              {t('cta.allProjects')}
            </Link>
          </div>
        </Reveal>
        {featuredProjects.length ? (
          <div className="grid">
            {featuredProjects.map((item, index) => {
              const image = item.media.find((m) => m.kind === 'IMAGE');
              return (
                <Reveal key={item.id} delay={index * 0.1} hover>
                  <article className="record-card">
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
                    <Link href={'/projects/' + item.slug}>
                      {t('cta.viewProject')}
                    </Link>
                  </article>
                </Reveal>
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
            {testimonials.map((item, index) => (
              <Reveal key={item.id} delay={index * 0.1} hover>
                <figure className="record-card testimonial-card">
                  <blockquote>
                    <p>
                      {'\u201C'}
                      {item.quote}
                      {'\u201D'}
                    </p>
                  </blockquote>
                </figure>
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {partners.length > 0 && (
        <PartnerMarquee
          partners={partners.map((p) => ({
            id: p.id,
            name: p.name,
            logoUrl: p.logoUrl,
            logoAlt: p.logoAlt,
            websiteUrl: p.websiteUrl,
          }))}
          eyebrow={t('home.partnersEyebrow')}
          heading={t('home.partnersHeading')}
          body={t('home.partnersBody')}
        />
      )}

      <section className="split-cta">
                <div >
          <p className="eyebrow">{t('home.ctaEyebrow')}</p>
          <h2 className="display-2">{ctaTitle}</h2>
          {ctaBody && <p className="lead">{ctaBody}</p>}
        </div>
        <div className="hero-actions" >
          <Link className="button" href="/contact">
            {t('cta.quote')}
          </Link>
          <Link
            href="/products"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '14px 28px',
              borderRadius: 6,
              fontSize: 14,
              fontWeight: 700,
              textDecoration: 'none',
              color: '#FFFFFF',
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.75)',
              transition: 'background 150ms ease, color 150ms ease, border-color 150ms ease',
              fontFamily: 'inherit',
              minHeight: 48,
            }}
          >
            {t('cta.exploreProducts')}
          </Link>
        </div>
      </section>
    </main>
  );
}