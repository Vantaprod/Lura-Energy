'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export type HeroSlide = {
  url: string;
  alt: string;
};

type Props = {
  slides: HeroSlide[];
  interval?: number;
};

export function HeroCarousel({ slides, interval = 6000 }: Props) {
  const [index, setIndex] = useState(0);
  const [hovering, setHovering] = useState(false);
  const timerRef = useRef<number | null>(null);

  const goTo = useCallback(
    (next: number) => {
      if (slides.length === 0) return;
      const wrapped = ((next % slides.length) + slides.length) % slides.length;
      setIndex(wrapped);
    },
    [slides.length],
  );

  const next = useCallback(() => goTo(index + 1), [goTo, index]);
  const prev = useCallback(() => goTo(index - 1), [goTo, index]);

  // Auto-advance. Restarts whenever index changes so manual navigation
  // doesn't fight the timer.
  useEffect(() => {
    if (slides.length < 2) return;
    if (timerRef.current) window.clearInterval(timerRef.current);
    timerRef.current = window.setInterval(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, interval);
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, [slides.length, interval, index]);

  // Keyboard arrows navigate the carousel when the section is focused.
  function onKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      next();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      prev();
    }
  }

  if (slides.length === 0) return null;

  return (
    <div
      className="hero-carousel hero-carousel--interactive"
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      onKeyDown={onKeyDown}
      tabIndex={-1}
    >
      {slides.map((slide, i) => (
        <div
          key={slide.url}
          className={'hero-slide' + (i === index ? ' is-active' : '')}
          aria-hidden={i !== index}
        >
          <img src={slide.url} alt={slide.alt} />
        </div>
      ))}

      {slides.length > 1 && (
        <>
          <button
            type="button"
            className={'hero-arrow hero-arrow--prev' + (hovering ? ' is-visible' : '')}
            onClick={prev}
            aria-label="Previous slide"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>

          <button
            type="button"
            className={'hero-arrow hero-arrow--next' + (hovering ? ' is-visible' : '')}
            onClick={next}
            aria-label="Next slide"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>

          <div className="hero-dots" role="tablist">
            {slides.map((slide, i) => (
              <button
                key={slide.url}
                type="button"
                role="tab"
                aria-label={'Show slide ' + (i + 1)}
                aria-selected={i === index}
                className={'hero-dot' + (i === index ? ' is-active' : '')}
                onClick={() => goTo(i)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}