'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from '@/lib/i18n/context';

type MediaKind = 'IMAGE' | 'VIDEO' | 'DOCUMENT';

type MediaItem = {
  id: string;
  kind: MediaKind;
  url: string;
  alt: string | null;
  title: string | null;
  mimeType: string | null;
  sizeBytes: number | null;
  createdAt: string;
};

type Filter = 'ALL' | MediaKind;

const FILTERS: { key: Filter; labelKey: string }[] = [
  { key: 'ALL', labelKey: 'admin.mediaLib.filter.all' },
  { key: 'IMAGE', labelKey: 'admin.mediaLib.filter.images' },
  { key: 'VIDEO', labelKey: 'admin.mediaLib.filter.videos' },
  { key: 'DOCUMENT', labelKey: 'admin.mediaLib.filter.documents' },
];

function formatBytes(n: number | null): string {
  if (!n || n <= 0) return '';
  if (n < 1024) return n + ' B';
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB';
  return (n / 1024 / 1024).toFixed(1) + ' MB';
}

export function MediaLibrary() {
  const { t } = useTranslation();
  const [items, setItems] = useState<MediaItem[]>([]);
  const [filter, setFilter] = useState<Filter>('ALL');
  const [query, setQuery] = useState('');
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/media');
      const data = await res.json();
      setItems(data.items ?? []);
    } catch {
      setError(t('admin.mediaLib.error.load'));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const upload = useCallback(
    async (files: FileList | File[]) => {
      const list = Array.from(files);
      if (!list.length) return;
      setUploading(true);
      setError('');
      setMessage('');

      let succeeded = 0;
      let failed = 0;
      for (const file of list) {
        const form = new FormData();
        form.append('file', file);
        form.append('subfolder', 'library');
        try {
          const res = await fetch('/api/admin/media/upload', { method: 'POST', body: form });
          if (res.ok) succeeded++;
          else {
            const body = await res.json().catch(() => ({}));
            setError((body as { error?: string }).error ?? t('admin.mediaLib.error.oneFailed'));
            failed++;
          }
        } catch {
          failed++;
        }
      }

      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
      setMessage(
        `${succeeded} ${t('admin.mediaLib.status.uploaded')}${
          failed ? ' ' + failed + ' ' + t('admin.mediaLib.status.failed') : ''
        }`,
      );
      await load();
    },
    [load, t],
  );

  async function remove(item: MediaItem) {
    if (!window.confirm(t('admin.mediaLib.confirm.delete'))) return;
    const res = await fetch('/api/admin/media/' + item.id, { method: 'DELETE' });
    if (!res.ok) {
      setError(t('admin.mediaLib.error.delete'));
      return;
    }
    setItems((prev) => prev.filter((m) => m.id !== item.id));
  }

  async function copyUrl(url: string) {
    const absolute = typeof window !== 'undefined' ? window.location.origin + url : url;
    try {
      await navigator.clipboard.writeText(absolute);
      setMessage(t('admin.mediaLib.status.copied'));
      setTimeout(() => setMessage(''), 1800);
    } catch {
      setError(t('admin.mediaLib.error.copy'));
    }
  }

  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files?.length) void upload(e.dataTransfer.files);
  }

  const visible = items.filter((m) => {
    if (filter !== 'ALL' && m.kind !== filter) return false;
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      (m.alt ?? '').toLowerCase().includes(q) ||
      (m.title ?? '').toLowerCase().includes(q) ||
      m.url.toLowerCase().includes(q)
    );
  });

  const dropTitle = uploading
    ? t('admin.mediaLib.drop.titleUploading')
    : dragging
    ? t('admin.mediaLib.drop.titleDragging')
    : t('admin.mediaLib.drop.title');

  return (
    <div className="media-library">
      <div
        className={'dropzone' + (dragging ? ' is-dragging' : '')}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
      >
        <p className="dropzone__title">{dropTitle}</p>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: uploading ? '#B8BEC7' : '#F58220',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '4px',
            fontFamily: 'inherit',
            fontWeight: 700,
            fontSize: '14px',
            padding: '10px 22px',
            minHeight: '42px',
            cursor: uploading ? 'not-allowed' : 'pointer',
            margin: '12px 0 10px',
            lineHeight: 1.2,
          }}
        >
          {uploading ? t('admin.mediaLib.drop.titleUploading') : t('admin.mediaLib.drop.choose')}
        </button>
        <p className="dropzone__hint">{t('admin.mediaLib.drop.hint')}</p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,image/avif,video/mp4,video/webm,video/quicktime,application/pdf"
        multiple
        onChange={(e) => { if (e.target.files) void upload(e.target.files); }}
        style={{ display: 'none' }}
      />

      {(message || error) && (
        <p
          className={error ? 'form-error' : 'form-note'}
          role={error ? 'alert' : 'status'}
          style={{ margin: '12px 0' }}
        >
          {error || message}
        </p>
      )}

      <div className="media-library__toolbar">
        <div className="media-library__filters" role="tablist">
          {FILTERS.map((f) => {
            const active = filter === f.key;
            return (
              <button
                key={f.key}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setFilter(f.key)}
                style={{
                  backgroundColor: active ? '#1428A0' : '#FFFFFF',
                  border: '1px solid ' + (active ? '#1428A0' : '#E4E7EC'),
                  color: active ? '#FFFFFF' : '#2B3441',
                  fontFamily: 'inherit',
                  fontSize: '13px',
                  fontWeight: 600,
                  padding: '7px 16px',
                  borderRadius: '999px',
                  cursor: 'pointer',
                  lineHeight: 1.2,
                  transition: 'background 150ms ease, color 150ms ease',
                }}
              >
                {t(f.labelKey)}
              </button>
            );
          })}
        </div>
        <input
          type="search"
          className="media-library__search"
          placeholder={t('admin.mediaLib.search.placeholder')}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {visible.length === 0 ? (
        <div className="empty-panel" style={{ marginTop: '24px' }}>
          <strong>{t('admin.mediaLib.empty.title')}</strong>
          {t('admin.mediaLib.empty.body')}
        </div>
      ) : (
        <div className="media-library__grid">
          {visible.map((m) => (
            <div className="media-tile" key={m.id}>
              <div className="media-tile__preview">
                {m.kind === 'IMAGE' && (
                  <img src={m.url} alt={m.alt ?? ''} loading="lazy" />
                )}
                {m.kind === 'VIDEO' && (
                  <div className="media-tile__video">
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
                      <polygon points="6 4 20 12 6 20 6 4" fill="currentColor" />
                    </svg>
                    <span>{t('admin.mediaLib.filter.videos')}</span>
                  </div>
                )}
                {m.kind === 'DOCUMENT' && (
                  <div className="media-tile__doc">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                    </svg>
                    <span>PDF</span>
                  </div>
                )}
                <span className="media-tile__badge">{m.kind.toLowerCase()}</span>
              </div>
              <div className="media-tile__info">
                <p className="media-tile__name">
                  {m.alt || m.title || m.url.split('/').pop()}
                </p>
                <p className="media-tile__meta">{formatBytes(m.sizeBytes)}</p>
              </div>
              <div className="media-tile__actions">
                <button type="button" className="admin-action" onClick={() => void copyUrl(m.url)}>
                  {t('admin.mediaLib.action.copyUrl')}
                </button>
                <button
                  type="button"
                  className="admin-action admin-action--danger"
                  onClick={() => void remove(m)}
                >
                  {t('admin.mediaLib.action.delete')}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}