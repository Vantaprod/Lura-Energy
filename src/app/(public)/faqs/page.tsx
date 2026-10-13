import { prisma } from '@/lib/db/prisma';
import { getServerT } from '@/lib/i18n/server';

export const revalidate = 300;

export default async function FaqPage() {
  const isPreview =
    process.env.NODE_ENV === 'development' &&
    process.env.PREVIEW_WITHOUT_DATABASE === 'true';

  const [items, { t }] = await Promise.all([
    isPreview
      ? Promise.resolve([])
      : prisma.fAQ.findMany({
          where: { published: true },
          orderBy: { sortOrder: 'asc' },
        }),
    getServerT(),
  ]);

  return (
    <main>
      <section className="page-intro">
        <p className="eyebrow">{t('faq.eyebrow')}</p>
        <h1>{t('faq.title')}</h1>
        <p>{t('faq.description')}</p>
      </section>
      <section className="content-section">
        {items.length ? (
          items.map((x) => (
            <details
              key={x.id}
              style={{ padding: '1.2rem 0', borderBottom: '1px solid var(--line)' }}
            >
              <summary style={{ fontWeight: 700, cursor: 'pointer' }}>{x.question}</summary>
              <p>{x.answer}</p>
            </details>
          ))
        ) : (
          <div className="empty-panel">
            <strong>{t('faq.emptyTitle')}</strong>
            {t('faq.emptyBody')}
          </div>
        )}
      </section>
    </main>
  );
}