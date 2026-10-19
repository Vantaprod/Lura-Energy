import { NextRequest,NextResponse } from 'next/server';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/auth/session';
import { can } from '@/lib/permissions/policy';
import { sameOrigin } from '@/lib/security/origin';

const slug = z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const secureUrl = z
  .string()
  .refine((v) => v.startsWith('https://') || v.startsWith('/'), 'URL must be https:// or a site path.');

const collections = [
  'product-categories',
  'services',
  'solutions',
  'testimonials',
  'faqs',
  'resources',
  'media',
] as const;
type Collection = (typeof collections)[number];

const createSchema = z.discriminatedUnion('collection', [
  z.object({
    collection: z.literal('product-categories'),
    name: z.string().trim().min(1).max(140),
    slug,
    summary: z.string().max(500).optional(),
    description: z.string().max(4000).optional(),
    coverUrl: secureUrl.optional(),
    coverAlt: z.string().max(200).optional(),
    sortOrder: z.coerce.number().int().min(0).max(9999).optional(),
    translations: z.record(z.string(), z.record(z.string(), z.unknown())).nullable().optional(),
  }),
  z.object({
    collection: z.enum(['services', 'solutions']),
    name: z.string().trim().min(1).max(180),
    slug,
    summary: z.string().max(500).optional(),
    description: z.string().max(12000).optional(),
  }),
  z.object({
    collection: z.literal('testimonials'),
    name: z.string().trim().min(1).max(140),
    role: z.string().max(140).optional(),
    company: z.string().max(160).optional(),
    quote: z.string().trim().min(1).max(2500),
  }),
  z.object({
    collection: z.literal('faqs'),
    question: z.string().trim().min(1).max(300),
    answer: z.string().trim().min(1).max(5000),
  }),
  z.object({
    collection: z.literal('resources'),
    title: z.string().trim().min(1).max(180),
    slug,
    summary: z.string().max(500).optional(),
    body: z.string().max(20000).optional(),
  }),
  z.object({
    collection: z.literal('media'),
    kind: z.enum(['IMAGE', 'VIDEO', 'DOCUMENT']),
    url: secureUrl,
    title: z.string().max(180).optional(),
    alt: z.string().max(300).optional(),
    productId: z.string().nullable().optional(),
    projectId: z.string().nullable().optional(),
    serviceId: z.string().nullable().optional(),
    solutionId: z.string().nullable().optional(),
  }),
]);

const updateSchema = z.discriminatedUnion('collection', [
  z.object({
    collection: z.literal('product-categories'),
    id: z.string().min(1),
    name: z.string().trim().min(1).max(140).optional(),
    slug: slug.optional(),
    summary: z.string().max(500).optional(),
    description: z.string().max(4000).optional(),
    coverUrl: secureUrl.optional(),
    coverAlt: z.string().max(200).optional(),
    sortOrder: z.coerce.number().int().min(0).max(9999).optional(),
    published: z.boolean().optional(),
    translations: z.record(z.string(), z.record(z.string(), z.unknown())).nullable().optional(),
  }),
  z.object({
    collection: z.enum(['services', 'solutions']),
    id: z.string().min(1),
    name: z.string().trim().min(1).max(180).optional(),
    slug: slug.optional(),
    summary: z.string().max(500).optional(),
    description: z.string().max(12000).optional(),
    published: z.boolean().optional(),
  }),
  z.object({
    collection: z.literal('testimonials'),
    id: z.string().min(1),
    name: z.string().trim().min(1).max(140).optional(),
    role: z.string().max(140).optional(),
    company: z.string().max(160).optional(),
    quote: z.string().trim().min(1).max(2500).optional(),
    published: z.boolean().optional(),
  }),
  z.object({
    collection: z.literal('faqs'),
    id: z.string().min(1),
    question: z.string().trim().min(1).max(300).optional(),
    answer: z.string().trim().min(1).max(5000).optional(),
    published: z.boolean().optional(),
  }),
  z.object({
    collection: z.literal('resources'),
    id: z.string().min(1),
    title: z.string().trim().min(1).max(180).optional(),
    slug: slug.optional(),
    summary: z.string().max(500).optional(),
    body: z.string().max(20000).optional(),
    published: z.boolean().optional(),
  }),
  z.object({
    collection: z.literal('media'),
    id: z.string().min(1),
    kind: z.enum(['IMAGE', 'VIDEO', 'DOCUMENT']).optional(),
    url: secureUrl.optional(),
    title: z.string().max(180).optional(),
    alt: z.string().max(300).optional(),
    productId: z.string().nullable().optional(),
    projectId: z.string().nullable().optional(),
    serviceId: z.string().nullable().optional(),
    solutionId: z.string().nullable().optional(),
  }),
]);

async function list(collection: Collection): Promise<unknown> {
  switch (collection) {
    case 'product-categories':
      return prisma.productCategory.findMany({ orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }] });
    case 'services':
      return prisma.service.findMany({
        orderBy: { sortOrder: 'asc' },
        include: { media: { orderBy: { createdAt: 'asc' } } },
      });
    case 'solutions':
      return prisma.solution.findMany({
        orderBy: { sortOrder: 'asc' },
        include: { media: { orderBy: { createdAt: 'asc' } } },
      });
    case 'testimonials':
      return prisma.testimonial.findMany({ orderBy: { sortOrder: 'asc' } });
    case 'faqs':
      return prisma.fAQ.findMany({ orderBy: { sortOrder: 'asc' } });
    case 'resources':
      return prisma.resource.findMany({ orderBy: { createdAt: 'desc' } });
    case 'media':
      return prisma.media.findMany({ orderBy: { createdAt: 'desc' } });
  }
}

async function ensureSingleMediaLink(input: {
  productId?: string | null;
  projectId?: string | null;
  serviceId?: string | null;
  solutionId?: string | null;
}): Promise<string | null> {
  const set = [input.productId, input.projectId, input.serviceId, input.solutionId].filter(
    (v): v is string => typeof v === 'string' && v.length > 0,
  );
  if (set.length > 1) return 'Link media to one record at a time.';
  if (input.productId) {
    const exists = await prisma.product.findUnique({
      where: { id: input.productId },
      select: { id: true },
    });
    if (!exists) return 'Product record not found.';
  }
  if (input.projectId) {
    const exists = await prisma.project.findUnique({
      where: { id: input.projectId },
      select: { id: true },
    });
    if (!exists) return 'Project record not found.';
  }
  if (input.serviceId) {
    const exists = await prisma.service.findUnique({
      where: { id: input.serviceId },
      select: { id: true },
    });
    if (!exists) return 'Service record not found.';
  }
  if (input.solutionId) {
    const exists = await prisma.solution.findUnique({
      where: { id: input.solutionId },
      select: { id: true },
    });
    if (!exists) return 'Solution record not found.';
  }
  return null;
}

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !can(user.role, 'content.read')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const params = request.nextUrl.searchParams;
  const collection = params.get('collection');
  if (!collections.includes(collection as Collection)) {
    return NextResponse.json({ error: 'Unknown content type.' }, { status: 400 });
  }
  if (collection === 'resources') {
    const parsed = z
      .object({
        q: z.string().trim().max(120).default(''),
        state: z.enum(['PUBLISHED', 'DRAFT']).optional(),
        page: z.coerce.number().int().min(1).max(100000).default(1),
      })
      .safeParse(Object.fromEntries(params));
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid resource filters.' }, { status: 400 });
    }
    const { q, state } = parsed.data;
    const where = {
      ...(state ? { published: state === 'PUBLISHED' } : {}),
      ...(q
        ? {
            OR: [
              { title: { contains: q, mode: 'insensitive' as const } },
              { slug: { contains: q, mode: 'insensitive' as const } },
              { summary: { contains: q, mode: 'insensitive' as const } },
              { body: { contains: q, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };
    const total = await prisma.resource.count({ where });
    const pageSize = 20;
    const pageCount = Math.max(1, Math.ceil(total / pageSize));
    const page = Math.min(parsed.data.page, pageCount);
    const items = await prisma.resource.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
    return NextResponse.json({ items, total, page, pageSize, pageCount });
  }
  return NextResponse.json(await list(collection as Collection));
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !can(user.role, 'content.manage')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!sameOrigin(request)) {
    return NextResponse.json({ error: 'Invalid origin' }, { status: 403 });
  }
  const parsed = createSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Review the content fields and try again.' },
      { status: 400 },
    );
  }
  const input = parsed.data;
  if (input.collection === 'media') {
    const linkError = await ensureSingleMediaLink(input);
    if (linkError) {
      return NextResponse.json({ error: linkError }, { status: 400 });
    }
  }
  try {
    let record: unknown;
    switch (input.collection) {
      case 'product-categories':
        record = await prisma.productCategory.create({
          data: {
            name: input.name,
            slug: input.slug,
            summary: input.summary,
            description: input.description,
            coverUrl: input.coverUrl,
            coverAlt: input.coverAlt,
            sortOrder: input.sortOrder ?? 0,
            translations: (input.translations ?? undefined) as Prisma.InputJsonValue | undefined,
          },
        });
        break;
      case 'services':
        record = await prisma.service.create({
          data: {
            name: input.name,
            slug: input.slug,
            summary: input.summary,
            description: input.description,
          },
        });
        break;
      case 'solutions':
        record = await prisma.solution.create({
          data: {
            name: input.name,
            slug: input.slug,
            summary: input.summary,
            description: input.description,
          },
        });
        break;
      case 'testimonials':
        record = await prisma.testimonial.create({
          data: {
            name: input.name,
            role: input.role,
            company: input.company,
            quote: input.quote,
          },
        });
        break;
      case 'faqs':
        record = await prisma.fAQ.create({
          data: { question: input.question, answer: input.answer },
        });
        break;
      case 'resources':
        record = await prisma.resource.create({
          data: {
            title: input.title,
            slug: input.slug,
            summary: input.summary,
            body: input.body,
          },
        });
        break;
      case 'media':
        record = await prisma.media.create({
          data: {
            kind: input.kind,
            url: input.url,
            title: input.title,
            alt: input.alt,
            productId: input.productId ?? null,
            projectId: input.projectId ?? null,
            serviceId: input.serviceId ?? null,
            solutionId: input.solutionId ?? null,
          },
        });
        break;
    }
    const id =
      record && typeof record === 'object' && 'id' in record ? String(record.id) : null;
    await prisma.auditLog.create({
      data: {
        actorId: user.id,
        action: input.collection + '.create',
        entityType: input.collection,
        entityId: id,
      },
    });
    return NextResponse.json(record, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: 'Could not save the record. Check for a duplicate URL slug.' },
      { status: 409 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !can(user.role, 'content.manage')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!sameOrigin(request)) {
    return NextResponse.json({ error: 'Invalid origin' }, { status: 403 });
  }
  const parsed = updateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Review the update fields and try again.' },
      { status: 400 },
    );
  }
  const input = parsed.data;
  if (input.collection === 'media') {
    const linkError = await ensureSingleMediaLink(input);
    if (linkError) {
      return NextResponse.json({ error: linkError }, { status: 400 });
    }
  }
  try {
    switch (input.collection) {
      case 'product-categories':
        await prisma.productCategory.update({
          where: { id: input.id },
          data: {
            name: input.name,
            slug: input.slug,
            summary: input.summary,
            description: input.description,
            coverUrl: input.coverUrl,
            coverAlt: input.coverAlt,
            sortOrder: input.sortOrder,
            published: input.published,
            translations: (input.translations ?? undefined) as Prisma.InputJsonValue | undefined,
          },
        });
        break;
      case 'services':
        await prisma.service.update({
          where: { id: input.id },
          data: {
            name: input.name,
            slug: input.slug,
            summary: input.summary,
            description: input.description,
            published: input.published,
          },
        });
        break;
      case 'solutions':
        await prisma.solution.update({
          where: { id: input.id },
          data: {
            name: input.name,
            slug: input.slug,
            summary: input.summary,
            description: input.description,
            published: input.published,
          },
        });
        break;
      case 'testimonials':
        await prisma.testimonial.update({
          where: { id: input.id },
          data: {
            name: input.name,
            role: input.role,
            company: input.company,
            quote: input.quote,
            published: input.published,
          },
        });
        break;
      case 'faqs':
        await prisma.fAQ.update({
          where: { id: input.id },
          data: {
            question: input.question,
            answer: input.answer,
            published: input.published,
          },
        });
        break;
      case 'resources':
        await prisma.resource.update({
          where: { id: input.id },
          data: {
            title: input.title,
            slug: input.slug,
            summary: input.summary,
            body: input.body,
            published: input.published,
            ...(input.published === undefined
              ? {}
              : { publishedAt: input.published ? new Date() : null }),
          },
        });
        break;
      case 'media':
        await prisma.media.update({
          where: { id: input.id },
          data: {
            kind: input.kind,
            url: input.url,
            title: input.title,
            alt: input.alt,
            productId: input.productId ?? null,
            projectId: input.projectId ?? null,
            serviceId: input.serviceId ?? null,
            solutionId: input.solutionId ?? null,
          },
        });
        break;
    }
    await prisma.auditLog.create({
      data: {
        actorId: user.id,
        action: input.collection + '.update',
        entityType: input.collection,
        entityId: input.id,
      },
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Record could not be updated.' }, { status: 404 });
  }
}

export async function DELETE(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !can(user.role, 'content.manage')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!sameOrigin(request)) {
    return NextResponse.json({ error: 'Invalid origin' }, { status: 403 });
  }
  const parsed = z
    .object({ collection: z.enum(collections), id: z.string().min(1) })
    .safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid delete request.' }, { status: 400 });
  }
  const { collection, id } = parsed.data;
  try {
    switch (collection) {
      case 'product-categories':
        await prisma.productCategory.delete({ where: { id } });
        break;
      case 'services':
        await prisma.service.delete({ where: { id } });
        break;
      case 'solutions':
        await prisma.solution.delete({ where: { id } });
        break;
      case 'testimonials':
        await prisma.testimonial.delete({ where: { id } });
        break;
      case 'faqs':
        await prisma.fAQ.delete({ where: { id } });
        break;
      case 'resources':
        await prisma.resource.delete({ where: { id } });
        break;
      case 'media':
        await prisma.media.delete({ where: { id } });
        break;
    }
    await prisma.auditLog.create({
      data: {
        actorId: user.id,
        action: collection + '.delete',
        entityType: collection,
        entityId: id,
      },
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Record not found.' }, { status: 404 });
  }
}
