'use client';
import { useState } from 'react';
import { useTranslation } from '@/lib/i18n/context';
import { SpecGroupCombobox } from '@/components/admin/spec-group-combobox';

type TranslationBlock = Record<string, unknown>;
type Translations = Record<string, TranslationBlock>;

type Specification = {
  id: string;
  label: string;
  value: string;
  unit: string | null;
  group: string | null;
  translations?: Translations | null;
};

type EditDraft = {
  group: string;
  label: string;
  value: string;
  unit: string;
};

type TrDraft = {
  zh: string;
  fr: string;
};

const LANGS: { code: 'zh' | 'fr'; label: string }[] = [
  { code: 'zh', label: '中文' },
  { code: 'fr', label: 'Français' },
];

export function ProductSpecifications({
  productId,
  initial,
}: {
  productId: string;
  initial: Specification[];
}) {
  const { t } = useTranslation();
  const [items, setItems] = useState(initial);
  const [error, setError] = useState('');
  const [groupValue, setGroupValue] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<EditDraft>({
    group: '',
    label: '',
    value: '',
    unit: '',
  });
  const [saving, setSaving] = useState(false);

  // Translations sub-editor state
  const [trOpenId, setTrOpenId] = useState<string | null>(null);
  const [trLang, setTrLang] = useState<'zh' | 'fr'>('zh');
  const [trDraft, setTrDraft] = useState<TrDraft>({ zh: '', fr: '' });
  const [trSaving, setTrSaving] = useState(false);

  async function add(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const body = Object.fromEntries(new FormData(formElement).entries());
    const response = await fetch(`/api/admin/products/${productId}/specifications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (response.ok) {
      setItems([...items, await response.json()]);
      formElement.reset();
      setGroupValue('');
      setError('');
    } else setError((await response.json()).error ?? t('admin.specs.error.add'));
  }

  function startEdit(item: Specification) {
    setEditingId(item.id);
    setTrOpenId(null);
    setDraft({
      group: item.group ?? '',
      label: item.label,
      value: item.value,
      unit: item.unit ?? '',
    });
    setError('');
  }

  function cancelEdit() {
    setEditingId(null);
    setDraft({ group: '', label: '', value: '', unit: '' });
  }

  async function saveEdit(item: Specification) {
    setSaving(true);
    setError('');
    try {
      const response = await fetch(
        `/api/admin/products/${productId}/specifications/${item.id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            group: draft.group.trim() || null,
            label: draft.label.trim(),
            value: draft.value.trim(),
            unit: draft.unit.trim() || null,
          }),
        },
      );
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error((body as { error?: string }).error ?? t('admin.specs.error.update'));
      }
      const updated: Specification = await response.json();
      setItems((prev) =>
        prev.map((s) => (s.id === item.id ? { ...s, ...updated } : s)),
      );
      cancelEdit();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : t('admin.specs.error.update'));
    } finally {
      setSaving(false);
    }
  }

  async function remove(item: Specification) {
    const response = await fetch(
      `/api/admin/products/${productId}/specifications/${item.id}`,
      { method: 'DELETE' },
    );
    if (response.ok) setItems(items.filter((x) => x.id !== item.id));
    else setError(t('admin.specs.error.remove'));
  }

  function openTranslations(item: Specification) {
    setTrOpenId(item.id);
    setEditingId(null);
    const existing = item.translations ?? {};
    const zh = (existing.zh as TranslationBlock | undefined)?.label;
    const fr = (existing.fr as TranslationBlock | undefined)?.label;
    setTrDraft({
      zh: typeof zh === 'string' ? zh : '',
      fr: typeof fr === 'string' ? fr : '',
    });
    setTrLang('zh');
    setError('');
  }

  function closeTranslations() {
    setTrOpenId(null);
    setTrDraft({ zh: '', fr: '' });
  }

  async function saveTranslations(item: Specification) {
    setTrSaving(true);
    setError('');
    try {
      // Build the translations JSON — only include languages with a value.
      const next: Translations = {};
      const zhLabel = trDraft.zh.trim();
      const frLabel = trDraft.fr.trim();
      if (zhLabel) next.zh = { label: zhLabel };
      if (frLabel) next.fr = { label: frLabel };

      const response = await fetch(
        `/api/admin/products/${productId}/specifications/${item.id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            translations: Object.keys(next).length ? next : null,
          }),
        },
      );
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error((body as { error?: string }).error ?? t('admin.specs.error.update'));
      }
      const updated: Specification = await response.json();
      setItems((prev) =>
        prev.map((s) => (s.id === item.id ? { ...s, ...updated } : s)),
      );
      closeTranslations();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : t('admin.specs.error.update'));
    } finally {
      setTrSaving(false);
    }
  }

  // Group items for display
  const grouped = new Map<string, Specification[]>();
  const ungrouped: Specification[] = [];
  for (const item of items) {
    if (item.group && item.group.trim()) {
      const key = item.group.trim();
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key)!.push(item);
    } else {
      ungrouped.push(item);
    }
  }

  function translationsCount(item: Specification): number {
    const tr = item.translations;
    if (!tr) return 0;
    let n = 0;
    if (typeof (tr.zh as TranslationBlock | undefined)?.label === 'string') n++;
    if (typeof (tr.fr as TranslationBlock | undefined)?.label === 'string') n++;
    return n;
  }

  function renderRow(item: Specification) {
    const isEditing = editingId === item.id;
    const isTrOpen = trOpenId === item.id;
    const trCount = translationsCount(item);

    return (
      <li key={item.id} className="spec-row-group">
        {isEditing ? (
          <div className="spec-row spec-row--editing">
            <div className="spec-row__edit-grid">
              <div className="spec-row__edit-field">
                <label>{t('admin.specs.field.group')}</label>
                <SpecGroupCombobox
                  value={draft.group}
                  onChange={(v) => setDraft({ ...draft, group: v })}
                  placeholder="—"
                />
              </div>
              <div className="spec-row__edit-field">
                <label>{t('admin.specs.field.label')}</label>
                <input
                  type="text"
                  value={draft.label}
                  onChange={(e) => setDraft({ ...draft, label: e.target.value })}
                  maxLength={120}
                />
              </div>
              <div className="spec-row__edit-field">
                <label>{t('admin.specs.field.value')}</label>
                <input
                  type="text"
                  value={draft.value}
                  onChange={(e) => setDraft({ ...draft, value: e.target.value })}
                  maxLength={200}
                />
              </div>
              <div className="spec-row__edit-field">
                <label>{t('admin.specs.field.unit')}</label>
                <input
                  type="text"
                  value={draft.unit}
                  onChange={(e) => setDraft({ ...draft, unit: e.target.value })}
                  maxLength={40}
                />
              </div>
              <div className="spec-row__edit-actions">
                <button
                  type="button"
                  className="admin-action admin-action--primary"
                  disabled={saving || !draft.label.trim() || !draft.value.trim()}
                  onClick={() => void saveEdit(item)}
                >
                  {saving ? t('admin.actions.saving') : t('admin.specs.action.save')}
                </button>
                <button
                  type="button"
                  className="admin-action"
                  onClick={cancelEdit}
                  disabled={saving}
                >
                  {t('admin.actions.cancel')}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="spec-row">
            <span className="spec-row__text">
              <strong>{item.label}</strong>: {item.value}
              {item.unit ? ` ${item.unit}` : ''}
              {trCount > 0 && (
                <span className="spec-row__translated-badge" title={t('admin.specs.translations.toggle')}>
                  {' \u00B7 '}
                  {trCount} {t('admin.specs.translations.short')}
                </span>
              )}
            </span>
            <div className="spec-row__actions">
              <button
                type="button"
                className={
                  'admin-action' + (trCount > 0 ? ' admin-action--featured' : '')
                }
                onClick={() => (isTrOpen ? closeTranslations() : openTranslations(item))}
              >
                {t('admin.specs.translations.toggle')}
              </button>
              <button
                type="button"
                className="admin-action admin-action--edit"
                onClick={() => startEdit(item)}
              >
                {t('admin.actions.edit')}
              </button>
              <button
                type="button"
                className="admin-action admin-action--danger"
                onClick={() => void remove(item)}
              >
                {t('admin.specs.action.remove')}
              </button>
            </div>
          </div>
        )}

        {isTrOpen && !isEditing && (
          <div className="spec-translations">
            <p className="spec-translations__hint">
              {t('admin.specs.translations.hint')}
            </p>

            <div className="translations-editor__tabs" role="tablist">
              {LANGS.map((l) => (
                <button
                  key={l.code}
                  type="button"
                  role="tab"
                  aria-selected={trLang === l.code}
                  className={
                    'translations-editor__tab' +
                    (trLang === l.code ? ' is-active' : '')
                  }
                  onClick={() => setTrLang(l.code)}
                >
                  {l.label}
                </button>
              ))}
            </div>

            <div className="spec-translations__field">
              <label htmlFor={`tr-${item.id}-${trLang}`}>
                {t('admin.specs.field.label')}
              </label>
              <input
                id={`tr-${item.id}-${trLang}`}
                type="text"
                value={trDraft[trLang]}
                onChange={(e) =>
                  setTrDraft((prev) => ({ ...prev, [trLang]: e.target.value }))
                }
                maxLength={120}
                placeholder={item.label}
              />
            </div>

            <div className="spec-translations__actions">
              <button
                type="button"
                className="admin-action admin-action--primary"
                disabled={trSaving}
                onClick={() => void saveTranslations(item)}
              >
                {trSaving ? t('admin.actions.saving') : t('admin.specs.action.save')}
              </button>
              <button
                type="button"
                className="admin-action"
                onClick={closeTranslations}
                disabled={trSaving}
              >
                {t('admin.actions.cancel')}
              </button>
            </div>
          </div>
        )}
      </li>
    );
  }

  return (
    <details>
      <summary>
        {t('admin.specs.summary')} ({items.length})
      </summary>

      {items.length > 0 && (
        <div className="spec-groups">
          {[...grouped.entries()].map(([group, list]) => (
            <div key={group} className="spec-group">
              <strong className="spec-group__title">{group}</strong>
              <ul>{list.map(renderRow)}</ul>
            </div>
          ))}
          {ungrouped.length > 0 && (
            <div className="spec-group">
              <strong className="spec-group__title spec-group__title--muted">
                {t('admin.specs.ungrouped')}
              </strong>
              <ul>{ungrouped.map(renderRow)}</ul>
            </div>
          )}
        </div>
      )}

      <form onSubmit={add} className="spec-form">
        <label>
          {t('admin.specs.field.group')}
          <SpecGroupCombobox
            name="group"
            value={groupValue}
            onChange={setGroupValue}
            placeholder={t('admin.specs.field.groupPlaceholder')}
          />
        </label>
        <label>
          {t('admin.specs.field.label')}
          <input name="label" required maxLength={120} />
        </label>
        <label>
          {t('admin.specs.field.value')}
          <input name="value" required maxLength={200} />
        </label>
        <label>
          {t('admin.specs.field.unit')}
          <input name="unit" maxLength={40} />
        </label>
        <button className="admin-action">{t('admin.specs.action.add')}</button>
      </form>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
    </details>
  );
}