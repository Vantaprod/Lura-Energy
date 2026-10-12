import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/auth/session';
import { isMasterEmail } from '@/lib/auth/masters';
import { sameOrigin } from '@/lib/security/origin';

export async function GET() {
  const me = await getCurrentUser();
  if (!me?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!isMasterEmail(me.email)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const [enabledRow, freqRow, lastRunRow] = await Promise.all([
    prisma.setting.findUnique({ where: { key: 'digest.enabled' } }),
    prisma.setting.findUnique({ where: { key: 'digest.frequency' } }),
    prisma.setting.findUnique({ where: { key: 'digest.lastRunAt' } }),
  ]);

  return NextResponse.json({
    enabled: enabledRow?.value === true,
    frequency: freqRow?.value === 'weekly' ? 'weekly' : 'daily',
    lastRunAt: typeof lastRunRow?.value === 'string' ? lastRunRow.value : null,
  });
}

const schema = z.object({
  enabled: z.boolean().optional(),
  frequency: z.enum(['daily', 'weekly']).optional(),
});

export async function PATCH(req: NextRequest) {
  const me = await getCurrentUser();
  if (!me?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!isMasterEmail(me.email)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  if (!sameOrigin(req)) return NextResponse.json({ error: 'Invalid origin' }, { status: 403 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Invalid payload.' }, { status: 400 });

  const ops: Promise<unknown>[] = [];
  if (parsed.data.enabled !== undefined) {
    ops.push(
      prisma.setting.upsert({
        where: { key: 'digest.enabled' },
        create: { key: 'digest.enabled', value: parsed.data.enabled },
        update: { value: parsed.data.enabled },
      }),
    );
  }
  if (parsed.data.frequency !== undefined) {
    ops.push(
      prisma.setting.upsert({
        where: { key: 'digest.frequency' },
        create: { key: 'digest.frequency', value: parsed.data.frequency },
        update: { value: parsed.data.frequency },
      }),
    );
  }
  await Promise.all(ops);

  await prisma.auditLog.create({
    data: {
      actorId: me.id,
      action: 'digest.settings.update',
      entityType: 'setting',
      metadata: parsed.data,
    },
  });

  return NextResponse.json({ ok: true });
}