import { Reveal } from '@/components/ui/reveal';

const STEPS = [
  { number: '01', title: 'Understand demand', body: 'Local demand, pricing and channel insight.' },
  { number: '02', title: 'Select relevant products', body: 'Portfolio integration across energy, storage and solar.' },
  { number: '03', title: 'Coordinate supply', body: 'Structured distribution and dependable logistics.' },
  { number: '04', title: 'Support channel partners', body: 'Long-term value across the supply chain.' },
];

export function CapabilityPath() {
  return (
    <section className="capability-path" aria-labelledby="capability-path-heading">
      <div className="capability-path__inner">
        <Reveal>
          <header className="capability-path__head">
            <p className="capability-path__eyebrow">Capability path</p>
            <h2 id="capability-path-heading" className="capability-path__title">
              How we work
            </h2>
          </header>
        </Reveal>

        <ol className="capability-path__list">
          {STEPS.map((step, index) => (
            <li className="capability-step" key={step.number}>
              <Reveal delay={index * 0.15} hover>
                <span className="capability-step__number" aria-hidden="true">
                  {step.number}
                </span>
                <div className="capability-step__content">
                  <h3 className="capability-step__title">{step.title}</h3>
                  <p className="capability-step__body">{step.body}</p>
                </div>
              </Reveal>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}