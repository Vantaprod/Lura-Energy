'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from '@/lib/i18n/context';

type HeroImage = { url: string; alt: string; mobileUrl: string };
type MediaFile = { url: string; name: string };

const IMPACT_FIELDS: [string, string, string][] = [
  ['impact.eyebrow', 'admin.settings.field.impact.eyebrow.label', 'admin.settings.field.impact.eyebrow.hint'],
  ['impact.headingWhite', 'admin.settings.field.impact.headingWhite.label', 'admin.settings.field.impact.headingWhite.hint'],
  ['impact.headingAccent', 'admin.settings.field.impact.headingAccent.label', 'admin.settings.field.impact.headingAccent.hint'],
  ['impact.body1', 'admin.settings.field.impact.body1.label', 'admin.settings.field.impact.body1.hint'],
  ['impact.body2', 'admin.settings.field.impact.body2.label', 'admin.settings.field.impact.body2.hint'],
  ['impact.ctaLabel', 'admin.settings.field.impact.ctaLabel.label', 'admin.settings.field.impact.ctaLabel.hint'],
  ['impact.ctaHref', 'admin.settings.field.impact.ctaHref.label', 'admin.settings.field.impact.ctaHref.hint'],
  ['impact.stat1Label', 'admin.settings.field.impact.stat1Label.label', 'admin.settings.field.impact.stat1Label.hint'],
  ['impact.stat1Value', 'admin.settings.field.impact.stat1Value.label', 'admin.settings.field.impact.stat1Value.hint'],
  ['impact.stat1Suffix', 'admin.settings.field.impact.stat1Suffix.label', 'admin.settings.field.impact.stat1Suffix.hint'],
  ['impact.stat2Label', 'admin.settings.field.impact.stat2Label.label', 'admin.settings.field.impact.stat2Label.hint'],
  ['impact.stat2Value', 'admin.settings.field.impact.stat2Value.label', 'admin.settings.field.impact.stat2Value.hint'],
  ['impact.stat2Suffix', 'admin.settings.field.impact.stat2Suffix.label', 'admin.settings.field.impact.stat2Suffix.hint'],
  ['impact.stat3Label', 'admin.settings.field.impact.stat3Label.label', 'admin.settings.field.impact.stat3Label.hint'],
  ['impact.stat3Value', 'admin.settings.field.impact.stat3Value.label', 'admin.settings.field.impact.stat3Value.hint'],
  ['impact.stat3Suffix', 'admin.settings.field.impact.stat3Suffix.label', 'admin.settings.field.impact.stat3Suffix.hint'],
];

const TEXT_FIELDS: [string, string, string][] = [
  ['home.ctaTitle', 'admin.settings.field.home.ctaTitle.label', 'admin.settings.field.home.ctaTitle.hint'],
  ['home.ctaBody', 'admin.settings.field.home.ctaBody.label', 'admin.settings.field.home.ctaBody.hint'],
  ['company.intro', 'admin.settings.field.company.intro.label', 'admin.settings.field.company.intro.hint'],
  ['contact.email', 'admin.settings.field.contact.email.label', 'admin.settings.field.contact.email.hint'],
  ['contact.phone', 'admin.settings.field.contact.phone.label', 'admin.settings.field.contact.phone.hint'],
  ['contact.whatsapp', 'admin.settings.field.contact.whatsapp.label', 'admin.settings.field.contact.whatsapp.hint'],
  ['legal.privacyNotice', 'admin.settings.field.legal.privacyNotice.label', 'admin.settings.field.legal.privacyNotice.hint'],
];

function fill(template: string, vars: Record<string, string | number>): string {
  return Object.entries(vars).reduce(
    (acc, [key, value]) => acc.replaceAll(`{${key}}`, String(value)),
    template,
  );
}

export function SettingsEditor() {
  const { t } = useTranslation();
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
                  .map((x) => ({
                    url: String(x.url),
                    alt: String(x.alt ?? ''),
                    mobileUrl: String(x.mobileUrl ?? ''),
                  })),
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
    setHeroImages((prev) => [...prev, { url: '', alt: '', mobileUrl: '' }]);
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
    setMessage(t('admin.settings.state.saving'));

    const payload: Record<string, string> = { ...values };
    const cleanSlides = heroImages
      .filter((slide) => slide.url.trim().length > 0)
      .map((slide) => ({
        url: slide.url.trim(),
        alt: slide.alt.trim(),
        mobileUrl: slide.mobileUrl.trim(),
      }));
    payload['home.heroImages'] = cleanSlides.length ? JSON.stringify(cleanSlides) : '';

    const res = await fetch('/api/admin/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      setMessage(t('admin.settings.notice.saved'));
    } else {
      const body = await res.json().catch(() => ({}));
      setMessage((body as { error?: string }).error ?? t('admin.settings.error.saveFailed'));
    }
  }

  if (loading) {
    return <p className="form-note">{t('admin.settings.state.loading')}</p>;
  }

  return (
    <form onSubmit={save}>
      <section style={{ marginBottom: '3rem' }}>
        <h2 style={{ marginBottom: '0.5rem' }}>{t('admin.settings.hero.title')}</h2>
        <p className="form-note" style={{ marginBottom: '1.5rem' }}>
          {t('admin.settings.hero.intro')}
        </p>

        {heroImages.length === 0 && (
          <div className="empty-panel" style={{ marginBottom: '1rem' }}>
            <strong>{t('admin.settings.hero.empty.title')}</strong>
            {t('admin.settings.hero.empty.body')}
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
              <strong>{fill(t('admin.settings.hero.slide'), { n: index + 1 })}</strong>
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                <button
                  type="button"
                  className="admin-action"
                  onClick={() => moveSlide(index, -1)}
                  disabled={index === 0}
                >
                  {t('admin.settings.hero.action.up')}
                </button>
                <button
                  type="button"
                  className="admin-action"
                  onClick={() => moveSlide(index, 1)}
                  disabled={index === heroImages.length - 1}
                >
                  {t('admin.settings.hero.action.down')}
                </button>
                <button
                  type="button"
                  className="admin-action"
                  onClick={() => removeSlide(index)}
                >
                  {t('admin.settings.hero.action.remove')}
                </button>
              </div>
            </div>

            <label htmlFor={'hero-url-' + index}>
              {t('admin.settings.hero.field.image')}
            </label>
            <select
              id={'hero-url-' + index}
              value={media.some((m) => m.url === slide.url) ? slide.url : ''}
              onChange={(e) => {
                if (e.target.value) updateSlide(index, { url: e.target.value });
              }}
              style={{ marginBottom: '0.5rem' }}
            >
              <option value="">{t('admin.settings.hero.field.imagePick')}</option>
              {media.map((m) => (
                <option key={m.url} value={m.url}>
                  {m.name}
                </option>
              ))}
            </select>
            <input
              type="text"
              value={slide.url}
              onChange={(e) => updateSlide(index, { url: e.target.value })}
              placeholder={t('admin.settings.hero.field.imagePlaceholder')}
            />

            <label
              htmlFor={'hero-mobile-' + index}
              style={{ marginTop: '0.75rem', display: 'block' }}
            >
              {t('admin.settings.hero.field.mobile')}
            </label>
            <select
              id={'hero-mobile-' + index}
              value={media.some((m) => m.url === slide.mobileUrl) ? slide.mobileUrl : ''}
              onChange={(e) => updateSlide(index, { mobileUrl: e.target.value })}
              style={{ marginBottom: '0.5rem' }}
            >
              <option value="">{t('admin.settings.hero.field.mobilePick')}</option>
              {media.map((m) => (
                <option key={m.url} value={m.url}>
                  {m.name}
                </option>
              ))}
            </select>
            <input
              type="text"
              value={slide.mobileUrl}
              onChange={(e) => updateSlide(index, { mobileUrl: e.target.value })}
              placeholder={t('admin.settings.hero.field.mobilePlaceholder')}
            />

            <label
              htmlFor={'hero-alt-' + index}
              style={{ marginTop: '0.75rem' }}
            >
              {t('admin.settings.hero.field.alt')}
            </label>
            <input
              id={'hero-alt-' + index}
              type="text"
              value={slide.alt}
              onChange={(e) => updateSlide(index, { alt: e.target.value })}
              maxLength={200}
            />
          </div>
        ))}

        <button type="button" className="admin-action" onClick={addSlide}>
          {t('admin.settings.hero.action.add')}
        </button>
      </section>

      <section style={{ marginBottom: '3rem' }}>
        <h2 style={{ marginBottom: '0.5rem' }}>{t('admin.settings.impact.title')}</h2>
        <p className="form-note" style={{ marginBottom: '1.5rem' }}>
          {t('admin.settings.impact.intro')}
        </p>
        {IMPACT_FIELDS.map(([key, labelKey, hintKey]) => (
          <div className="field" key={key} style={{ margin: '1.25rem 0' }}>
            <label htmlFor={key}>{t(labelKey)}</label>
            <textarea
              id={key}
              value={values[key] ?? ''}
              onChange={(e) => setValues({ ...values, [key]: e.target.value })}
              maxLength={20000}
              style={{
                minHeight:
                  key === 'impact.body1' || key === 'impact.body2' ? 120 : 52,
              }}
            />
            <span className="form-note">{t(hintKey)}</span>
          </div>
        ))}
      </section>

      <section style={{ marginBottom: '3rem' }}>
        <h2 style={{ marginBottom: '0.5rem' }}>{t('admin.settings.page.title')}</h2>
        {TEXT_FIELDS.map(([key, labelKey, hintKey]) => (
          <div className="field" key={key} style={{ margin: '1.25rem 0' }}>
            <label htmlFor={key}>{t(labelKey)}</label>
            <textarea
              id={key}
              value={values[key] ?? ''}
              onChange={(e) => setValues({ ...values, [key]: e.target.value })}
              maxLength={20000}
              style={{
                minHeight:
                  key === 'company.intro' ||
                  key === 'legal.privacyNotice' ||
                  key === 'home.ctaBody'
                    ? 120
                    : 52,
              }}
            />
            <span className="form-note">{t(hintKey)}</span>
          </div>
        ))}
      </section>

      <button className="button" type="submit">
        {t('admin.settings.action.save')}
      </button>
      <p role="status" className="form-note" style={{ marginTop: '0.75rem' }}>
        {message}
      </p>
    </form>
  );
}