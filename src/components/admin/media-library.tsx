'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from '@/lib/i18n/context';
import { MediaPreviewModal, type PreviewItem } from '@/components/admin/media-preview-modal';

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
  const [sort, setSort] = useState<SortKey>('newest');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
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

  async function removeFromModal(item: PreviewItem) {
    if (!window.confirm(t('admin.mediaLib.confirm.delete'))) return;
    const res = await fetch('/api/admin/media/' + item.id, { method: 'DELETE' });
    if (!res.ok) {
      setError(t('admin.mediaLib.error.delete'));
      return;
    }
    setSelected((prev) => {
      const next = new Set(prev);
      next.delete(item.id);
      return next;
    });
    setItems((prev) => {
      const next = prev.filter((m) => m.id !== item.id);
      if (next.length === 0) setPreviewIndex(null);
      else
        setPreviewIndex((i) =>
          i === null ? null : Math.min(i, Math.max(0, next.length - 1)),
        );
      return next;
    });
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

  const counts = useMemo(() => {
    const c: Record<Filter, number> = { ALL: items.length, IMAGE: 0, VIDEO: 0, DOCUMENT: 0 };
    for (const m of items) c[m.kind] += 1;
    return c;
  }, [items]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((m) => {
      if (filter !== 'ALL' && m.kind !== filter) return false;
      if (!q) return true;
      return (
        (m.alt ?? '').toLowerCase().includes(q) ||
        (m.title ?? '').toLowerCase().includes(q) ||
        m.url.toLowerCase().includes(q)
      );
    });
  }, [items, filter, query]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    arr.sort((a, b) => {
      switch (sort) {
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'nameAsc':
          return itemName(a).localeCompare(itemName(b));
        case 'nameDesc':
          return itemName(b).localeCompare(itemName(a));
        case 'largest':
          return (b.sizeBytes ?? 0) - (a.sizeBytes ?? 0);
        case 'smallest':
          return (a.sizeBytes ?? 0) - (b.sizeBytes ?? 0);
        default:
          return 0;
      }
    });
    return arr;
  }, [filtered, sort]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const paginated = useMemo(
    () => sorted.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
    [sorted, safePage],
  );

  useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);

  useEffect(() => {
    setPage(1);
  }, [filter, query, sort]);

  // Close the preview when the visible page changes so the modal
  // doesn't hold an index that no longer maps to a visible item.
  useEffect(() => {
    setPreviewIndex(null);
  }, [paginated]);

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const allOnPageSelected =
    paginated.length > 0 && paginated.every((m) => selected.has(m.id));

  function toggleSelectAllOnPage() {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allOnPageSelected) {
        for (const m of paginated) next.delete(m.id);
      } else {
        for (const m of paginated) next.add(m.id);
      }
      return next;
    });
  }

  function clearSelection() {
    setSelected(new Set());
  }

  async function deleteSelected() {
    const count = selected.size;
    if (count === 0) return;
    if (
      !window.confirm(
        fill(t('admin.mediaLib.bulk.confirm.deleteSelected'), { n: count }),
      )
    )
      return;

    setBulkDeleting(true);
    setError('');
    setMessage('');

    let succeeded = 0;
    let failed = 0;
    for (const id of Array.from(selected)) {
      try {
        const res = await fetch('/api/admin/media/' + id, { method: 'DELETE' });
        if (res.ok) succeeded++;
        else failed++;
      } catch {
        failed++;
      }
    }

    setSelected(new Set());
    setBulkDeleting(false);
    setMessage(
      `${succeeded} ${t('admin.mediaLib.bulk.deleted')}${
        failed ? ' ' + failed + ' ' + t('admin.mediaLib.status.failed') : ''
      }`,
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
          {paginated.map((m, idx) => {
            const isSelected = selected.has(m.id);
            return (
              <div
                className={'media-tile' + (isSelected ? ' is-selected' : '')}
                key={m.id}
                style={
                  isSelected
                    ? { borderColor: '#1428A0', boxShadow: '0 0 0 2px #1428A0' }
                    : undefined
                }
              >
                <div
                  className="media-tile__preview"
                  onClick={() => setPreviewIndex(idx)}
                  style={{ cursor: 'zoom-in' }}
                >
                  <label
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      position: 'absolute',
                      top: '8px',
                      left: '8px',
                      width: '22px',
                      height: '22px',
                      borderRadius: '4px',
                      background: isSelected ? '#1428A0' : 'rgba(255,255,255,0.92)',
                      border: '1px solid ' + (isSelected ? '#1428A0' : '#C9D0D9'),
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      zIndex: 2,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelect(m.id)}
                      style={{ display: 'none' }}
                    />
                    {isSelected && (
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#FFFFFF"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </label>

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
                <div
                  className="media-tile__actions"
                  onClick={(e) => e.stopPropagation()}
                >
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

      {pageCount > 1 && (
        <nav
          className="pagination"
          aria-label="Media pages"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            marginTop: '24px',
          }}
        >
          <button
            type="button"
            className="admin-action"
            disabled={safePage <= 1 || bulkDeleting}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            {t('admin.mediaLib.pagination.previous')}
          </button>
          <span className="form-note">
            {fill(t('admin.mediaLib.pagination.pageOf'), {
              page: safePage,
              count: pageCount,
            })}
          </span>
          <button
            type="button"
            className="admin-action"
            disabled={safePage >= pageCount || bulkDeleting}
            onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
          >
            {t('admin.mediaLib.pagination.next')}
          </button>
        </nav>
      )}

      {previewIndex !== null && paginated[previewIndex] && (
        <MediaPreviewModal
          items={paginated}
          index={previewIndex}
          onClose={() => setPreviewIndex(null)}
          onNavigate={setPreviewIndex}
          onDelete={(item) => void removeFromModal(item)}
        />
      )}
    </div>
  );
}
