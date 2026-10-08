'use client';

import { useCallback, useRef, useState } from 'react';
import { useTranslation } from '@/lib/i18n/context';

export type ProductMedia = {
  id: string;
  url: string;
  alt: string | null;
  kind: 'IMAGE' | 'VIDEO' | 'DOCUMENT';
};

type Props = {
  productId?: string | null;
  projectId?: string | null;
  serviceId?: string | null;
  solutionId?: string | null;
  initial: ProductMedia[];
  onChanged?: (media: ProductMedia[]) => void;
};

const MAX_BYTES = 8 * 1024 * 1024;

export function MediaDropzone({
  productId,
  projectId,
  serviceId,
  solutionId,
  initial,
  onChanged,
}: Props) {
  const { t } = useTranslation();
  const [items, setItems] = useState<ProductMedia[]>(initial);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const linkedId = productId ?? projectId ?? serviceId ?? solutionId ?? null;

  const push = useCallback(
    (next: ProductMedia[]) => {
      setItems(next);
      onChanged?.(next);
    },
    [onChanged],
  );

  const upload = useCallback(
    async (files: FileList | File[]) => {
      const list = Array.from(files);
      if (!list.length) return;

      if (!linkedId) {
        setError(t('mediaDropzone.error.saveFirst'));
        return;
      }

      setUploading(true);
      setError('');
      const uploaded: ProductMedia[] = [];

      for (const file of list) {
        if (file.size > MAX_BYTES) {
          setError(
            t('mediaDropzone.error.tooLarge').replace('{name}', file.name),
          );
          continue;
        }
        const form = new FormData();
        form.append('file', file);
        if (productId) form.append('productId', productId);
        else if (projectId) form.append('projectId', projectId);
        else if (serviceId) form.append('serviceId', serviceId);
        else if (solutionId) form.append('solutionId', solutionId);
        try {
          const res = await fetch('/api/admin/media/upload', {
            method: 'POST',
            body: form,
          });
          const data = await res.json();
          if (!res.ok) {
            const serverError =
              (data as { errorKey?: string; error?: string }).errorKey
                ? t((data as { errorKey: string }).errorKey)
                : (data as { error?: string }).error ?? t('mediaDropzone.error.uploadFailed');
            setError(serverError);
            continue;
          }
          uploaded.push(data as ProductMedia);
        } catch {
          setError(t('mediaDropzone.error.uploadFailed'));
        }
      }

      if (uploaded.length) {
        push([...items, ...uploaded]);
      }

      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    },
    [items, productId, projectId, serviceId, solutionId, linkedId, push, t],
  );

  async function remove(item: ProductMedia) {
    if (!window.confirm(t('mediaDropzone.confirm.remove'))) return;
    const res = await fetch('/api/admin/media/' + item.id, { method: 'DELETE' });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      const serverError =
        (body as { errorKey?: string; error?: string }).errorKey
          ? t((body as { errorKey: string }).errorKey)
          : (body as { error?: string }).error ?? t('mediaDropzone.error.remove');
      setError(serverError);
      return;
    }
    push(items.filter((m) => m.id !== item.id));
    // Persist the new order too, so the DB matches what's shown.
    void persistOrder(items.filter((m) => m.id !== item.id));
  }

  async function persistOrder(next: ProductMedia[]) {
    try {
      await fetch('/api/admin/media/reorder', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: next.map((m) => m.id) }),
      });
    } catch {
      // Local UI already reflects the new order — silent failure is fine.
    }
  }

  function move(index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    push(next);
    void persistOrder(next);
  }

  function openPicker() {
    inputRef.current?.click();
  }

  function onDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    if (event.dataTransfer.files?.length) {
      void upload(event.dataTransfer.files);
    }
  }

  const buttonDisabled = uploading || !linkedId;

  const buttonStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: buttonDisabled ? '#B8BEC7' : '#F58220',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '4px',
    fontFamily: 'inherit',
    fontWeight: 700,
    fontSize: '14px',
    padding: '10px 22px',
    minHeight: '42px',
    cursor: buttonDisabled ? 'not-allowed' : 'pointer',
    margin: '12px 0 10px',
    lineHeight: 1.2,
  };

  const dropTitle = uploading
    ? t('mediaDropzone.drop.uploading')
    : dragging
    ? t('mediaDropzone.drop.dragging')
    : t('mediaDropzone.drop.title');

  return (
    <div className="media-block">
      {items.length > 0 && (
        <div className="media-thumbs">
          {items.map((item, i) => (
            <figure key={item.id} className="media-thumb">
              <img src={item.url} alt={item.alt ?? ''} />

              <button
                type="button"
                className="media-thumb__move media-thumb__move--prev"
                onClick={() => move(i, -1)}
                disabled={i === 0}
                aria-label={t('aria.moveImageBack')}
                title={t('aria.moveImageBack')}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>
              <button
                type="button"
                className="media-thumb__move media-thumb__move--next"
                onClick={() => move(i, 1)}
                disabled={i === items.length - 1}
                aria-label={t('aria.moveImageForward')}
                title={t('aria.moveImageForward')}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>

              <button
                type="button"
                className="media-thumb__remove"
                onClick={() => void remove(item)}
                aria-label={t('aria.removeImage')}
              >
                {'\u00D7'}
              </button>

              <span className="media-thumb__index">{i + 1}</span>
            </figure>
          ))}
        </div>
      )}

      <div
        className={'dropzone' + (dragging ? ' is-dragging' : '')}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
      >
        <p className="dropzone__title">{dropTitle}</p>

        <button
          type="button"
          style={buttonStyle}
          onClick={openPicker}
          disabled={buttonDisabled}
        >
          {t('mediaDropzone.choose')}
        </button>

        <p className="dropzone__hint">{t('mediaDropzone.hint')}</p>

        {!linkedId && (
          <p
            className="dropzone__hint"
            style={{ color: '#D96A0F', fontWeight: 600, marginTop: '6px' }}
          >
            {t('mediaDropzone.hint.saveFirst')}
          </p>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
        multiple
        onChange={(event) => {
          if (event.target.files) void upload(event.target.files);
        }}
        style={{ display: 'none' }}
      />

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}