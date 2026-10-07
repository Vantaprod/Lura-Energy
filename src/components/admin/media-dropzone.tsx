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
          push([...items, data as ProductMedia]);
        } catch {
          setError(t('mediaDropzone.error.uploadFailed'));
        }
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
          {items.map((item) => (
            <figure key={item.id} className="media-thumb">
              <img src={item.url} alt={item.alt ?? ''} />
              <button
                type="button"
                className="media-thumb__remove"
                onClick={() => void remove(item)}
                aria-label={t('aria.removeImage')}
              >
                {'\u00D7'}
              </button>
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