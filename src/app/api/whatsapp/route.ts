import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const row = await prisma.setting.findUnique({
      where: { key: 'contact.whatsapp' },
    });
    const value = row?.value;
    return NextResponse.json({
      phone: typeof value === 'string' ? value : '',
    });
  } catch {
    return NextResponse.json({ phone: '' });
  }
}