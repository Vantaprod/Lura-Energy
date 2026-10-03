import Link from 'next/link';
import type { Metadata } from 'next';
import { prisma } from '@/lib/db/prisma';
import { getServerT } from '@/lib/i18n/server';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Service Centres & Pickup Points',
  description:
    'Find Lura Chain Store service centres and pickup points across Nigeria.',
};

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
};

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

  return (
    <article className="centre-card">
      <header className="centre-card__head">
        <p className="eyebrow eyebrow-plain">{centre.state ?? 'Nigeria'}</p>
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
    getServerT(),
  ]);

  const labels: Labels = {
    hours: t('lcs.hours'),
    phone: t('lcs.phone'),
    email: t('lcs.email'),
    directions: t('cta.getDirections'),
  };

  const serviceCentres = centres.filter(
    (c) => c.type === 'Service Centre' || c.type === 'Both' || !c.type,
  );
  const pickupPoints = centres.filter((c) => c.type === 'Pickup Point');

  return (
    <main>
      <section className="page-intro">
        <p className="eyebrow">{t('lcs.eyebrow')}</p>
        <h1>{t('lcs.title')}</h1>
        <p>{t('lcs.intro')}</p>
      </section>

      {centres.length === 0 && (
        <section className="section-generous">
          <div className="empty-panel">
            <strong>{t('lcs.emptyTitle')}</strong>
            {t('lcs.emptyBody')}
          </div>
        </section>
      )}

      {serviceCentres.length > 0 && (
        <section className="section-generous">
          <div className="section-heading">
            <div>
              <p className="eyebrow">{t('lcs.serviceCentresEyebrow')}</p>
              <h2>{t('lcs.serviceCentresHeading')}</h2>
            </div>
            <p>{t('lcs.serviceCentresDesc')}</p>
          </div>
          <div className="grid grid--centres">
            {serviceCentres.map((c) => (
              <CentreCard key={c.id} centre={c} labels={labels} />
            ))}
          </div>
        </section>
      )}

      {pickupPoints.length > 0 && (
        <section className="section-generous section-tint">
          <div className="section-heading">
            <div>
              <p className="eyebrow">{t('lcs.pickupEyebrow')}</p>
              <h2>{t('lcs.pickupHeading')}</h2>
            </div>
            <p>{t('lcs.pickupDesc')}</p>
          </div>
          <div className="grid grid--centres">
            {pickupPoints.map((c) => (
              <CentreCard key={c.id} centre={c} labels={labels} />
            ))}
          </div>
        </section>
      )}

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