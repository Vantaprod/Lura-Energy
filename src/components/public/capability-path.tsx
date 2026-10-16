// ============================================================
// src/components/public/capability-path.tsx
//
// Capability Path — 4-step process section from the Lura proposal.
// Static English copy (not translated) to keep the i18n dictionary
// untouched. If translation is needed later, thread a `t` prop in.
// ============================================================

const STEPS = [
  {
    number: '01',
    title: 'Understand demand',
    body: 'Local demand, pricing and channel insight.',
  },
  {
    number: '02',
    title: 'Select relevant products',
    body: 'Portfolio integration across energy, storage and solar.',
  },
  {
    number: '03',
    title: 'Coordinate supply',
    body: 'Structured distribution and dependable logistics.',
  },
  {
    number: '04',
    title: 'Support channel partners',
    body: 'Long-term value across the supply chain.',
  },
] as const;

export function CapabilityPath() {
  return (
    <section className="capability-path" aria-labelledby="capability-path-heading">
      <div className="capability-path__inner">
        <header className="capability-path__head">
          <p className="capability-path__eyebrow">Capability path</p>
          <h2 id="capability-path-heading" className="capability-path__title">
            How we work
          </h2>
        </header>

        <ol className="capability-path__list">
          {STEPS.map((step) => (
            <li className="capability-step" key={step.number}>
              <span className="capability-step__number" aria-hidden="true">
                {step.number}
              </span>
              <div className="capability-step__content">
                <h3 className="capability-step__title">{step.title}</h3>
                <p className="capability-step__body">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}