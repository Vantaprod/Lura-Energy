import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/auth/session';
import { can } from '@/lib/permissions/policy';
import { sameOrigin } from '@/lib/security/origin';

const schema = z.object({
  name: z.string().trim().min(1).max(160),
  slug: z.string().trim().min(1).max(180).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  brand: z.string().trim().max(80).optional(),
  categoryId: z.string().min(1).optional(),
  summary: z.string().max(500).optional(),
  description: z.string().max(10000).optional(),
  status: z.string().max(80).optional(),
  warranty: z.string().max(300).optional(),
  seoTitle: z.string().max(180).optional(),
  seoDescription: z.string().max(320).optional(),
  published: z.boolean().default(true),
  featured: z.boolean().default(false),
});

// Intent patterns, ordered — kwh MUST come before kw because "kwh"
// contains "kw". First match wins; subsequent matches are ignored.
const INTENT_PATTERNS: [RegExp, string][] = [
  [/\bkwh\b/i, 'battery-series'],
  [/\bkw\b/i, 'inverter-series'],
  [/\bbatter(?:y|ies)\b/i, 'battery-series'],
  [/\binverter(?:s)?\b/i, 'inverter-series'],
  [/\bc&i\b/i, 'commercial-industrial-series'],
  [/\bcommercial\b/i, 'commercial-industrial-series'],
  [/\bindustrial\b/i, 'commercial-industrial-series'],
  [/\ball[\s-]?in[\s-]?one\b/i, 'all-in-one-series'],
  [/\bvault\b/i, 'all-in-one-series'],
  [/\bportable\b/i, 'all-in-one-series'],
  [/\bpanel(?:s)?\b/i, 'solar-panel-series'],
  [/\bpv\b/i, 'solar-panel-series'],
  [/\baccessor(?:y|ies)\b/i, 'solar-accessories'],
  [/\bmount(?:ing|s)?\b/i, 'solar-accessories'],
  [/\bcable(?:s)?\b/i, 'solar-accessories'],
];

function detectIntent(rawQ: string): { core: string; seriesSlug: string | null } {
  let text = rawQ.toLowerCase();
  let seriesSlug: string | null = null;

  for (const [pattern, slug] of INTENT_PATTERNS) {
    const re = new RegExp(pattern.source, pattern.flags.includes('g') ? pattern.flags : pattern.flags + 'g');
    const before = text;
    text = text.replace(re, ' ');
    if (text !== before && seriesSlug === null) {
      seriesSlug = slug;
    }
  }

  // Drop decoy words so the text match stays tight.
  text = text.replace(/\b(series|product|products|the|a|an)\b/gi, ' ');
  text = text.replace(/\s+/g, ' ').trim();

  return { core: text, seriesSlug };
}

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !can(user.role, 'content.read')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const params = request.nextUrl.searchParams;
  if (!params.has('page')) {
    return NextResponse.json(
      await prisma.product.findMany({
        include: {
          category: true,
          specifications: { orderBy: { sortOrder: 'asc' } },
          media: { orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }] },
        },
        orderBy: [
          { category: { sortOrder: 'asc' } },
          { category: { name: 'asc' } },
          { sortOrder: 'asc' },
          { name: 'asc' },
        ],
      }),
    );
  }
  const parsed = z
    .object({
      q: z.string().trim().max(120).default(''),
      categoryId: z.string().max(100).default(''),
      state: z.enum(['PUBLISHED', 'DRAFT']).optional(),
      page: z.coerce.number().int().min(1).max(100000).default(1),
    })
    .safeParse(Object.fromEntries(params));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid product filters.' }, { status: 400 });
  }
  const { q, categoryId, state } = parsed.data;

  // --- Exact slug fast path: "litharv-5kw-inverter" style queries ---
  if (q && /^[a-z0-9]+(?:-[a-z0-9]+)+$/.test(q)) {
    const exact = await prisma.product.findUnique({
      where: { slug: q },
      include: {
        category: true,
        specifications: { orderBy: { sortOrder: 'asc' } },
        media: { orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }] },
      },
    });
    if (exact) {
      return NextResponse.json({
        items: [exact],
        total: 1,
        page: 1,
        pageSize: 1,
        pageCount: 1,
        matchedBySlug: true,
      });
    }
  }

  // --- Intent-aware fuzzy search ---
  const { core, seriesSlug } = q ? detectIntent(q) : { core: '', seriesSlug: null };

  const where: Record<string, unknown> = {};
  if (categoryId) where.categoryId = categoryId;
  if (state) where.published = state === 'PUBLISHED';
  if (seriesSlug) where.category = { slug: seriesSlug };
  if (core) {
    where.OR = [
      { name: { contains: core, mode: 'insensitive' } },
      { slug: { contains: core, mode: 'insensitive' } },
      { summary: { contains: core, mode: 'insensitive' } },
      { brand: { contains: core, mode: 'insensitive' } },
    ];
  } else if (q && !seriesSlug) {
    // No intent, no core after stripping — search the raw query as-is.
    where.OR = [
      { name: { contains: q, mode: 'insensitive' } },
      { slug: { contains: q, mode: 'insensitive' } },
      { summary: { contains: q, mode: 'insensitive' } },
      { brand: { contains: q, mode: 'insensitive' } },
    ];
  }

  const total = await prisma.product.count({ where });
  const pageSize = 20;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(parsed.data.page, pageCount);
  const items = await prisma.product.findMany({
    where,
    include: {
      category: true,
      specifications: { orderBy: { sortOrder: 'asc' } },
      media: { orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }] },
    },
    orderBy: [
      { category: { sortOrder: 'asc' } },
      { category: { name: 'asc' } },
      { sortOrder: 'asc' },
      { name: 'asc' },
    ],
    skip: (page - 1) * pageSize,
    take: pageSize,
  });

  return NextResponse.json({
    items,
    total,
    page,
    pageSize,
    pageCount,
    intent: seriesSlug,
  });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !can(user.role, 'content.manage')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!sameOrigin(request)) {
    return NextResponse.json({ error: 'Invalid origin' }, { status: 403 });
  }
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid product details.' }, { status: 400 });
  }
  if (parsed.data.categoryId) {
    const cat = await prisma.productCategory.findFirst({
      where: { id: parsed.data.categoryId, published: true },
    });
    if (!cat) {
      return NextResponse.json(
        { error: 'Choose a published product category.' },
        { status: 400 },
      );
    }
  }
  try {
    const product = await prisma.product.create({ data: parsed.data });
    await prisma.auditLog.create({
      data: {
        actorId: user.id,
        action: 'product.create',
        entityType: 'product',
        entityId: product.id,
      },
    });
    return NextResponse.json(product, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: 'A product with this slug may already exist.' },
      { status: 409 },
    );
  }
}