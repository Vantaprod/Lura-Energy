'use client';

import { useRef, useState } from 'react';
import { useTranslation } from '@/lib/i18n/context';

type Props = {
  value: string;
  onChange: (url: string) => void;
};

const MAX_BYTES = 8 * 1024 * 1024;

export function HeroImageDropzone({ value, onChange }: Props) {
  const { t } = useTranslation();
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  async function upload(file: File) {
    if (file.size > MAX_BYTES) {
      setError(t('mediaDropzone.error.tooLarge').replace('{name}', file.name));
      return;
    }
    setUploading(true);
    setError('');
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('subfolder', 'products-hero');
      const res = await fetch('/api/admin/media/upload', {
        method: 'POST',
        body: form,
      });
      const data = await res.json();
      if (!res.ok) {
        setError(
          (data as { error?: string }).error ??
            t('mediaDropzone.error.uploadFailed'),
        );
        return;
      }
      onChange((data as { url: string }).url);
    } catch {
      setError(t('mediaDropzone.error.uploadFailed'));
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) void upload(f);
  }

  return (
    <div>
      {value ? (
        <div className="hero-drop__preview">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="" />
          <button
            type="button"
            className="hero-drop__remove"
            onClick={() => onChange('')}
            aria-label={t('aria.removeImage')}
          >
            {'\u00D7'}
          </button>
        </div>
      ) : (
        <div
          className={'hero-drop' + (dragging ? ' is-dragging' : '')}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click();
          }}
          role="button"
          tabIndex={0}
        >
          <div className="hero-drop__icon" aria-hidden="true">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
          </div>
          <p className="hero-drop__title">
            {uploading
              ? t('mediaDropzone.drop.uploading')
              : dragging
                ? t('mediaDropzone.drop.dragging')
                : t('mediaDropzone.drop.title')}
          </p>
          <p className="hero-drop__hint">{t('mediaDropzone.hint')}</p>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
        style={{ display: 'none' }}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void upload(f);
        }}
      />

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}