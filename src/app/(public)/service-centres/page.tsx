import { prisma } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

export default async function ServiceCentresPage() {
  const centres = await prisma.serviceCentre.findMany({
    where: { published: true },
    orderBy: { sortOrder: 'asc' },
  });

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
            let badgeBg = '#1428A0';
            let badgeText = 'SERVICE CENTRE';
            
            if (centre.type === 'Pickup Point') {
              badgeBg = '#1F7A4D';
              badgeText = 'PICKUP POINT';
            } else if (centre.type === 'Both') {
              badgeBg = '#F58220';
              badgeText = 'SERVICE & PICKUP';
            }

            return (
              <article className="centre-card" key={centre.id}>
                
                {/* INLINE STYLES: Bulletproof and won't be hidden by global CSS */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <p className="eyebrow" style={{ margin: 0 }}>{centre.state}</p>
                  <span style={{ 
                    display: 'inline-block', 
                    padding: '4px 12px', 
                    borderRadius: '999px', 
                    fontSize: '10px', 
                    fontWeight: 800, 
                    textTransform: 'uppercase', 
                    letterSpacing: '0.08em', 
                    color: '#FFFFFF', 
                    backgroundColor: badgeBg,
                    whiteSpace: 'nowrap'
                  }}>
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