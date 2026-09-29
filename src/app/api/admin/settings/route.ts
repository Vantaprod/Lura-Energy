import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/auth/session';
import { can } from '@/lib/permissions/policy';
import { sameOrigin } from '@/lib/security/origin';

const keys = [
  'home.heroEyebrow',
  'home.heroTitle',
  'home.heroBody',
  'home.heroPrimaryLabel',
  'home.heroPrimaryHref',
  'home.heroSecondaryLabel',
  'home.heroSecondaryHref',
  'home.heroImages',
  'home.ctaTitle',
  'home.ctaBody',
  'company.intro',
  'contact.email',
  'contact.phone',
  'contact.whatsapp',
  'legal.privacyNotice',
] as const;

type Key = typeof keys[number];

const schema = z.record(z.string(), z.string().max(20000));

export async function GET() {
  const user = await getCurrentUser();
  if (!user || !can(user.role, 'settings.manage')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const items = await prisma.setting.findMany({ where: { key: { in: [...keys] } } });
  return NextResponse.json(Object.fromEntries(items.map((x) => [x.key, x.value])));
}

export async function PATCH(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !can(user.role, 'settings.manage')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!sameOrigin(request)) {
    return NextResponse.json({ error: 'Invalid origin' }, { status: 403 });
  }

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid setting.' }, { status: 400 });
  }

  const badKey = Object.keys(parsed.data).some(
    (key) => !(keys as readonly string[]).includes(key),
  );
  if (badKey) {
    return NextResponse.json({ error: 'Invalid setting.' }, { status: 400 });
  }

  // Validate home.heroImages JSON if present
  if (typeof parsed.data['home.heroImages'] === 'string') {
    const raw = parsed.data['home.heroImages'].trim();
    if (raw) {
      try {
        const json = JSON.parse(raw);
        if (!Array.isArray(json)) {
          return NextResponse.json({ error: 'Hero images must be a JSON array.' }, { status: 400 });
        }
        const ok = json.every(
          (item) =>
            item && typeof item === 'object' &&
            typeof (item as { url?: unknown }).url === 'string',
        );
        if (!ok) {
          return NextResponse.json(
            { error: 'Each hero image needs a "url" string.' },
            { status: 400 },
          );
        }
      } catch {
        return NextResponse.json({ error: 'Hero images is not valid JSON.' }, { status: 400 });
      }
    }
  }

  await prisma.$transaction(async (tx) => {
    for (const [key, value] of Object.entries(parsed.data)) {
      await tx.setting.upsert({
        where: { key },
        create: { key, value },
        update: { value },
      });
    }
    await tx.auditLog.create({
      data: {
        actorId: user.id,
        action: 'site.settings.update',
        entityType: 'setting',
        metadata: { keys: Object.keys(parsed.data) },
      },
    });
  });

  return NextResponse.json({ ok: true });
}