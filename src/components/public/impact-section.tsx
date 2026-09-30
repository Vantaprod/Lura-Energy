'use client';

import CountUp from 'react-countup';
import { useInView } from 'react-intersection-observer';
import { HolographicGlobe } from '@/components/public/holographic-globe';

type Stat = {
  label: string;
  value: number;
  suffix: string;
};

const STATS: Stat[] = [
  { label: 'Operating Regions', value: 90, suffix: '+' },
  { label: 'Successful Projects', value: 5, suffix: '' },
  { label: 'Distribution Partners', value: 5000, suffix: '+' },
];

export function ImpactSection() {
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.25,
  });

  return (
    <section className="impact-section" ref={ref}>
      <div className="impact-section__inner">
        <div className="impact-section__text">
          <p className="impact-eyebrow">
            <span className="impact-eyebrow__bar" aria-hidden="true" />
            Our Impact
          </p>

          <h2 className="impact-heading">
            Powering <span className="impact-heading__accent">Possibility</span>
          </h2>

          <div className="impact-rule" aria-hidden="true" />

          <p className="impact-body">
            What started with a vision for more accessible and reliable energy is
            becoming a growing presence across Nigeria. Lura continues to expand
            through successful solar projects, strategic distributor partnerships,
            and an increasing operational footprint across key regions.
          </p>

          <p className="impact-body">
            Every project represents more than an installation &mdash; it represents
            a home, business, or organization gaining greater access to dependable
            energy.
          </p>

          <ul className="impact-tags" aria-label="Focus areas">
            <li>Operating Regions</li>
            <li>Successful Projects</li>
            <li>Distribution Partners</li>
            <li>Growing Energy Network</li>
          </ul>
        </div>

        <div className="impact-section__visual">
          <div className="impact-globe-wrap">
            <HolographicGlobe />
          </div>

          <ul className="impact-stats">
            {STATS.map((stat) => (
              <li className="impact-stat" key={stat.label}>
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