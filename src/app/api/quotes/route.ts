import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db/prisma';
import { sameOrigin } from '@/lib/security/origin';

const quoteItemSchema = z.object({
  productId: z.string().min(1).max(100),
  productName: z.string().min(1).max(300),
  categoryName: z.string().min(1).max(120),
  quantity: z.number().int().min(1).max(9999),
  notes: z.string().max(500).optional(),
});

const schema = z.object({
  name: z.string().trim().min(1).max(160),
  email: z.string().trim().email().max(200),
  phone: z.string().trim().min(6).max(40),
  location: z.string().trim().max(200).optional(),
  intent: z.enum(['install', 'purchase', 'both']).default('install'),
  message: z.string().trim().max(4000).optional(),
  quoteItems: z.array(quoteItemSchema).max(50).optional(),
  consent: z.literal(true),
});

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) {
    return NextResponse.json({ error: 'Invalid origin' }, { status: 403 });
  }

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Please complete the required fields.' }, { status: 400 });
  }

  const data = parsed.data;

  const productNames = (data.quoteItems ?? [])
    .map((item) => item.productName + ' x' + item.quantity)
    .join(', ');

  try {
    const lead = await prisma.lead.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        location: data.location,
        message: data.message ?? '',
        intent: data.intent,
        quoteItems: data.quoteItems ?? [],
        interestedProduct: productNames || null,
        consent: true,
        status: 'NEW',
      },
    });

    return NextResponse.json({ ok: true, id: lead.id }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Could not save your request. Please try again.' }, { status: 500 });
  }
}