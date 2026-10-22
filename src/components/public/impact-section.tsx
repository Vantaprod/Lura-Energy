'use client';

import CountUp from 'react-countup';
import { useInView } from 'react-intersection-observer';
import dynamic from 'next/dynamic';
import { useTranslation } from '@/lib/i18n/context';
import { Reveal } from '@/components/ui/reveal';

const HolographicGlobe = dynamic(
  () => import('@/components/public/holographic-globe').then((m) => m.HolographicGlobe),
  { ssr: false, loading: () => null },
);

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
    'What started with a vision for more accessible and reliable energy is becoming a growing presence across Nigeria. Lura continues to expand through successful solar projects, strategic installer partnerships, and an increasing operational footprint across key regions.',
  body2:
    'Every project represents more than an installation \u2014 it represents a home, business, or organization gaining greater access to dependable energy.',
  ctaLabel: 'Learn more',
  ctaHref: '/projects',
  stats: [
    { label: 'PV installed', value: 30, suffix: '+ MW' },
    { label: 'Energy storage', value: 20, suffix: '+ MWh' },
    { label: 'C&I projects', value: 30, suffix: '+' },
    { label: 'Operating Regions in Nigeria', value: 90, suffix: '+' },
  ],
};

export function ImpactSection({ content }: { content?: Partial<ImpactContent> }) {
  const { t } = useTranslation();

  const translatedDefaults: ImpactContent = {
    eyebrow: t('impact.eyebrow'),
    headingWhite: t('impact.headingWhite'),
    headingAccent: t('impact.headingAccent'),
    body1: t('impact.body1'),
    body2: t('impact.body2'),
    ctaLabel: t('impact.ctaLabel'),
    ctaHref: '/projects',
    stats: [
      { label: 'PV installed', value: 30, suffix: '+ MW' },
      { label: 'Energy storage', value: 20, suffix: '+ MWh' },
      { label: 'C&I projects', value: 30, suffix: '+' },
      { label: 'Operating Regions in Nigeria', value: 90, suffix: '+' },
    ],
  };

  const data: ImpactContent = {
    ...translatedDefaults,
    ...content,
    stats:
      content?.stats && content.stats.length
        ? content.stats
        : translatedDefaults.stats,
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
        <Reveal direction="right">
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
        </Reveal>

        <Reveal direction="left" delay={0.2}>
          <div className="impact-section__stats">
            <ul className="impact-stats impact-stats--grid">
              {data.stats.map((stat, index) => (
                <li className="impact-stat" key={index}>
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
                  <span className="impact-stat__label">{stat.label}</span>
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      </div>
    </section>
  );
}