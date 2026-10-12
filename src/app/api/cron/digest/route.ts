import { NextRequest, NextResponse } from 'next/server';
import { runDigest } from '@/lib/mail/digest';

export const dynamic = 'force-dynamic';

async function handle(req: NextRequest) {
  const expected = process.env.CRON_SECRET;
  if (expected) {
    const got = req.headers.get('authorization') ?? '';
    if (got !== `Bearer ${expected}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }
  const result = await runDigest();
  if (result.skipped === 'DISABLED') {
    return NextResponse.json({ ok: true, skipped: 'DISABLED' });
  }
  return NextResponse.json({
    ok: true,
    sent: result.sent,
    skipped: result.total - result.sent,
    failures: result.failures,
    frequency: result.frequency,
  });
}

export async function GET(req: NextRequest) {
  return handle(req);
}
export async function POST(req: NextRequest) {
  return handle(req);
}