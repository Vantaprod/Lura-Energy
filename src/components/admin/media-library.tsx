'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

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

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'ALL', label: 'All' },
  { key: 'IMAGE', label: 'Images' },
  { key: 'VIDEO', label: 'Videos' },
  { key: 'DOCUMENT', label: 'Documents' },
];

function formatBytes(n: number | null): string {
  if (!n || n <= 0) return '';
  if (n < 1024) return n + ' B';
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB';
  return (n / 1024 / 1024).toFixed(1) + ' MB';
}

export function MediaLibrary() {
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
      setError('Could not load media.');
    }
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
            setError((body as { error?: string }).error ?? 'One file failed.');
            failed++;
          }
        } catch {
          failed++;
        }
      }

      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
      setMessage(succeeded + ' uploaded.' + (failed ? ' ' + failed + ' failed.' : ''));
      await load();
    },
    [load],
  );

  async function remove(item: MediaItem) {
    if (!window.confirm('Delete this file permanently?')) return;
    const res = await fetch('/api/admin/media/' + item.id, { method: 'DELETE' });
    if (!res.ok) {
      setError('Could not delete file.');
      return;
    }
    setItems((prev) => prev.filter((m) => m.id !== item.id));
  }

  async function copyUrl(url: string) {
    const absolute = typeof window !== 'undefined' ? window.location.origin + url : url;
    try {
      await navigator.clipboard.writeText(absolute);
      setMessage('URL copied.');
      setTimeout(() => setMessage(''), 1800);
    } catch {
      setError('Could not copy.');
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

  return (
    <div className="media-library">
      <div
        className={'dropzone' + (dragging ? ' is-dragging' : '')}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
      >
        <p className="dropzone__title">
          {uploading ? 'Uploading...' : dragging ? 'Drop files to upload' : 'Drag & drop files here'}
        </p>
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
          {uploading ? 'Uploading...' : 'Choose files'}
        </button>
        <p className="dropzone__hint">
          Images (8 MB) Â· Videos MP4/WEBM/MOV (100 MB) Â· PDF (25 MB)
        </p>
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
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              role="tab"
              aria-selected={filter === f.key}
              className={'media-chip' + (filter === f.key ? ' is-active' : '')}
              onClick={() => setFilter(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>
        <input
          type="search"
          className="media-library__search"
          placeholder="Search by name..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {visible.length === 0 ? (
        <div className="empty-panel" style={{ marginTop: '24px' }}>
          <strong>No files yet</strong>
          Upload images, videos, or documents above. They will appear here and can
          be reused across the site.
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
                    <span>Video</span>
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
                  Copy URL
                </button>
                <button
                  type="button"
                  className="admin-action admin-action--danger"
                  onClick={() => void remove(m)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}