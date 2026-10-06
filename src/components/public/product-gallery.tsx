'use client';

import { useState } from 'react';

type Item = {
  id: string;
  url: string;
  alt: string;
  kind: string;
};

export function ProductGallery({
  items,
  emptyLabel,
}: {
  items: Item[];
  emptyLabel: string;
}) {
  const [active, setActive] = useState(0);

  if (items.length === 0) {
    return (
      <div className="product-gallery__main">
        <span className="model-card__placeholder">{emptyLabel}</span>
      </div>
    );
  }

  const current = items[active];

  return (
    <div className="product-gallery">
      {items.length > 1 && (
        <div className="product-gallery__thumbs">
          {items.map((item, i) => (
            <button
              key={item.id}
              type="button"
              className={
                'product-gallery__thumb' + (i === active ? ' is-active' : '')
              }
              onClick={() => setActive(i)}
              aria-label={`Image ${i + 1}`}
              aria-current={i === active}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.url} alt="" />
            </button>
          ))}
        </div>
      )}

      <div className="product-gallery__main">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={current.url} alt={current.alt} />
      </div>
    </div>
  );
}