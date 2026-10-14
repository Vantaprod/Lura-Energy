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
 * KEY REQUIREMENT: the track must be at least 2× the viewport width,
 * otherwise the empty space on the far side of the animation becomes
 * visible. We render the partner list 6 times, so even on a 4K monitor
 * (3840px) the track is 6 × content-width ≥ 3840px.
 *
 * Translate -50% = shift by exactly half the track = 3 copies.
 * Because copies 1-3 and 4-6 are identical, the seam is invisible.
 */
export function PartnerMarquee({ partners, eyebrow, heading, body }: Props) {
  if (partners.length === 0) return null;

  const COPIES = 6;
  const track: Partner[] = [];
  for (let i = 0; i < COPIES; i++) {
    track.push(...partners);
  }

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
            const isFirstCopy = index < partners.length;
            const img = (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={partner.logoUrl}
                alt={partner.logoAlt ?? partner.name}
                className="partner-marquee__logo"
                loading="eager"
                decoding="sync"
                draggable={false}
              />
            );
            return (
              <div
                className="partner-marquee__item"
                key={`${index}-${partner.id}`}
                aria-hidden={!isFirstCopy ? 'true' : undefined}
              >
                {partner.websiteUrl && isFirstCopy ? (
                  <a
                    href={partner.websiteUrl}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="partner-marquee__link"
                    aria-label={partner.name}
                  >
                    {img}
                  </a>
                ) : (
                  img
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}