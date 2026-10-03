import { prisma } from '@/lib/db/prisma';
import { getServerT } from '@/lib/i18n/server';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Privacy' };

export default async function PrivacyPage() {
  const isPreview =
    process.env.NODE_ENV === 'development' &&
    process.env.PREVIEW_WITHOUT_DATABASE === 'true';

  const [row, { t }] = await Promise.all([
    isPreview
      ? Promise.resolve(null)
      : prisma.setting.findUnique({ where: { key: 'legal.privacyNotice' } }),
    getServerT(),
  ]);

  const text = typeof row?.value === 'string' ? row.value : '';

  return (
    <main>
      <section className="page-intro">
        <p className="eyebrow">{t('privacy.eyebrow')}</p>
        <h1>{t('privacy.title')}</h1>
        <p>{t('privacy.description')}</p>
      </section>
      <article
        className="content-section"
        style={{ whiteSpace: 'pre-wrap', maxWidth: 900, margin: '0 auto' }}
      >
        {text || (
          <div className="empty-panel">
            <strong>{t('privacy.emptyTitle')}</strong>
            {t('privacy.emptyBody')}
          </div>
        )}
      </article>
    </main>
  );
}