'use client';

import { useState } from 'react';
import { useTranslation } from '@/lib/i18n/context';

export type TranslationField = {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'lines';
};

type Block = Record<string, unknown>;
type Translations = Record<string, Block>;

type Props = {
  value: Translations | null;
  onChange: (next: Translations) => void;
  fields: TranslationField[];
};

const LANGS: { code: 'zh' | 'fr'; label: string }[] = [
  { code: 'zh', label: '中文' },
  { code: 'fr', label: 'Français' },
];

export function TranslationsEditor({ value, onChange, fields }: Props) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [lang, setLang] = useState<'zh' | 'fr'>('zh');

  const block = (value?.[lang] ?? {}) as Block;

  function setField(key: string, fieldValue: unknown) {
    const next: Translations = { ...(value ?? {}) };
    next[lang] = { ...block, [key]: fieldValue };
    onChange(next);
  }

  function countFilled(): number {
    let n = 0;
    for (const l of LANGS) {
      const b = value?.[l.code];
      if (!b) continue;
      for (const f of fields) {
        const v = b[f.key];
        if (Array.isArray(v) ? v.length > 0 : typeof v === 'string' && v.trim()) {
          n++;
        }
      }
    }
    return n;
  }

  const filled = countFilled();

  return (
    <div className="translations-editor">
      <button
        type="button"
        className="translations-editor__toggle"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span className="translations-editor__chevron" aria-hidden="true">
          {open ? '\u25BE' : '\u25B8'}
        </span>
        <span className="translations-editor__title">
          {t('admin.translations.title')}
        </span>
        <span className="translations-editor__count">
          {filled > 0
            ? t('admin.translations.countFilled').replace('{n}', String(filled))
            : t('admin.translations.none')}
        </span>
      </button>

      {open && (
        <div className="translations-editor__body">
          <p className="translations-editor__hint">
            {t('admin.translations.hint')}
          </p>

          <div className="translations-editor__tabs" role="tablist">
            {LANGS.map((l) => (
              <button
                key={l.code}
                type="button"
                role="tab"
                aria-selected={lang === l.code}
                className={
                  'translations-editor__tab' +
                  (lang === l.code ? ' is-active' : '')
                }
                onClick={() => setLang(l.code)}
              >
                {l.label}
              </button>
            ))}
          </div>

          <div className="translations-editor__fields">
            {fields.map((f) => {
              const raw = block[f.key];
              const stringValue = typeof raw === 'string' ? raw : '';
              const arrayValue = Array.isArray(raw)
                ? (raw as string[]).join('\n')
                : '';
              const value = f.type === 'lines' ? arrayValue : stringValue;

              return (
                <div className="field field-wide" key={f.key}>
                  <label htmlFor={`tr-${lang}-${f.key}`}>{f.label}</label>
                  {f.type === 'text' ? (
                    <input
                      id={`tr-${lang}-${f.key}`}
                      type="text"
                      value={value}
                      onChange={(e) => setField(f.key, e.target.value)}
                      maxLength={500}
                    />
                  ) : (
                    <textarea
                      id={`tr-${lang}-${f.key}`}
                      value={value}
                      rows={f.type === 'lines' ? 4 : 4}
                      onChange={(e) => {
                        if (f.type === 'lines') {
                          const arr = e.target.value
                            .split('\n')
                            .map((s) => s.trim())
                            .filter(Boolean);
                          setField(f.key, arr);
                        } else {
                          setField(f.key, e.target.value);
                        }
                      }}
                      maxLength={20000}
                    />
                  )}
                  {f.type === 'lines' && (
                    <span className="form-note">
                      {t('admin.translations.linesHint')}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          <button
            type="button"
            className="admin-action admin-action--danger"
            onClick={() => {
              const next: Translations = { ...(value ?? {}) };
              delete next[lang];
              onChange(next);
            }}
          >
            {t('admin.translations.clearLang')}
          </button>
        </div>
      )}
    </div>
  );
}