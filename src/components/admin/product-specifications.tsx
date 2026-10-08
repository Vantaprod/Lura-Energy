'use client';
import { useState } from 'react';
import { useTranslation } from '@/lib/i18n/context';
import { SpecGroupCombobox } from '@/components/admin/spec-group-combobox';

type Specification = {
  id: string;
  label: string;
  value: string;
  unit: string | null;
  group: string | null;
};

type EditDraft = {
  group: string;
  label: string;
  value: string;
  unit: string;
};

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

  function renderRow(item: Specification) {
    if (editingId === item.id) {
      return (
        <li key={item.id} className="spec-row spec-row--editing">
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
        </li>
      );
    }
    return (
      <li key={item.id} className="spec-row">
        <span className="spec-row__text">
          <strong>{item.label}</strong>: {item.value}
          {item.unit ? ` ${item.unit}` : ''}
        </span>
        <div className="spec-row__actions">
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