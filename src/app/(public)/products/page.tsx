import { prisma } from '@/lib/db/prisma';
import { ContentIndex } from '@/components/public/content-index';
import { getServerT } from '@/lib/i18n/server';

export const dynamic = 'force-dynamic';

export default async function ProductsPage() {
  const isPreview =
    process.env.NODE_ENV === 'development' &&
    process.env.PREVIEW_WITHOUT_DATABASE === 'true';

  const [items, { t }] = await Promise.all([
    isPreview
      ? Promise.resolve([])
      : prisma.product.findMany({
          where: { published: true },
          include: { category: true, media: true },
          orderBy: { sortOrder: 'asc' },
        }),
    getServerT(),
  ]);

  return (
    <ContentIndex
      title={t('products.title')}
      eyebrow={t('products.eyebrow')}
      description={t('products.description')}
      items={items.map((item) => ({ ...item, category: item.category?.name ?? null }))}
      path="/products"
      viewLabel={t('cta.viewProduct')}
      emptyTitle={t('empty.productsTitle')}
      emptyBody={t('empty.productsBody')}
    />
  );
}