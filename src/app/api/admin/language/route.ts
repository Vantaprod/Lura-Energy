import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/auth/session';
import { sameOrigin } from '@/lib/security/origin';

export const dynamic = 'force-dynamic';

const schema = z.object({
  lang: z.enum(['en', 'zh', 'fr']),
});

async function readCurrentLang(): Promise<'en' | 'zh' | 'fr'> {
  try {
    const row = await prisma.setting.findUnique({
      where: { key: 'admin.language' },
    });
    const v = row?.value;
    return v === 'zh' || v === 'fr' ? v : 'en';
  } catch {
    return 'en';
  }
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const lang = await readCurrentLang();
  return NextResponse.json({ lang });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!sameOrigin(request)) {
    return NextResponse.json({ error: 'Invalid origin' }, { status: 403 });
  }

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid language.' }, { status: 400 });
  }

  await prisma.$transaction(async (tx) => {
    await tx.setting.upsert({
      where: { key: 'admin.language' },
      create: { key: 'admin.language', value: parsed.data.lang },
      update: { value: parsed.data.lang },
    });
    await tx.auditLog.create({
      data: {
        actorId: user.id,
        action: 'admin.language.change',
        entityType: 'setting',
        entityId: 'admin.language',
        metadata: { lang: parsed.data.lang },
      },
    });
  });

  return NextResponse.json({ ok: true, lang: parsed.data.lang });
}