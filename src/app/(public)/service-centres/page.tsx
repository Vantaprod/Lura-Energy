import Link from 'next/link';
import type { Metadata } from 'next';
import { prisma } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Service Centres & Pickup Points',
  description:
    'Find Lura Chain Store service centres and pickup points across Nigeria. Verified Lura installations, sales, and support.',
};

export default async function ServiceCentresPage() {
  const isPreview =
    process.env.NODE_ENV === 'development' &&
    process.env.PREVIEW_WITHOUT_DATABASE === 'true';

  const centres = isPreview
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
          Verified Lura locations across Nigeria for installations, sales, spare
          parts, and product pickup. Every LCS location is authorised and
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
              Authorised Lura locations offering installation, service, spare
              parts, and warranty support.
            </p>
          </div>
          <div className="grid">
            {serviceCentres.map((c) => (
              <article className="record-card" key={c.id}>
                <div>
                  <p className="eyebrow eyebrow-plain">{c.state ?? 'Nigeria'}</p>
                  <h3>{c.name}</h3>
                  <p>
                    {c.address}
                    <br />
                    {c.city}
                    {c.state ? ', ' + c.state : ''}
                  </p>
                </div>
                <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {c.phone && <a href={'tel:' + c.phone.replace(/[^+\d]/g, '')}>Call: {c.phone}</a>}
                  {c.email && <a href={'mailto:' + c.email}>{c.email}</a>}
                  {c.hours && <span style={{ fontSize: '13px', color: 'var(--muted)' }}>{c.hours}</span>}
                  {c.latitude && c.longitude && (
                    <a
                      href={'https://www.google.com/maps?q=' + c.latitude + ',' + c.longitude}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Directions {'\u2192'}
                    </a>
                  )}
                </div>
              </article>
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
              Pick up verified Lura products and accessories from these
              authorised locations.
            </p>
          </div>
          <div className="grid">
            {pickupPoints.map((c) => (
              <article className="record-card" key={c.id}>
                <div>
                  <p className="eyebrow eyebrow-plain">{c.state ?? 'Nigeria'}</p>
                  <h3>{c.name}</h3>
                  <p>
                    {c.address}
                    <br />
                    {c.city}
                    {c.state ? ', ' + c.state : ''}
                  </p>
                </div>
                <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {c.phone && <a href={'tel:' + c.phone.replace(/[^+\d]/g, '')}>Call: {c.phone}</a>}
                  {c.hours && <span style={{ fontSize: '13px', color: 'var(--muted)' }}>{c.hours}</span>}
                </div>
              </article>
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