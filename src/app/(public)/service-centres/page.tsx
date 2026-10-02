import Link from 'next/link';
import type { Metadata } from 'next';
import { prisma } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Service Centres & Pickup Points',
  description:
    'Find Lura Chain Store service centres and pickup points across Nigeria. Installation services, Grade A solar lithium batteries, hybrid inverters, solar panels, and solar accessories.',
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

function CentreCard({ centre }: { centre: Centre }) {
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
            <dt>Hours</dt>
            <dd>{centre.hours}</dd>
          </>
        )}
        {centre.phone && (
          <>
            <dt>Phone</dt>
            <dd>
              <a href={'tel:' + centre.phone.replace(/[^+\d]/g, '')}>{centre.phone}</a>
            </dd>
          </>
        )}
        {centre.email && (
          <>
            <dt>Email</dt>
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
          aria-label={'Get directions to ' + centre.name}
        >
          Get Directions
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

  const centres: Centre[] = isPreview
    ? []
    : await prisma.serviceCentre.findMany({
        where: { published: true },
        orderBy: [{ sortOrder: 'asc' }, { city: 'asc' }],
      });

  const serviceCentres = centres.filter(
    (c) => c.type === 'Service Centre' || c.type === 'Both' || !c.type,
  );
  const pickupPoints = centres.filter((c) => c.type === 'Pickup Point');

  return (
    <main>
      <section className="page-intro">
        <p className="eyebrow">Lura Chain Store</p>
        <h1>Service Centres &amp; Pickup Points</h1>
        <p>
          Verified Lura locations across Nigeria for installation services,
          product sales, and pickup. Every LCS location is authorised and
          supported directly by Lura.
        </p>
      </section>

      {centres.length === 0 && (
        <section className="section-generous">
          <div className="empty-panel">
            <strong>Locations are being added</strong>
            Published Lura Chain Store locations will appear here as they are
            approved.
          </div>
        </section>
      )}

      {serviceCentres.length > 0 && (
        <section className="section-generous">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Full support</p>
              <h2>Service Centres</h2>
            </div>
            <p>
              Authorised Lura locations offering installation services, Grade A
              solar lithium batteries, hybrid inverters, solar panels, and
              solar accessories.
            </p>
          </div>
          <div className="grid grid--centres">
            {serviceCentres.map((c) => (
              <CentreCard centre={c} key={c.id} />
            ))}
          </div>
        </section>
      )}

      {pickupPoints.length > 0 && (
        <section className="section-generous section-tint">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Collect in person</p>
              <h2>Pickup Points</h2>
            </div>
            <p>
              Pick up verified Lura solar batteries, inverters, panels, and
              accessories from these authorised locations.
            </p>
          </div>
          <div className="grid grid--centres">
            {pickupPoints.map((c) => (
              <CentreCard centre={c} key={c.id} />
            ))}
          </div>
        </section>
      )}

      <section className="split-cta">
        <div>
          <p className="eyebrow">Become a partner</p>
          <h2 className="display-2">Want to open an LCS location?</h2>
          <p className="lead">
            Partner with Lura to bring service and pickup to your city.
          </p>
        </div>
        <div className="hero-actions">
          <Link className="button" href="/contact">Contact Lura</Link>
          <Link className="button button-ghost" href="/about">About Lura</Link>
        </div>
      </section>
    </main>
  );
}