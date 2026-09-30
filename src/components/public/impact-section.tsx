'use client';

import CountUp from 'react-countup';
import { useInView } from 'react-intersection-observer';
import { HolographicGlobe } from '@/components/public/holographic-globe';

export type ImpactStat = {
  label: string;
  value: number;
  suffix: string;
};

export type ImpactContent = {
  eyebrow: string;
  headingWhite: string;
  headingAccent: string;
  body1: string;
  body2: string;
  ctaLabel: string;
  ctaHref: string;
  stats: ImpactStat[];
};

export const DEFAULT_IMPACT: ImpactContent = {
  eyebrow: 'Our Impact',
  headingWhite: 'Powering',
  headingAccent: 'Possibility',
  body1:
    'What started with a vision for more accessible and reliable energy is becoming a growing presence across Nigeria. Lura continues to expand through successful solar projects, strategic distributor partnerships, and an increasing operational footprint across key regions.',
  body2:
    'Every project represents more than an installation — it represents a home, business, or organization gaining greater access to dependable energy.',
  ctaLabel: 'Learn more',
  ctaHref: '/projects',
  stats: [
    { label: 'Operating Regions in Nigeria', value: 90, suffix: '+' },
    { label: 'Successful Projects', value: 5, suffix: '' },
    { label: 'Distribution Partners', value: 5000, suffix: '+' },
  ],
};

export function ImpactSection({ content }: { content?: Partial<ImpactContent> }) {
  const data: ImpactContent = {
    ...DEFAULT_IMPACT,
    ...content,
    stats: content?.stats && content.stats.length ? content.stats : DEFAULT_IMPACT.stats,
  };

  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.2,
  });

  return (
    <section className="impact-section" ref={ref}>
      <div className="impact-section__globe" aria-hidden="true">
        <HolographicGlobe className="impact-globe-canvas" />
      </div>

      <div className="impact-section__inner">
        <div className="impact-section__text">
          <p className="impact-eyebrow">
            <span className="impact-eyebrow__bar" aria-hidden="true" />
            {data.eyebrow}
          </p>

          <h2 className="impact-heading">
            {data.headingWhite}{' '}
            <span className="impact-heading__accent">{data.headingAccent}</span>
          </h2>

          <div className="impact-rule" aria-hidden="true" />

          <p className="impact-body">{data.body1}</p>
          <p className="impact-body">{data.body2}</p>

          <a className="impact-cta" href={data.ctaHref}>
            {data.ctaLabel}
            <span aria-hidden="true">{'\u2192'}</span>
          </a>
        </div>

        <div className="impact-section__stats">
          <ul className="impact-stats">
            {data.stats.map((stat, index) => (
              <li className="impact-stat" key={index}>
                <span className="impact-stat__label">{stat.label}</span>
                <span className="impact-stat__value">
                  {inView ? (
                    <CountUp
                      end={stat.value}
                      duration={4}
                      separator=","
                      suffix={stat.suffix}
                    />
                  ) : (
                    <span aria-hidden="true">0{stat.suffix}</span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}