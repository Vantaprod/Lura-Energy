'use client';

import { useState } from 'react';

export type Media = {
  id: string;
  url: string;
  alt: string | null;
  kind: string;
};

type Props = {
  items: Media[];
  emptyLabel?: string;
};

export function ProductGallery({ items, emptyLabel = 'No images available' }: Props) {
  const images = items.filter((m) => m.kind === 'IMAGE');
  const [index, setIndex] = useState(0);

  if (images.length === 0) {
    return (
      <div className="pdp-gallery__empty">
        {emptyLabel}
      </div>
    );
  }

  const current = images[index];

  return (
    <div className="pdp-gallery">
      <div className="pdp-gallery__stage">
        {images.map((img, i) => (
          <div
            key={img.id}
            className={`pdp-gallery__slide ${i === index ? 'is-active' : ''}`}
          >
            <img src={img.url} alt={img.alt || ''} />
          </div>
        ))}

        {images.length > 1 && (
          <>
            <button
              type="button"
              className="pdp-gallery__nav pdp-gallery__nav--prev"
              onClick={() => setIndex((i) => (i === 0 ? images.length - 1 : i - 1))}
              aria-label="Previous image"
            >
              ←
            </button>
            <button
              type="button"
              className="pdp-gallery__nav pdp-gallery__nav--next"
              onClick={() => setIndex((i) => (i === images.length - 1 ? 0 : i + 1))}
              aria-label="Next image"
            >
              →
            </button>
            <div className="pdp-gallery__dots">
              {images.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  className={`pdp-gallery__dot ${i === index ? 'is-active' : ''}`}
                  onClick={() => setIndex(i)}
                  aria-label={`Go to image ${i + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {images.length > 1 && (
        <div className="pdp-gallery__thumbs">
          {images.map((img, i) => (
            <button
              key={img.id}
              type="button"
              className={`pdp-gallery__thumb ${i === index ? 'is-active' : ''}`}
              onClick={() => setIndex(i)}
            >
              <img src={img.url} alt={img.alt || ''} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}