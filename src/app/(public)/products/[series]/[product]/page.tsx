import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { prisma } from '@/lib/db/prisma';
import { getServerT } from '@/lib/i18n/server';
import {
  ProductDetail,
  type FeatureBanner,
} from '@/components/public/product-detail';
import { JsonLd } from '@/components/public/json-ld';
import { productSchema, breadcrumbSchema } from '@/lib/seo/schemas';
import { tField, tArray } from '@/lib/i18n/resolve';

export const dynamic = 'force-dynamic';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://luraenergy.com';

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
  const { lang, t } = await getServerT('front');

  const item = await prisma.product.findUnique({
    where: { slug: product, published: true },
    include: {
      category: true,
      media: { orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }] },
      specifications: { orderBy: { sortOrder: 'asc' } },
    },
  });

  if (!item || !item.category || item.category.slug !== series) notFound();

  // ---- Resolve every user-visible string through the translator ----

  const resolvedName = tField<string>(
    item.translations as Record<string, Record<string, unknown>> | null,
    lang,
    'name',
    item.name,
  );

  const resolvedSummary = tField<string | null>(
    item.translations as Record<string, Record<string, unknown>> | null,
    lang,
    'summary',
    item.summary,
  );

  const resolvedDescription = tField<string | null>(
    item.translations as Record<string, Record<string, unknown>> | null,
    lang,
    'description',
    item.description,
  );

  const resolvedNotice = tField<string | null>(
    item.translations as Record<string, Record<string, unknown>> | null,
    lang,
    'notice',
    item.notice,
  );

  const resolvedWarranty = tField<string | null>(
    item.translations as Record<string, Record<string, unknown>> | null,
    lang,
    'warranty',
    item.warranty,
  );

  const rawFeatures: string[] = Array.isArray(item.keyFeatures)
    ? (item.keyFeatures as string[])
    : [];
  const resolvedFeatures = tArray(
    item.translations as Record<string, Record<string, unknown>> | null,
    lang,
    'keyFeatures',
    rawFeatures,
  );

  const resolvedCategoryName = tField<string>(
    item.category.translations as Record<string, Record<string, unknown>> | null,
    lang,
    'name',
    item.category.name,
  );

  const resolvedCategorySummary = tField<string | null>(
    item.category.translations as Record<string, Record<string, unknown>> | null,
    lang,
    'summary',
    item.category.summary,
  );

  // Spec labels: translate per-spec, fall back to English
  const resolvedSpecs = item.specifications.map((s) => ({
    id: s.id,
    label: tField<string>(
      s.translations as Record<string, Record<string, unknown>> | null,
      lang,
      'label',
      s.label,
    ),
    value: s.value,
    unit: s.unit,
    group: s.group,
  }));

  const featureBanners: FeatureBanner[] = Array.isArray(item.featureBanners)
    ? (item.featureBanners as FeatureBanner[]).filter(
        (b) => b && typeof b.url === 'string',
      )
    : [];

  const media = item.media.map((m) => ({
    id: m.id,
    url: m.url,
    alt: m.alt ?? resolvedName,
    kind: m.kind as 'IMAGE' | 'VIDEO' | 'DOCUMENT',
  }));

  const productUrl = `${SITE_URL}/products/${item.category.slug}/${item.slug}`;
  const galleryImages = media
    .filter((m) => m.kind === 'IMAGE')
    .map((m) => m.url);
  const heroOrFirst = item.heroImageUrl ?? galleryImages[0];
  const imagesForSchema = [
    ...(heroOrFirst ? [heroOrFirst] : []),
    ...galleryImages.filter((url) => url !== heroOrFirst),
  ];

  return (
    <>
      <JsonLd
        data={productSchema({
          name: resolvedName,
          description: resolvedSummary ?? resolvedDescription ?? null,
          sku: item.modelNumber,
          brand: item.brand,
          category: resolvedCategoryName,
          images: imagesForSchema,
          url: productUrl,
        })}
      />
      <JsonLd
        data={breadcrumbSchema([
          { name: t('nav.products'), url: '/products' },
          {
            name: resolvedCategoryName,
            url: `/products/${item.category.slug}`,
          },
          {
            name: resolvedName,
            url: `/products/${item.category.slug}/${item.slug}`,
          },
        ])}
      />
      <ProductDetail
        name={resolvedName}
        modelNumber={item.modelNumber}
        brand={item.brand}
        summary={resolvedSummary}
        description={resolvedDescription}
        warranty={resolvedWarranty}
        notice={resolvedNotice}
        heroImageUrl={item.heroImageUrl}
        datasheetUrl={item.datasheetUrl}
        categorySlug={item.category.slug}
        categoryName={resolvedCategoryName}
        categorySummary={resolvedCategorySummary}
        keyFeatures={resolvedFeatures}
        specifications={resolvedSpecs}
        media={media}
        featureBanners={featureBanners}
        t={t}
      />
    </>
  );
}