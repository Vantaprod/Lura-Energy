import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Cookie Policy',
  description: 'How Lura Energy uses cookies.',
};

const EFFECTIVE = '12 October 2026';

export default function CookiesPage() {
  return (
    <main className="legal-page">
      <div className="legal-container">
        <p className="eyebrow">Legal</p>
        <h1>Cookie Policy</h1>
        <p className="legal-meta">Effective date: {EFFECTIVE}</p>

        <p className="legal-lead">
          We keep our use of cookies to the absolute minimum. This page explains exactly which
          cookies we use, why, and how you can control them.
        </p>

        <section>
          <h2>1. What are cookies?</h2>
          <p>
            Cookies are small text files that a website stores in your browser. They allow a
            site to remember information between page loads, such as whether you are signed in.
          </p>
        </section>

        <section>
          <h2>2. Cookies we use</h2>
          <p>
            We use <strong>one cookie only</strong>, and only when you sign in to the
            administrator area:
          </p>

          <div className="legal-table-wrap">
            <table className="legal-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Purpose</th>
                  <th>Duration</th>
                  <th>Type</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <code>lura_session</code>
                  </td>
                  <td>Keeps an administrator signed in securely</td>
                  <td>7 days</td>
                  <td>Essential</td>
                </tr>
              </tbody>
            </table>
          </div>

          <p>
            This cookie is <strong>HttpOnly</strong>, <strong>Secure</strong> (over HTTPS), and{' '}
            <strong>SameSite=Lax</strong>. It is required for the administrator area to function.
            It contains an opaque session token — no personal information is stored inside the
            cookie itself.
          </p>
        </section>

        <section>
          <h2>3. Cookies we do NOT use</h2>
          <ul>
            <li>No advertising cookies.</li>
            <li>No tracking cookies.</li>
            <li>No third-party analytics cookies.</li>
            <li>No social-media cookies.</li>
            <li>No fingerprinting.</li>
          </ul>
          <p>
            Because we do not use any non-essential cookies, we do not display a cookie consent
            banner. Under the NDPA and similar regulations, only essential cookies that are
            strictly necessary to provide the service are exempt from consent.
          </p>
        </section>

        <section>
          <h2>4. Managing cookies</h2>
          <p>
            You can delete or block cookies in your browser settings. If you block the session
            cookie, you will not be able to sign in to the administrator area. The public website
            will continue to work normally.
          </p>
        </section>

        <section>
          <h2>5. Related policies</h2>
          <p>
            For how we handle personal information generally, see our{' '}
            <Link href="/privacy">Privacy Policy</Link>. For site usage terms, see our{' '}
            <Link href="/terms">Terms of Service</Link>.
          </p>
        </section>

        <section>
          <h2>6. Contact</h2>
          <p>
            Questions about cookies:{' '}
            <a href="mailto:privacy@luraenergy.com">privacy@luraenergy.com</a>.
          </p>
        </section>
      </div>
    </main>
  );
}