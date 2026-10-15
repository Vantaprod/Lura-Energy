import { NextRequest } from 'next/server';

/**
 * Accept a request when its Origin header matches ANY of:
 *   - APP_URL            (e.g. "https://www.luraenergy.com")
 *   - NEXT_PUBLIC_SITE_URL
 *   - The request's own Host header + x-forwarded-proto
 *   - request.nextUrl.origin
 *
 * Each source is added in three variants:
 *   - as given
 *   - with "www." stripped
 *   - with "www." prepended
 *
 * Also allow:
 *   - localhost / 127.0.0.1 (any port, dev only)
 *   - *.vercel.app (preview deployments)
 */
export function sameOrigin(request: NextRequest): boolean {
  const originHeader = request.headers.get('origin');
  if (!originHeader) return false;

  let originUrl: URL;
  try {
    originUrl = new URL(originHeader);
  } catch {
    return false;
  }
  const origin = originUrl.origin;

  const allowed = new Set<string>();

  const addVariants = (value: string | undefined | null) => {
    if (!value) return;
    try {
      const u = new URL(value);
      const { protocol, host } = u;
      const hostNoWww = host.replace(/^www\./, '');
      const hostWww = host.startsWith('www.') ? host : `www.${host}`;
      allowed.add(`${protocol}//${host}`);
      allowed.add(`${protocol}//${hostNoWww}`);
      allowed.add(`${protocol}//${hostWww}`);
    } catch {
      /* ignore malformed */
    }
  };

  addVariants(process.env.APP_URL);
  addVariants(process.env.NEXT_PUBLIC_SITE_URL);

  // The request's own host — most reliable behind Vercel's proxy
  const host = request.headers.get('host');
  if (host) {
    const proto = request.headers.get('x-forwarded-proto') ?? 'https';
    addVariants(`${proto}://${host}`);
  }

  try {
    addVariants(request.nextUrl.origin);
  } catch {
    /* ignore */
  }

  // Local dev: any port on localhost / 127.0.0.1
  if (
    originUrl.hostname === 'localhost' ||
    originUrl.hostname === '127.0.0.1'
  ) {
    return true;
  }

  // Vercel preview deployments
  if (originUrl.hostname.endsWith('.vercel.app')) {
    return true;
  }

  return allowed.has(origin);
}