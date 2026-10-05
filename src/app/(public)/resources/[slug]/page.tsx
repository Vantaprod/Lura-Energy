import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db/prisma';
import type { Metadata } from 'next';
import { getServerT } from '@/lib/i18n/server';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  if (
    process.env.NODE_ENV === 'development' &&
    process.env.PREVIEW_WITHOUT_DATABASE === 'true'
  )
    return {};
  const { slug } = await params;
  const item = await prisma.resource.findFirst({
    where: { slug, published: true },
    select: { title: true, summary: true },
  });
  return item ? { title: item.title, description: item.summary ?? undefined } : {};
}

export default async function ResourcePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (
    process.env.NODE_ENV === 'development' &&
    process.env.PREVIEW_WITHOUT_DATABASE === 'true'
  )
    notFound();
  const item = await prisma.resource.findFirst({
    where: { slug, published: true },
  });
  if (!item) notFound();

  const { t } = await getServerT('front');

  return (
    <main>
      <section className="page-intro">
        <p className="eyebrow">{t('resources.detailEyebrow')}</p>
        <h1>{item.title}</h1>
        {item.summary && <p>{item.summary}</p>}
      </section>
      <article
        className="content-section"
        style={{ whiteSpace: 'pre-wrap', maxWidth: 980, margin: '0 auto' }}
      >
        {item.body}
      </article>
    </main>
  );
}