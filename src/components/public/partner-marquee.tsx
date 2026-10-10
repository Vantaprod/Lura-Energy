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
 * Seamless left-to-right marquee. The list is rendered 4 times inside a
 * single track; the CSS animation translates from -75% to 0%, which
 * produces an infinite loop with no visible reset (since all 4 copies
 * are identical). Reduced-motion pauses the animation.
 */
export function PartnerMarquee({ partners, eyebrow, heading, body }: Props) {
  if (partners.length === 0) return null;

  const copies = 4;
  const track = Array.from({ length: copies }, (_, copyIndex) =>
    partners.map((p, itemIndex) => ({ partner: p, key: `${copyIndex}-${itemIndex}` })),
  ).flat();

  return (
    <section className="partner-marquee-section">
      <div className="partner-marquee-section__head">
        <p className="eyebrow">{eyebrow}</p>
        <h2 className="partner-marquee-section__title">{heading}</h2>
        {body && <p className="partner-marquee-section__body">{body}</p>}
      </div>

      <div className="partner-marquee" aria-label={heading}>
        <div className="partner-marquee__track">
          {track.map(({ partner, key }, index) => {
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
            const item = (
              <div
                className="partner-marquee__item"
                key={key}
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
            return item;
          })}
        </div>
      </div>
    </section>
  );
}