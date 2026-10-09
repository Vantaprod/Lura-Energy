import type { MetadataRoute } from 'next';
import { prisma } from '@/lib/db/prisma';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://luraenergy.com';

export const revalidate = 3600; // regenerate hourly

const STATIC_PAGES: { path: string; priority: number; freq: MetadataRoute.Sitemap[number]['changeFrequency'] }[] = [
  { path: '/', priority: 1.0, freq: 'weekly' },
  { path: '/products', priority: 0.9, freq: 'weekly' },
  { path: '/solutions', priority: 0.8, freq: 'weekly' },
  { path: '/services', priority: 0.8, freq: 'weekly' },
  { path: '/projects', priority: 0.8, freq: 'weekly' },
  { path: '/resources', priority: 0.7, freq: 'weekly' },
  { path: '/service-centres', priority: 0.7, freq: 'weekly' },
  { path: '/about', priority: 0.6, freq: 'monthly' },
  { path: '/contact', priority: 0.6, freq: 'monthly' },
  { path: '/quote', priority: 0.7, freq: 'monthly' },
  { path: '/faqs', priority: 0.5, freq: 'monthly' },
  { path: '/privacy', priority: 0.3, freq: 'yearly' },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticEntries: MetadataRoute.Sitemap = STATIC_PAGES.map((p) => ({
    url: `${SITE_URL}${p.path}`,
    changeFrequency: p.freq,
    priority: p.priority,
  }));

  const isPreview =
    process.env.NODE_ENV === 'development' &&
    process.env.PREVIEW_WITHOUT_DATABASE === 'true';
  if (isPreview) return staticEntries;

  const [categories, products, projects, services, solutions, resources] =
    await Promise.all([
      prisma.productCategory.findMany({
        where: { published: true },
        select: { slug: true, updatedAt: true },
      }),
      prisma.product.findMany({
        where: { published: true, category: { published: true } },
        select: {
          slug: true,
          updatedAt: true,
          category: { select: { slug: true } },
        },
      }),
      prisma.project.findMany({
        where: { published: true },
        select: { slug: true, updatedAt: true },
      }),
      prisma.service.findMany({
        where: { published: true },
        select: { slug: true, updatedAt: true },
      }),
      prisma.solution.findMany({
        where: { published: true },
        select: { slug: true, updatedAt: true },
      }),
      prisma.resource.findMany({
        where: { published: true },
        select: { slug: true, updatedAt: true },
      }),
    ]);

  return [
    ...staticEntries,
    ...categories.map((c) => ({
      url: `${SITE_URL}/products/${c.slug}`,
      lastModified: c.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
    ...products
      .filter((p) => p.category)
      .map((p) => ({
        url: `${SITE_URL}/products/${p.category!.slug}/${p.slug}`,
        lastModified: p.updatedAt,
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      })),
    ...projects.map((p) => ({
      url: `${SITE_URL}/projects/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    })),
    ...services.map((s) => ({
      url: `${SITE_URL}/services/${s.slug}`,
      lastModified: s.updatedAt,
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    })),
    ...solutions.map((s) => ({
      url: `${SITE_URL}/solutions/${s.slug}`,
      lastModified: s.updatedAt,
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    })),
    ...resources.map((r) => ({
      url: `${SITE_URL}/resources/${r.slug}`,
      lastModified: r.updatedAt,
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    })),
  ];
}