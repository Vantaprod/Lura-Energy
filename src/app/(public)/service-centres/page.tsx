import { prisma } from '@/lib/db/prisma';
import { getServerT } from '@/lib/i18n/server';

export const dynamic = 'force-dynamic';

export default async function ServiceCentresPage() {
  const centres = await prisma.serviceCentre.findMany({
    where: { published: true },
    orderBy: { sortOrder: 'asc' },
  });

  const { t } = await getServerT('front');

  return (
    <div className="section">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Full Support</p>
          <h1 className="display-2">Service Centres</h1>
        </div>
        <p className="lead" style={{ maxWidth: 400 }}>
          Authorised Lura locations offering installation services, Grade A solar lithium batteries, hybrid inverters, solar panels, and solar accessories.
        </p>
      </div>

      {centres.length === 0 ? (
        <div className="empty-panel">
          <strong>Locations are being added</strong>
          <p>Published Lura Chain Store locations will appear here as they are approved.</p>
        </div>
      ) : (
        <div className="grid grid--centres">
          {centres.map((centre) => {
            const badgeClass = centre.type === 'Pickup Point' ? 'pickup' : centre.type === 'Both' ? 'both' : 'service';
            const badgeText = centre.type === 'Both' ? 'SERVICE & PICKUP' : centre.type === 'Pickup Point' ? 'PICKUP POINT' : 'SERVICE CENTRE';
            
            return (
              <article className="centre-card" key={centre.id}>
                <div className="centre-card__top">
                  <p className="eyebrow">{centre.state}</p>
                  <span className={`centre-card__badge centre-card__badge--${badgeClass}`}>
                    {badgeText}
                  </span>
                </div>
                
                <h3 className="centre-card__name">{centre.name}</h3>
                
                <p className="centre-card__address">
                  {centre.address}
                  <br />
                  {centre.city}, {centre.state}
                </p>
                
                <dl className="centre-card__meta">
                  <dt>Hours</dt>
                  <dd>{centre.hours || 'Mon-Fri, 10am-5pm'}</dd>
                  <dt>Phone</dt>
                  <dd>
                    {centre.phone ? <a href={`tel:${centre.phone.replace(/[^0-9+]/g, '')}`}>{centre.phone}</a> : 'N/A'}
                  </dd>
                  <dt>Email</dt>
                  <dd>
                    {centre.email ? <a href={`mailto:${centre.email}`}>{centre.email}</a> : 'N/A'}
                  </dd>
                </dl>
                
                <div className="centre-card__actions">
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(centre.address + ', ' + centre.city + ', ' + centre.state)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="button centre-card__directions"
                  >
                    Get Directions <span aria-hidden="true">→</span>
                  </a>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}