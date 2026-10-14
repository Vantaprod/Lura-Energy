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
 * Seamless infinite marquee.
 *
 * Key detail: the track has NO `gap` — spacing comes ONLY from symmetric
 * item `padding`. That makes the distance between the last item of copy 1
 * and the first item of copy 2 identical to the distance between any two
 * adjacent items. Translation of exactly -50% therefore lands on a pixel-
 * perfect seam and the loop is invisible.
 */
export function PartnerMarquee({ partners, eyebrow, heading, body }: Props) {
  if (partners.length === 0) return null;

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
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={partner.logoUrl}
                      alt={partner.logoAlt ?? partner.name}
                      className="partner-marquee__logo"
                      loading="lazy"
                    />
                  </a>
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={partner.logoUrl}
                    alt={partner.logoAlt ?? partner.name}
                    className="partner-marquee__logo"
                    loading="lazy"
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}