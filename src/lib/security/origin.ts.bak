import { NextRequest } from 'next/server';
export function sameOrigin(request: NextRequest) {
  const origin = request.headers.get('origin');
  if (!origin) return false;
  try {
    const expected = process.env.APP_URL ? new URL(process.env.APP_URL) : request.nextUrl;
    return new URL(origin).origin === expected.origin;
  } catch { return false; }
}
