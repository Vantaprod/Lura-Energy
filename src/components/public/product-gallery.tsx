'use client';

import { useCallback, useEffect, useState } from 'react';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { useTranslation } from '@/lib/i18n/context';

type Media = {
  id: string;
  url: string;
  alt: string;
  kind: 'IMAGE' | 'VIDEO' | 'DOCUMENT';
};

type Props = {
  items: Media[];
  emptyLabel: string;
};

const AUTOPLAY_MS = 4000;

export function ProductGallery({ items, emptyLabel }: Props) {
  const { t } = useTranslation();
  const images = items.filter((m) => m.kind === 'IMAGE');
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  // Reset slide when the product changes
  useEffect(() => {
    setIndex(0);
  }, [items]);

  const go = useCallback(
    (dir: 1 | -1) => {
      setIndex((i) => {
        const n = images.length;
        if (n === 0) return 0;
        return (i + dir + n) % n;
      });
    },
    [images.length],
  );

  // Autoplay, paused on hover or when only one image
  useEffect(() => {
    if (images.length < 2 || paused) return;
    const timer = window.setInterval(() => go(1), AUTOPLAY_MS);
    return () => window.clearInterval(timer);
  }, [images.length, paused, go]);

  if (images.length === 0) {
    return <div className="pdp-gallery__empty">{emptyLabel}</div>;
  }

  const multiple = images.length > 1;

  return (
    <div
      className="pdp-gallery"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="pdp-gallery__stage">
        {images.map((img, i) => (
          <div
            key={img.id}
            className={'pdp-gallery__slide' + (i === index ? ' is-active' : '')}
            aria-hidden={i !== index}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <OptimizedImage
              src={img.url}
              alt={img.alt}
              loading={i === 0 ? 'eager' : 'lazy'}
            />
          </div>
        ))}

        {multiple && (
          <>
            <button
              type="button"
              className="pdp-gallery__nav pdp-gallery__nav--prev"
              onClick={() => go(-1)}
              aria-label={t('aria.galleryPrev')}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <button
              type="button"
              className="pdp-gallery__nav pdp-gallery__nav--next"
              onClick={() => go(1)}
              aria-label={t('aria.galleryNext')}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>

            <div className="pdp-gallery__dots" role="tablist">
              {images.map((img, i) => (
                <button
                  key={img.id}
                  type="button"
                  role="tab"
                  aria-selected={i === index}
                  aria-label={`${i + 1} / ${images.length}`}
                  className={'pdp-gallery__dot' + (i === index ? ' is-active' : '')}
                  onClick={() => setIndex(i)}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {multiple && (
        <div className="pdp-gallery__thumbs">
          {images.map((img, i) => (
            <button
              key={img.id}
              type="button"
              className={'pdp-gallery__thumb' + (i === index ? ' is-active' : '')}
              onClick={() => setIndex(i)}
              aria-label={`Show image ${i + 1}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <OptimizedImage src={img.url} alt="" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
