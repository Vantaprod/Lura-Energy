'use client';

import Link from 'next/link';
import { useTranslation } from '@/lib/i18n/context';

type Entry = {
  id: string;
  name?: string;
  title?: string;
  slug: string;
  summary?: string | null;
  description?: string | null;
  category?: string | null;
  location?: string | null;
  media?: { id: string; kind: 'IMAGE' | 'VIDEO' | 'DOCUMENT'; url: string; alt: string | null }[];
};

type Props = {
  title: string;
  eyebrow: string;
  description: string;
  items: Entry[];
  path: string;
  viewLabel?: string;
  emptyTitle?: string;
  emptyBody?: string;
};

export function ContentIndex({
  title,
  eyebrow,
  description,
  items,
  path,
  viewLabel,
  emptyTitle,
  emptyBody,
}: Props) {
  const { t } = useTranslation();
  const finalViewLabel = viewLabel ?? t('content.view');
  const finalEmptyTitle = emptyTitle ?? t('content.emptyTitle');
  const finalEmptyBody = emptyBody ?? t('content.emptyBody');

  return (
    <main>
      <section className="page-intro">
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p>{description}</p>
      </section>
      <section className="content-section">
        {items.length ? (
          <div className="grid">
            {items.map((item) => {
              const image = item.media?.find((m) => m.kind === 'IMAGE');
              return (
                <article className="record-card" key={item.id}>
                  <div>
                    {image && (
                      <img
                        className="record-image"
                        src={image.url}
                        alt={image.alt ?? ''}
                        loading="lazy"
                        width="900"
                        height="620"
                      />
                    )}
                    {(item.category || item.location) && (
                      <p className="eyebrow eyebrow-plain">{item.category ?? item.location}</p>
                    )}
                    <h3>{item.name ?? item.title}</h3>
                    {(item.summary || item.description) && (
                      <p>{item.summary ?? item.description}</p>
                    )}
                  </div>
                  <Link href={path + '/' + item.slug}>
                    {finalViewLabel} {'\u2192'}
                  </Link>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="empty-panel">
            <strong>{finalEmptyTitle}</strong>
            {finalEmptyBody}
          </div>
        )}
      </section>
    </main>
  );
}