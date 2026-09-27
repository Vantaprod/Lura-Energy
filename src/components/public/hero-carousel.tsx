'use client';

import { useEffect, useState } from 'react';

export type HeroSlide = {
  url: string;
  alt: string;
};

type Props = {
  slides: HeroSlide[];
  /** Crossfade interval in milliseconds. */
  interval?: number;
};

export function HeroCarousel({ slides, interval = 6000 }: Props) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (slides.length < 2) return;
    const id = window.setInterval(
      () => setIndex((i) => (i + 1) % slides.length),
      interval,
    );
    return () => window.clearInterval(id);
  }, [slides.length, interval]);

  if (slides.length === 0) return null;

  return (
    <div className="hero-carousel" aria-hidden="true">
      {slides.map((slide, i) => (
        <div
          key={slide.url}
          className={`hero-slide ${i === index ? 'is-active' : ''}`}
        >
          <img src={slide.url} alt={slide.alt} />
        </div>
      ))}
      {slides.length > 1 && (
        <div className="hero-dots" role="tablist">
          {slides.map((slide, i) => (
            <button
              key={slide.url}
              type="button"
              className={`hero-dot ${i === index ? 'is-active' : ''}`}
              onClick={() => setIndex(i)}
              aria-label={`Show slide ${i + 1}`}
              aria-selected={i === index}
              role="tab"
            />
          ))}
        </div>
      )}
    </div>
  );
}