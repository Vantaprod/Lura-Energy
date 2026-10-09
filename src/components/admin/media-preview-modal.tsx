'use client';

import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from '@/lib/i18n/context';

type MediaKind = 'IMAGE' | 'VIDEO' | 'DOCUMENT';

export type PreviewItem = {
  id: string;
  kind: MediaKind;
  url: string;
  alt: string | null;
  title: string | null;
  mimeType: string | null;
  sizeBytes: number | null;
  createdAt: string;
};

type Props = {
  items: PreviewItem[];
  index: number;
  onClose: () => void;
  onNavigate: (nextIndex: number) => void;
  onDelete: (item: PreviewItem) => void;
};

function formatBytes(n: number | null): string {
  if (!n || n <= 0) return '—';
  if (n < 1024) return n + ' B';
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB';
  return (n / 1024 / 1024).toFixed(2) + ' MB';
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
}

export function MediaPreviewModal({
  items,
  index,
  onClose,
  onNavigate,
  onDelete,
}: Props) {
  const { t } = useTranslation();
  const item = items[index];
  const [copied, setCopied] = useState(false);

  const goPrev = useCallback(() => {
    if (index > 0) onNavigate(index - 1);
  }, [index, onNavigate]);

  const goNext = useCallback(() => {
    if (index < items.length - 1) onNavigate(index + 1);
  }, [index, items.length, onNavigate]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowLeft') goPrev();
      else if (e.key === 'ArrowRight') goNext();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose, goPrev, goNext]);

  // Reset copied status when the item changes
  useEffect(() => {
    setCopied(false);
  }, [item?.id]);

  if (!item) return null;

  async function copyUrl() {
    const absolute =
      typeof window !== 'undefined'
        ? window.location.origin + item.url
        : item.url;
    try {
      await navigator.clipboard.writeText(absolute);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Silently ignore; the user can still select the URL from the input.
    }
  }

  const displayName = item.alt || item.title || item.url.split('/').pop() || '';

  return (
    <div
      className="media-modal"
      role="dialog"
      aria-modal="true"
      aria-label={displayName}
      onClick={(e) => {
        // Click outside the panel closes the modal.
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <button
        type="button"
        className="media-modal__close"
        onClick={onClose}
        aria-label={t('mediaPreview.close')}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>

      {index > 0 && (
        <button
          type="button"
          className="media-modal__nav media-modal__nav--prev"
          onClick={goPrev}
          aria-label={t('mediaPreview.prev')}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
      )}

      {index < items.length - 1 && (
        <button
          type="button"
          className="media-modal__nav media-modal__nav--next"
          onClick={goNext}
          aria-label={t('mediaPreview.next')}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      )}

      <div className="media-modal__inner" onClick={(e) => e.stopPropagation()}>
        <div className="media-modal__stage">
          {item.kind === 'IMAGE' && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={item.url} alt={item.alt ?? ''} />
          )}
          {item.kind === 'VIDEO' && (
            <video controls preload="metadata" aria-label={item.title ?? ''}>
              <source src={item.url} />
            </video>
          )}
          {item.kind === 'DOCUMENT' && (
            <div className="media-modal__doc">
              <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
              <p>{t('mediaPreview.documentHint')}</p>
              <a
                href={item.url}
                target="_blank"
                rel="noreferrer"
                className="media-modal__open-link"
              >
                {t('mediaPreview.openDocument')}
              </a>
            </div>
          )}
        </div>

        <aside className="media-modal__sidebar">
          <p className="media-modal__kind">
            {t(`admin.mediaLib.filter.${item.kind.toLowerCase() as 'images' | 'videos' | 'documents'}`) || item.kind}
          </p>
          <h2 className="media-modal__name" title={displayName}>
            {displayName}
          </h2>

          <dl className="media-modal__meta">
            <div>
              <dt>{t('mediaPreview.size')}</dt>
              <dd>{formatBytes(item.sizeBytes)}</dd>
            </div>
            <div>
              <dt>{t('mediaPreview.type')}</dt>
              <dd>{item.mimeType ?? '—'}</dd>
            </div>
            <div>
              <dt>{t('mediaPreview.added')}</dt>
              <dd>{formatDate(item.createdAt)}</dd>
            </div>
          </dl>

          <div className="media-modal__url">
            <label htmlFor="media-modal-url">{t('mediaPreview.url')}</label>
            <input
              id="media-modal-url"
              type="text"
              readOnly
              value={
                typeof window !== 'undefined'
                  ? window.location.origin + item.url
                  : item.url
              }
              onFocus={(e) => e.currentTarget.select()}
            />
          </div>

          <div className="media-modal__actions">
            <button
              type="button"
              className="button"
              onClick={() => void copyUrl()}
            >
              {copied ? t('mediaPreview.copied') : t('mediaPreview.copyUrl')}
            </button>
            <a
              href={item.url}
              download
              className="admin-action"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              {t('mediaPreview.download')}
            </a>
            <button
              type="button"
              className="admin-action admin-action--danger"
              onClick={() => onDelete(item)}
            >
              {t('mediaPreview.delete')}
            </button>
          </div>

          {items.length > 1 && (
            <p className="media-modal__counter">
              {index + 1} / {items.length}
            </p>
          )}
        </aside>
      </div>
    </div>
  );
}