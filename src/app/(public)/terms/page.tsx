import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'Terms governing your use of the Lura Energy website.',
};

const EFFECTIVE = '12 October 2026';

export default function TermsPage() {
  return (
    <main className="legal-page">
      <div className="legal-container">
        <p className="eyebrow">Legal</p>
        <h1>Terms of Service</h1>
        <p className="legal-meta">Effective date: {EFFECTIVE}</p>

        <p className="legal-lead">
          By using this website you agree to these terms. If you do not agree, please do not use
          the site.
        </p>

        <section>
          <h2>1. About us</h2>
          <p>
            This website is operated by Lura Energy, a solar energy company based in Nigeria.
            Contact: <a href="mailto:info@luraenergy.com">info@luraenergy.com</a>.
          </p>
        </section>

        <section>
          <h2>2. Permitted use</h2>
          <p>You may use this site to:</p>
          <ul>
            <li>Browse product and project information for legitimate purposes.</li>
            <li>Submit genuine enquiries and access requests.</li>
            <li>Contact us through the channels provided.</li>
          </ul>
          <p>You agree NOT to:</p>
          <ul>
            <li>Attempt to access administrator areas without authorization.</li>
            <li>Submit false, misleading, or harmful content through forms.</li>
            <li>Scrape, copy, or republish site content without permission.</li>
            <li>Interfere with the security or normal operation of the site.</li>
            <li>Use automated tools to send excessive requests.</li>
          </ul>
        </section>

        <section>
          <h2>3. Intellectual property</h2>
          <p>
            All content on this site — text, images, logos, product photographs, design, code,
            and data — is owned by Lura Energy or its partners and is protected by Nigerian and
            international copyright law. You may not reproduce, distribute, or create derivative
            works without written permission.
          </p>
        </section>

        <section>
          <h2>4. Product information</h2>
          <p>
            We aim to keep product details accurate and up to date. However, specifications,
            availability, and pricing are subject to change without notice. Nothing on this site
            constitutes a binding offer to sell. Final terms for any purchase or installation
            are set out in the signed contract between you and Lura Energy.
          </p>
        </section>

        <section>
          <h2>5. Third-party content</h2>
          <p>
            Our site may reference third-party products, brands, or services. Those remain the
            property of their respective owners and are shown for identification purposes only.
            Reference does not imply endorsement beyond the commercial relationship Lura Energy
            has with that partner.
          </p>
        </section>

        <section>
          <h2>6. Availability</h2>
          <p>
            We aim to keep the site available at all times but do not guarantee uninterrupted
            service. We may suspend or modify the site for maintenance, upgrades, or reasons
            outside our control.
          </p>
        </section>

        <section>
          <h2>7. Limitation of liability</h2>
          <p>
            To the fullest extent permitted by Nigerian law, Lura Energy is not liable for any
            indirect, incidental, or consequential loss arising from your use of this website,
            including lost profits, lost data, or business interruption. Our total liability for
            any claim relating to the website is limited to the amount you paid us for the
            specific service giving rise to the claim.
          </p>
        </section>

        <section>
          <h2>8. Indemnity</h2>
          <p>
            You agree to indemnify Lura Energy against claims arising from your misuse of the
            site or your breach of these terms.
          </p>
        </section>

        <section>
          <h2>9. Privacy</h2>
          <p>
            Our handling of personal information is governed by our{' '}
            <Link href="/privacy">Privacy Policy</Link>, which forms part of these terms.
          </p>
        </section>

        <section>
          <h2>10. Governing law</h2>
          <p>
            These terms are governed by the laws of the Federal Republic of Nigeria. Any dispute
            is subject to the exclusive jurisdiction of the Nigerian courts.
          </p>
        </section>

        <section>
          <h2>11. Changes to these terms</h2>
          <p>
            We may update these terms at any time. The effective date at the top of this page
            reflects the latest revision. Continued use of the site after changes means you
            accept the updated terms.
          </p>
        </section>

        <section>
          <h2>12. Contact</h2>
          <p>
            Questions about these terms:{' '}
            <a href="mailto:info@luraenergy.com">info@luraenergy.com</a> or use our{' '}
            <Link href="/contact">contact form</Link>.
          </p>
        </section>
      </div>
    </main>
  );
}