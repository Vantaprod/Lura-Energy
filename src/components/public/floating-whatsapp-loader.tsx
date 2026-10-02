import { prisma } from '@/lib/db/prisma';
import { FloatingWhatsApp } from './floating-whatsapp';

async function getWhatsAppNumber(): Promise<string> {
  const previewMode =
    process.env.NODE_ENV === 'development' &&
    process.env.PREVIEW_WITHOUT_DATABASE === 'true';
  if (previewMode) return '';
  try {
    const row = await prisma.setting.findUnique({
      where: { key: 'contact.whatsapp' },
    });
    const value = row?.value;
    return typeof value === 'string' ? value : '';
  } catch {
    return '';
  }
}

export async function FloatingWhatsAppLoader() {
  const phone = await getWhatsAppNumber();
  return <FloatingWhatsApp phone={phone} />;
}