type Partner = {
  id: string;
  name: string;
  logoUrl: string;
  logoAlt: string | null;
  websiteUrl: string | null;
};

type Props = {
  partners: Partner[];
  eyebrow: string;
  heading: string;
  body?: string;
};

/**
 * Seamless infinite marquee. The list is rendered TWICE inside a single
 * flex track with width:max-content. The CSS animation translates from
 * 0 to -50%, so when it loops the second copy is at exactly the same
 * position the first copy started from — no gap, no jump.
 */
export function PartnerMarquee({ partners, eyebrow, heading, body }: Props) {
  if (partners.length === 0) return null;

  // Two identical copies → the animation can translate -50% and loop cleanly.
  const track = [...partners, ...partners];

  return (
    <section className="partner-marquee-section">
      <div className="partner-marquee-section__head">
        <p className="eyebrow">{eyebrow}</p>
        <h2 className="partner-marquee-section__title">{heading}</h2>
        {body && <p className="partner-marquee-section__body">{body}</p>}
      </div>

      <div className="partner-marquee" aria-label={heading}>
        <div className="partner-marquee__track">
          {track.map((partner, index) => {
            const firstCopy = index < partners.length;
            const content = (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={partner.logoUrl}
                alt={partner.logoAlt ?? partner.name}
                className="partner-marquee__logo"
                loading="lazy"
              />
            );
            return (
              <div
                className="partner-marquee__item"
                key={`${index}-${partner.id}`}
                aria-hidden={!firstCopy ? 'true' : undefined}
              >
                {partner.websiteUrl && firstCopy ? (
                  <a
                    href={partner.websiteUrl}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="partner-marquee__link"
                    aria-label={partner.name}
                  >
                    {content}
                  </a>
                ) : (
                  content
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}