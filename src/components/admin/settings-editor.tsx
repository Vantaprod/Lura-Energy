'use client';

import { useEffect, useState } from 'react';

type HeroImage = { url: string; alt: string };
type MediaFile = { url: string; name: string };

const IMPACT_FIELDS: [string, string, string][] = [
  ['impact.eyebrow', 'Eyebrow label', 'Small orange text above the heading.'],
  ['impact.headingWhite', 'Heading (white part)', 'The first part of the heading.'],
  ['impact.headingAccent', 'Heading (orange part)', 'The second part, shown in orange.'],
  ['impact.body1', 'Body paragraph 1', 'First description paragraph.'],
  ['impact.body2', 'Body paragraph 2', 'Second description paragraph.'],
  ['impact.ctaLabel', 'CTA label', 'Text on the pill button, e.g. "Learn more".'],
  ['impact.ctaHref', 'CTA link', 'Where the button points.'],
  ['impact.stat1Label', 'Stat 1 label', 'Text shown next to the first number.'],
  ['impact.stat1Value', 'Stat 1 value', 'Digits only, e.g. 90.'],
  ['impact.stat1Suffix', 'Stat 1 suffix', 'Text after the number, e.g. +'],
  ['impact.stat2Label', 'Stat 2 label', 'Text shown next to the second number.'],
  ['impact.stat2Value', 'Stat 2 value', 'Digits only, e.g. 5.'],
  ['impact.stat2Suffix', 'Stat 2 suffix', 'Text after the number.'],
  ['impact.stat3Label', 'Stat 3 label', 'Text shown next to the third number.'],
  ['impact.stat3Value', 'Stat 3 value', 'Digits only, e.g. 5000.'],
  ['impact.stat3Suffix', 'Stat 3 suffix', 'Text after the number, e.g. +'],
];

const TEXT_FIELDS: [string, string, string][] = [
  ['home.ctaTitle', 'Closing CTA title', 'Big text in the final call-to-action band.'],
  ['home.ctaBody', 'Closing CTA body', 'Optional sentence in the final call-to-action.'],
  ['company.intro', 'Company introduction', 'Approved company description.'],
  ['contact.email', 'Public email', 'Official Lura contact email.'],
  ['contact.phone', 'Public phone', 'Official Lura phone number.'],
  ['contact.whatsapp', 'WhatsApp number', 'International format, digits only.'],
  ['legal.privacyNotice', 'Privacy notice', 'Approved legal notice. Legal review recommended.'],
];

export function SettingsEditor() {
  const [values, setValues] = useState<Record<string, string>>({});
  const [heroImages, setHeroImages] = useState<HeroImage[]>([]);
  const [media, setMedia] = useState<MediaFile[]>([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void Promise.all([
      fetch('/api/admin/settings').then((r) => r.json()),
      fetch('/api/admin/media').then((r) => r.json()).catch(() => ({ images: [] })),
    ])
      .then(([settings, mediaRes]: [Record<string, string>, { images: MediaFile[] }]) => {
        setValues(settings);
        setMedia(mediaRes.images ?? []);

        const raw = settings['home.heroImages'] ?? '';
        if (raw.trim()) {
          try {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
              setHeroImages(
                parsed
                  .filter((x) => x && typeof x === 'object' && typeof x.url === 'string')
                  .map((x) => ({ url: String(x.url), alt: String(x.alt ?? '') })),
              );
            }
          } catch {
            setHeroImages([]);
          }
        }
      })
      .finally(() => setLoading(false));
  }, []);

  function addSlide() {
    setHeroImages((prev) => [...prev, { url: '', alt: '' }]);
  }

  function updateSlide(index: number, patch: Partial<HeroImage>) {
    setHeroImages((prev) =>
      prev.map((slide, i) => (i === index ? { ...slide, ...patch } : slide)),
    );
  }

  function removeSlide(index: number) {
    setHeroImages((prev) => prev.filter((_, i) => i !== index));
  }

  function moveSlide(index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= heroImages.length) return;
    setHeroImages((prev) => {
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage('Saving...');

    const payload: Record<string, string> = { ...values };
    const cleanSlides = heroImages
      .filter((slide) => slide.url.trim().length > 0)
      .map((slide) => ({ url: slide.url.trim(), alt: slide.alt.trim() }));
    payload['home.heroImages'] = cleanSlides.length ? JSON.stringify(cleanSlides) : '';

    const res = await fetch('/api/admin/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      setMessage('Settings saved.');
    } else {
      const body = await res.json().catch(() => ({}));
      setMessage((body as { error?: string }).error ?? 'Save failed.');
    }
  }

  if (loading) {
    return <p className="form-note">Loading settings...</p>;
  }

  return (
    <form onSubmit={save}>
      <section style={{ marginBottom: '3rem' }}>
        <h2 style={{ marginBottom: '0.5rem' }}>Hero slides</h2>
        <p className="form-note" style={{ marginBottom: '1.5rem' }}>
          Images that cycle on the homepage hero. Leave empty to fall back to
          whatever is in public/hero/.
        </p>

        {heroImages.length === 0 && (
          <div className="empty-panel" style={{ marginBottom: '1rem' }}>
            <strong>No slides yet</strong>
            Add one below, or drop files into public/hero/ and leave this empty.
          </div>
        )}

        {heroImages.map((slide, index) => (
          <div
            key={index}
            className="field"
            style={{
              margin: '1rem 0',
              padding: '1rem',
              border: '1px solid var(--line)',
              borderRadius: 'var(--radius)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '0.5rem',
              }}
            >
              <strong>Slide {index + 1}</strong>
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                <button type="button" className="admin-action" onClick={() => moveSlide(index, -1)} disabled={index === 0}>Up</button>
                <button type="button" className="admin-action" onClick={() => moveSlide(index, 1)} disabled={index === heroImages.length - 1}>Down</button>
                <button type="button" className="admin-action" onClick={() => removeSlide(index)}>Remove</button>
              </div>
            </div>

            <label htmlFor={'hero-url-' + index}>Image</label>
            <select
              id={'hero-url-' + index}
              value={media.some((m) => m.url === slide.url) ? slide.url : ''}
              onChange={(e) => {
                if (e.target.value) updateSlide(index, { url: e.target.value });
              }}
              style={{ marginBottom: '0.5rem' }}
            >
              <option value="">-- pick from public/hero/ --</option>
              {media.map((m) => (
                <option key={m.url} value={m.url}>{m.name}</option>
              ))}
            </select>
            <input
              type="text"
              value={slide.url}
              onChange={(e) => updateSlide(index, { url: e.target.value })}
              placeholder="or paste a URL"
            />

            <label htmlFor={'hero-alt-' + index} style={{ marginTop: '0.75rem' }}>Alt text</label>
            <input
              id={'hero-alt-' + index}
              type="text"
              value={slide.alt}
              onChange={(e) => updateSlide(index, { alt: e.target.value })}
              maxLength={200}
            />
          </div>
        ))}

        <button type="button" className="admin-action" onClick={addSlide}>Add slide</button>
      </section>

      <section style={{ marginBottom: '3rem' }}>
        <h2 style={{ marginBottom: '0.5rem' }}>Our Impact section</h2>
        <p className="form-note" style={{ marginBottom: '1.5rem' }}>
          Text and numbers for the homepage Impact band. Numbers animate up from zero when the section scrolls into view.
        </p>
        {IMPACT_FIELDS.map(([key, label, hint]) => (
          <div className="field" key={key} style={{ margin: '1.25rem 0' }}>
            <label htmlFor={key}>{label}</label>
            <textarea
              id={key}
              value={values[key] ?? ''}
              onChange={(e) => setValues({ ...values, [key]: e.target.value })}
              maxLength={20000}
              style={{
                minHeight: key === 'impact.body1' || key === 'impact.body2' ? 120 : 52,
              }}
            />
            <span className="form-note">{hint}</span>
          </div>
        ))}
      </section>

      <section style={{ marginBottom: '3rem' }}>
        <h2 style={{ marginBottom: '0.5rem' }}>Page content</h2>
        {TEXT_FIELDS.map(([key, label, hint]) => (
          <div className="field" key={key} style={{ margin: '1.25rem 0' }}>
            <label htmlFor={key}>{label}</label>
            <textarea
              id={key}
              value={values[key] ?? ''}
              onChange={(e) => setValues({ ...values, [key]: e.target.value })}
              maxLength={20000}
              style={{
                minHeight:
                  key === 'company.intro' || key === 'legal.privacyNotice' || key === 'home.ctaBody'
                    ? 120
                    : 52,
              }}
            />
            <span className="form-note">{hint}</span>
          </div>
        ))}
      </section>

      <button className="button" type="submit">Save site settings</button>
      <p role="status" className="form-note" style={{ marginTop: '0.75rem' }}>{message}</p>
    </form>
  );
}