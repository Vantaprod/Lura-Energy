import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db/prisma';
import Link from 'next/link';
import { getServerT } from '@/lib/i18n/server';

export const dynamic = 'force-dynamic';

export default async function ServicePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (
    process.env.NODE_ENV === 'development' &&
    process.env.PREVIEW_WITHOUT_DATABASE === 'true'
  ) {
    notFound();
  }
  const [item, { t }] = await Promise.all([
    prisma.service.findFirst({ where: { slug, published: true } }),
    getServerT(),
  ]);
  if (!item) notFound();

  return (
    <main>
      <section className="page-intro">
        <p className="eyebrow">{t('detail.serviceEyebrow')}</p>
        <h1>{item.name}</h1>
        {item.summary && <p>{item.summary}</p>}
      </section>
      <section className="content-section">
        {item.description && <p>{item.description}</p>}
        <Link className="button" href="/contact">
          {t('detail.contactLura')} {'\u2192'}
        </Link>
      </section>
    </main>
  );
}