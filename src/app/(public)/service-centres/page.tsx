import Link from 'next/link';
import type { Metadata } from 'next';
import { prisma } from '@/lib/db/prisma';
import { getServerT } from '@/lib/i18n/server';

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getServerT('front');
  return {
    title: t('lcs.page.metaTitle'),
    description: t('lcs.page.metaDescription'),
  };
}

type Centre = {
  id: string;
  name: string;
  slug: string;
  type: string | null;
  address: string;
  city: string;
  state: string | null;
  phone: string | null;
  email: string | null;
  hours: string | null;
  latitude: number | null;
  longitude: number | null;
  description: string | null;
};

type Labels = {
  hours: string;
  phone: string;
  email: string;
  directions: string;
  badgeService: string;
  badgePickup: string;
  badgeBoth: string;
};

type Badge = { label: string; variant: 'service' | 'pickup' | 'both' };

function badgeFor(type: string | null, labels: Labels): Badge {
  if (type === 'Pickup Point') {
    return { label: labels.badgePickup, variant: 'pickup' };
  }
  if (type === 'Both') {
    return { label: labels.badgeBoth, variant: 'both' };
  }
  return { label: labels.badgeService, variant: 'service' };
}

function directionsHref(c: Centre): string {
  if (c.latitude !== null && c.longitude !== null) {
    const dest = c.latitude + ',' + c.longitude;
    return 'https://www.google.com/maps/dir/?api=1&destination=' + encodeURIComponent(dest);
  }
  const parts = [c.address, c.city, c.state ?? '', 'Nigeria'].filter(Boolean);
  return (
    'https://www.google.com/maps/dir/?api=1&destination=' +
    encodeURIComponent(parts.join(', '))
  );
}

function CentreCard({ centre, labels }: { centre: Centre; labels: Labels }) {
  const cityLine = [centre.city, centre.state ?? ''].filter(Boolean).join(', ');
  const badge = badgeFor(centre.type, labels);

  return (
    <article className="centre-card">
      <header className="centre-card__head">
        <div className="centre-card__top">
          <p className="eyebrow eyebrow-plain">{centre.state ?? 'Nigeria'}</p>
          <span className={'centre-card__badge centre-card__badge--' + badge.variant}>
            {badge.label}
          </span>
        </div>
        <h3 className="centre-card__name">{centre.name}</h3>
        <p className="centre-card__address">
          {centre.address}
          <br />
          {cityLine}
        </p>
      </header>

      <dl className="centre-card__meta">
        {centre.hours && (
          <>
            <dt>{labels.hours}</dt>
            <dd>{centre.hours}</dd>
          </>
        )}
        {centre.phone && (
          <>
            <dt>{labels.phone}</dt>
            <dd>
              <a href={'tel:' + centre.phone.replace(/[^+\d]/g, '')}>{centre.phone}</a>
            </dd>
          </>
        )}
        {centre.email && (
          <>
            <dt>{labels.email}</dt>
            <dd>
              <a href={'mailto:' + centre.email}>{centre.email}</a>
            </dd>
          </>
        )}
      </dl>

      <div className="centre-card__actions">
        <a
          className="button button-small centre-card__directions"
          href={directionsHref(centre)}
          target="_blank"
          rel="noreferrer"
          aria-label={labels.directions + ' - ' + centre.name}
        >
          {labels.directions}
          <span aria-hidden="true">{'\u2192'}</span>
        </a>
      </div>
    </article>
  );
}

export default async function ServiceCentresPage() {
  const isPreview =
    process.env.NODE_ENV === 'development' &&
    process.env.PREVIEW_WITHOUT_DATABASE === 'true';

  const [centres, { t }] = await Promise.all([
    isPreview
      ? Promise.resolve([] as Centre[])
      : prisma.serviceCentre.findMany({
          where: { published: true },
          orderBy: [{ sortOrder: 'asc' }, { city: 'asc' }],
        }),
    getServerT('front'),
  ]);

  const labels: Labels = {
    hours: t('lcs.hours'),
    phone: t('lcs.phone'),
    email: t('lcs.email'),
    directions: t('cta.getDirections'),
    badgeService: t('lcs.badgeService'),
    badgePickup: t('lcs.badgePickup'),
    badgeBoth: t('lcs.badgeBoth'),
  };

  return (
    <main>
      <section className="page-intro">
        <p className="eyebrow">{t('lcs.eyebrow')}</p>
        <h1>{t('lcs.title')}</h1>
        <p>{t('lcs.intro')}</p>
      </section>

      <section className="section-generous">
        <div className="section-heading">
          <div>
            <p className="eyebrow">{t('lcs.serviceCentresEyebrow')}</p>
            <h2>{t('lcs.serviceCentresHeading')}</h2>
          </div>
          <p>{t('lcs.serviceCentresDesc')}</p>
        </div>
        {centres.length > 0 ? (
          <div className="grid grid--centres">
            {centres.map((c) => (
              <CentreCard key={c.id} centre={c} labels={labels} />
            ))}
          </div>
        ) : (
          <div className="empty-panel">
            <strong>{t('lcs.emptyTitle')}</strong>
            {t('lcs.emptyBody')}
          </div>
        )}
      </section>

      <section className="split-cta">
        <div>
          <p className="eyebrow">{t('lcs.partnerEyebrow')}</p>
          <h2 className="display-2">{t('lcs.partnerHeading')}</h2>
          <p className="lead">{t('lcs.partnerBody')}</p>
        </div>
        <div className="hero-actions">
          <Link className="button" href="/contact">{t('cta.contactLura')}</Link>
          <Link className="button button-ghost" href="/about">{t('nav.about')}</Link>
        </div>
      </section>
    </main>
  );
}