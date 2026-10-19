import Image from 'next/image';
import Link from 'next/link';
import { prisma } from '@/lib/db/prisma';
import { getServerT } from '@/lib/i18n/server';
import { EnergyLines } from '@/components/ui/energy-lines';

export const dynamic = 'force-dynamic';

type ContactSettings = {
  email: string;
  phone: string;
  whatsapp: string;
  address: string;
};

const SOCIAL_LINKS = [
  { key: 'tiktok', href: 'https://www.tiktok.com/@luraenergy', label: 'TikTok' },
  { key: 'facebook', href: 'https://www.facebook.com/share/1DmUupvwws/?mibextid=wwXIfr', label: 'Facebook' },
  { key: 'instagram', href: 'https://www.instagram.com/wunmiola8660/', label: 'Instagram' },
] as const;

async function loadContactSettings(): Promise<ContactSettings> {
  const empty: ContactSettings = { email: '', phone: '', whatsapp: '', address: '' };
  if (
    process.env.NODE_ENV === 'development' &&
    process.env.PREVIEW_WITHOUT_DATABASE === 'true'
  ) {
    return empty;
  }
  try {
    const rows = await prisma.setting.findMany({
      where: {
        key: {
          in: ['contact.email', 'contact.phone', 'contact.whatsapp', 'contact.address'],
        },
      },
    });
    const map = Object.fromEntries(
      rows.map((row) => [row.key, typeof row.value === 'string' ? row.value : '']),
    );
    return {
      email: map['contact.email'] ?? '',
      phone: map['contact.phone'] ?? '',
      whatsapp: (map['contact.whatsapp'] ?? '').replace(/\D/g, ''),
      address: map['contact.address'] ?? '',
    };
  } catch {
    return empty;
  }
}

function TikTokIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c5.05-.5 9-4.76 9-9.95z" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

const SOCIAL_ICONS: Record<string, () => React.ReactElement> = {
  tiktok: TikTokIcon,
  facebook: FacebookIcon,
  instagram: InstagramIcon,
};

const footerTitleStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.10em',
  textTransform: 'uppercase',
  color: '#FFFFFF',
  margin: '0 0 10px',
};

const footerListStyle: React.CSSProperties = {
  listStyle: 'none',
  margin: 0,
  padding: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
};

export async function SiteFooter() {
  const [{ email, phone, whatsapp, address }, { t }] = await Promise.all([
    loadContactSettings(),
    getServerT('front'),
  ]);
  const year = new Date().getFullYear();

  return (
    <footer
      className="site-footer"
      style={{
        background: '#0A1550',
        color: 'rgba(255,255,255,0.78)',
        padding: '28px 0 0',
        fontSize: 13,
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      <EnergyLines />
      <div className="footer-wrap" style={{ position: 'relative', zIndex: 10 }}>
        <div className="footer-columns-grid">
          <div className="footer-col">
            <h3 style={footerTitleStyle}>{t('footer.products')}</h3>
            <ul style={footerListStyle}>
              <li><Link href="/products" className="footer-link">All products</Link></li>
              <li><Link href="/products?category=inverters" className="footer-link">Inverters</Link></li>
              <li><Link href="/products?category=batteries" className="footer-link">Batteries</Link></li>
              <li><Link href="/products?category=panels" className="footer-link">Solar panels</Link></li>
              <li><Link href="/products?category=storage" className="footer-link">Energy storage</Link></li>
            </ul>
          </div>

          <div className="footer-col">
            <h3 style={footerTitleStyle}>Support</h3>
            <ul style={footerListStyle}>
              <li><Link href="/faqs" className="footer-link">FAQs</Link></li>
              <li><Link href="/service-centres" className="footer-link">Service centres</Link></li>
              <li><Link href="/quote" className="footer-link">Request a quote</Link></li>
              <li><Link href="/resources" className="footer-link">Resources</Link></li>
            </ul>
          </div>

          <div className="footer-col">
            <h3 style={footerTitleStyle}>About</h3>
            <ul style={footerListStyle}>
              <li><Link href="/about" className="footer-link">About us</Link></li>
              <li><Link href="/projects" className="footer-link">Projects</Link></li>
              <li><Link href="/solutions" className="footer-link">Solutions</Link></li>
              <li><Link href="/services" className="footer-link">Services</Link></li>
              <li><Link href="/admin/login" className="footer-link">{t('footer.staffSignIn')}</Link></li>
            </ul>
          </div>

          <div className="footer-col">
            <h3 style={footerTitleStyle}>Contact Us</h3>
            <ul style={footerListStyle}>
              {phone && (
                <li>
                  <a href={'tel:' + phone.replace(/[^+\d]/g, '')} className="footer-link">{phone}</a>
                </li>
              )}
              {email && (
                <li>
                  <a href={'mailto:' + email} className="footer-link">{email}</a>
                </li>
              )}
              {whatsapp && (
                <li>
                  <a href={'https://wa.me/' + whatsapp} target="_blank" rel="noreferrer" className="footer-link">
                    {t('footer.whatsapp')}
                  </a>
                </li>
              )}
              {address && (
                <li>
                  <span
                    className="footer-link"
                    style={{ cursor: 'default', wordBreak: 'break-word' }}
                  >
                    {address}
                  </span>
                </li>
              )}
              <li><Link href="/contact" className="footer-link">Find a partner</Link></li>
            </ul>
          </div>

          <div className="footer-col footer-right-col">
            <div>
              <h3 style={footerTitleStyle}>Follow Us</h3>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.62)', margin: '-2px 0 10px' }}>
                We want to hear from you!
              </p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {SOCIAL_LINKS.map(({ key, href, label }) => {
                  const Icon = SOCIAL_ICONS[key];
                  return (
                    <a
                      key={key}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Lura Energy on ${label}`}
                      title={label}
                      className="footer-social-icon"
                    >
                      <Icon />
                    </a>
                  );
                })}
              </div>
            </div>

            <div>
              <h3 style={footerTitleStyle}>Email Us</h3>
              <a
                href={'mailto:' + (email || 'info@luraenergy.com')}
                className="footer-email-link"
              >
                {email || 'info@luraenergy.com'}
              </a>
            </div>
          </div>
        </div>

        <div
          style={{
            padding: '20px 0 8px',
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
          }}
        >
          <p
            style={{
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: '0.10em',
              textTransform: 'uppercase',
              color: '#F58220',
              margin: 0,
            }}
          >
            Nigeria · West Africa · Sub-Saharan Africa
          </p>
          <p
            style={{
              fontSize: 11,
              color: 'rgba(255,255,255,0.48)',
              margin: 0,
              letterSpacing: '0.02em',
            }}
          >
            Distribution · local channels · energy storage · solar · electrical supply
          </p>
        </div>

        <div className="footer-divider" aria-hidden="true" />

        <div className="footer-bottom">
          <Link
            href="/"
            aria-label={t('aria.siteHome')}
            className="footer-logo-mini"
          >
            <Image
              src="/brand/lura-logo.png"
              alt="Lura Energy"
              width={70}
              height={22}
              style={{ height: "auto", width: "auto" }}
            />
          </Link>
          <div className="footer-bottom__legal">
            <Link href="/privacy" className="footer-link">Privacy Policy</Link>
            <span className="footer-sep">|</span>
            <Link href="/terms" className="footer-link">Terms of Use</Link>
            <span className="footer-sep">|</span>
            <span>{'\u00A9'} {year} Lura Energy. All rights reserved.</span>
          </div>
        </div>
      </div>

      <style>{`
        .footer-wrap {
          width: 100%;
          padding: 0 48px;
        }

        .footer-columns-grid {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr 1fr 1.4fr;
          gap: 40px;
          padding-bottom: 20px;
          align-items: flex-start;
        }

        .footer-col {
          min-width: 0;
        }

        .footer-right-col {
          display: flex;
          flex-direction: column;
          gap: 16px;
          border-left: 1px solid rgba(255, 255, 255, 0.10);
          padding-left: 32px;
          justify-self: end;
          min-width: 220px;
        }

        .footer-link {
          color: rgba(255, 255, 255, 0.72);
          font-size: 13px;
          text-decoration: none;
          line-height: 1.5;
          display: inline-block;
          transition: color 150ms ease, transform 150ms ease;
        }
        .footer-link:hover,
        .footer-link:focus-visible {
          color: #F58220;
          transform: translateX(2px);
          outline: none;
        }

        .footer-social-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 30px;
          height: 30px;
          border-radius: 50%;
          color: rgba(255, 255, 255, 0.85);
          background: rgba(255, 255, 255, 0.10);
          text-decoration: none;
          transition: background 150ms ease, color 150ms ease, transform 150ms ease;
        }
        .footer-social-icon:hover,
        .footer-social-icon:focus-visible {
          background: #F58220;
          color: #FFFFFF;
          transform: translateY(-2px);
          outline: none;
        }
        .footer-social-icon svg { display: block; }

        .footer-email-link {
          color: rgba(255, 255, 255, 0.85);
          font-size: 13px;
          text-decoration: none;
          border-bottom: 1px solid rgba(255, 255, 255, 0.20);
          padding-bottom: 1px;
          transition: color 150ms ease, border-color 150ms ease;
        }
        .footer-email-link:hover,
        .footer-email-link:focus-visible {
          color: #F58220;
          border-bottom-color: #F58220;
          outline: none;
        }

        .footer-divider {
          height: 1px;
          background: rgba(255, 255, 255, 0.10);
          margin: 0 0 12px;
        }

        .footer-bottom {
          display: flex;
          align-items: center;
          gap: 16px;
          padding-bottom: 16px;
          flex-wrap: wrap;
        }
        .footer-logo-mini {
          display: inline-flex;
          align-items: center;
          height: 22px;
          flex: 0 0 auto;
        }
        .footer-bottom__legal {
          flex: 1;
          text-align: center;
          font-size: 12px;
          color: rgba(255, 255, 255, 0.55);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          flex-wrap: wrap;
        }
        .footer-sep { color: rgba(255, 255, 255, 0.25); }

        @media (max-width: 1100px) {
          .footer-wrap { padding: 0 32px; }
          .footer-columns-grid {
            grid-template-columns: 1fr 1fr 1fr 1fr;
            gap: 32px;
          }
          .footer-right-col {
            grid-column: 1 / -1;
            border-left: none;
            padding-left: 0;
            border-top: 1px solid rgba(255, 255, 255, 0.10);
            padding-top: 20px;
            flex-direction: row;
            gap: 48px;
            justify-self: stretch;
            min-width: 0;
          }
        }

        @media (max-width: 640px) {
          .footer-wrap { padding: 0 24px; }
          .footer-columns-grid {
            grid-template-columns: 1fr 1fr;
            gap: 24px 20px;
            padding-bottom: 16px;
          }
          .footer-right-col {
            grid-column: 1 / -1;
            flex-direction: row;
            gap: 32px;
            border-top: 1px solid rgba(255, 255, 255, 0.10);
            padding-top: 16px;
            justify-content: flex-start;
          }
          .footer-bottom {
            flex-direction: column;
            gap: 12px;
            text-align: center;
            padding-bottom: 20px;
          }
          .footer-bottom__legal {
            flex-direction: column;
            gap: 4px;
          }
          .footer-sep { display: none; }
        }

        @media (max-width: 400px) {
          .footer-columns-grid {
            gap: 20px 16px;
          }
        }
      `}</style>
    </footer>
  );
}