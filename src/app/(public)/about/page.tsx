import { prisma } from '@/lib/db/prisma';
import { getServerT } from '@/lib/i18n/server';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'About' };

export default async function AboutPage() {
  const isPreview =
    process.env.NODE_ENV === 'development' &&
    process.env.PREVIEW_WITHOUT_DATABASE === 'true';

  const [row, { t }] = await Promise.all([
    isPreview
      ? Promise.resolve(null)
      : prisma.setting.findUnique({ where: { key: 'company.intro' } }),
    getServerT(),
  ]);

  const intro = typeof row?.value === 'string' ? row.value : '';

  return (
    <main>
      <section className="page-intro">
        <p className="eyebrow">{t('about.eyebrow')}</p>
        <h1>{t('about.heading')}</h1>
        <p>{t('about.intro')}</p>
      </section>
      <section className="content-section">
        {intro ? (
          <article className="editorial">
            <p className="lead">{intro}</p>
          </article>
        ) : (
          <div className="empty-panel">
            <strong>{t('about.emptyTitle')}</strong>
            {t('about.emptyBody')}
          </div>
        )}
      </section>
    </main>
  );
}