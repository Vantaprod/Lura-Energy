import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db/prisma';
import Link from 'next/link';
export const dynamic = 'force-dynamic';
export default async function SolutionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (process.env.NODE_ENV === 'development' && process.env.PREVIEW_WITHOUT_DATABASE === 'true') notFound();
  const item = await prisma.solution.findFirst({ where: { slug, published: true } });
  if (!item) notFound();
  return <main><section className="page-intro"><p className="eyebrow">Lura solution</p><h1>{item.name}</h1>{item.summary && <p>{item.summary}</p>}</section><section className="content-section">{item.description && <p>{item.description}</p>}<Link className="button" href="/contact">Discuss your requirements ↗</Link></section></main>;
}
