import type { Metadata } from 'next';
import { QuoteForm } from '@/components/public/quote-form';
import { getServerT } from '@/lib/i18n/server';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getServerT('front');
  return { title: t('contact.page.metaTitle') };
}

export default async function ContactPage({
  searchParams,
}: {
  searchParams: Promise<{ product?: string }>;
}) {
  const params = await searchParams;
  const { t } = await getServerT('front');
  const isPreview =
    process.env.NODE_ENV === 'development' &&
    process.env.PREVIEW_WITHOUT_DATABASE === 'true';

  return (
    <main>
      <section className="page-intro">
        <p className="eyebrow">{t('contact.eyebrow')}</p>
        <h1>{t('contact.heading')}</h1>
        <p>{t('contact.intro')}</p>
      </section>
      <section className="section form-layout">
        <div>
          <p className="eyebrow">{t('contact.requestEyebrow')}</p>
          <h2>{t('contact.requestHeading')}</h2>
          <p className="form-note">{t('contact.requestNote')}</p>
        </div>
        {isPreview ? (
          <div className="empty-panel">
            <strong>{t('contact.previewTitle')}</strong>
            {t('contact.previewBody')}
          </div>
        ) : (
          <QuoteForm initialProduct={params.product ?? ''} />
        )}
      </section>
    </main>
  );
}