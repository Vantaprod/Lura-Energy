'use client';

import { useCallback, useRef, useState } from 'react';

export type ProductMedia = {
  id: string;
  url: string;
  alt: string | null;
  kind: 'IMAGE' | 'VIDEO' | 'DOCUMENT';
};

type Props = {
  productId: string | null;
  initial: ProductMedia[];
  onChanged?: (media: ProductMedia[]) => void;
};

const MAX_BYTES = 8 * 1024 * 1024;

export function MediaDropzone({ productId, initial, onChanged }: Props) {
  const [items, setItems] = useState<ProductMedia[]>(initial);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

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

      if (!productId) {
        setError('Save the draft first, then add images.');
        return;
      }

      setUploading(true);
      setError('');

      for (const file of list) {
        if (file.size > MAX_BYTES) {
          setError(file.name + ' is larger than 8 MB.');
          continue;
        }
        const form = new FormData();
        form.append('file', file);
        form.append('productId', productId);
        try {
          const res = await fetch('/api/admin/media/upload', {
            method: 'POST',
            body: form,
          });
          const data = await res.json();
          if (!res.ok) {
            setError(data.error ?? 'Upload failed.');
            continue;
          }
          push([...items, data as ProductMedia]);
        } catch {
          setError('Upload failed.');
        }
      }

      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    },
    [items, productId, push],
  );

  async function remove(item: ProductMedia) {
    if (!window.confirm('Remove this image?')) return;
    const res = await fetch('/api/admin/media/' + item.id, { method: 'DELETE' });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError((body as { error?: string }).error ?? 'Could not remove image.');
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

  const buttonDisabled = uploading || !productId;

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
                aria-label="Remove image"
              >
                ×
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
        <p className="dropzone__title">
          {uploading ? 'Uploading...' : dragging ? 'Drop to upload' : 'Drag & drop images here'}
        </p>

        <button
          type="button"
          style={buttonStyle}
          onClick={openPicker}
          disabled={buttonDisabled}
        >
          Choose files
        </button>

        <p className="dropzone__hint">
          JPG, PNG, WEBP, GIF, AVIF · up to 8 MB each
        </p>

        {!productId && (
          <p className="dropzone__hint" style={{ color: '#D96A0F', fontWeight: 600, marginTop: '6px' }}>
            Save the draft first, then return to this product to add images.
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

      {error && <p className="form-error" role="alert">{error}</p>}
    </div>
  );
}