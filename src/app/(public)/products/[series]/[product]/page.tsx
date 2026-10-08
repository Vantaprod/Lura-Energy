import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { prisma } from '@/lib/db/prisma';
import { getServerT } from '@/lib/i18n/server';
import {
  ProductDetail,
  type FeatureBanner,
} from '@/components/public/product-detail';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ series: string; product: string }>;
}): Promise<Metadata> {
  const { product } = await params;
  const item = await prisma.product.findUnique({
    where: { slug: product },
    select: { seoTitle: true, seoDescription: true, name: true, summary: true },
  });
  if (!item) return {};
  return {
    title: item.seoTitle ?? item.name,
    description: item.seoDescription ?? item.summary ?? undefined,
  };
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ series: string; product: string }>;
}) {
  const { series, product } = await params;
  const { t } = await getServerT('front');

  const item = await prisma.product.findUnique({
    where: { slug: product, published: true },
    include: {
      category: true,
      media: { orderBy: { createdAt: 'asc' } },
      specifications: { orderBy: { sortOrder: 'asc' } },
    },
  });

  if (!item || !item.category || item.category.slug !== series) notFound();

  const keyFeatures: string[] = Array.isArray(item.keyFeatures)
    ? (item.keyFeatures as string[])
    : [];

  const featureBanners: FeatureBanner[] = Array.isArray(item.featureBanners)
    ? (item.featureBanners as FeatureBanner[]).filter(
        (b) => b && typeof b.url === 'string',
      )
    : [];

  const media = item.media.map((m) => ({
    id: m.id,
    url: m.url,
    alt: m.alt ?? item.name,
    kind: m.kind as 'IMAGE' | 'VIDEO' | 'DOCUMENT',
  }));

  return (
    <ProductDetail
      name={item.name}
      modelNumber={item.modelNumber}
      brand={item.brand}
      summary={item.summary}
      description={item.description}
      warranty={item.warranty}
      notice={item.notice}
      heroImageUrl={item.heroImageUrl}
      datasheetUrl={item.datasheetUrl}
      categorySlug={item.category.slug}
      categoryName={item.category.name}
      categorySummary={item.category.summary}
      keyFeatures={keyFeatures}
      specifications={item.specifications}
      media={media}
      featureBanners={featureBanners}
      t={t}
    />
  );
}