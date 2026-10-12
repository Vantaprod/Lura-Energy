import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { isMasterEmail } from '@/lib/auth/masters';
import { sameOrigin } from '@/lib/security/origin';
import { runDigest } from '@/lib/mail/digest';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const me = await getCurrentUser();
  if (!me?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!isMasterEmail(me.email)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  if (!sameOrigin(req)) return NextResponse.json({ error: 'Invalid origin' }, { status: 403 });

  // force=true runs even if disabled, so masters can test.
  const result = await runDigest({ force: true });

  return NextResponse.json({
    ok: true,
    sent: result.sent,
    total: result.total,
    failures: result.failures,
    frequency: result.frequency,
  });
}