'use client';
import { useState } from 'react';
import { useTranslation } from '@/lib/i18n/context';

type Specification = {
  id: string;
  label: string;
  value: string;
  unit: string | null;
  group: string | null;
};

const SUGGESTED_GROUPS = [
  '\u{1F50B} Battery',
  '\u{26A1} Inverter',
  '\u{2600} Solar',
  '\u{1F50C} Performance',
  '\u{1F4D0} Physical',
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
    } else setError((await response.json()).error ?? t('admin.specs.error.add'));
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

  return (
    <details>
      <summary>
        {t('admin.specs.summary')} ({items.length})
      </summary>

      {items.length > 0 && (
        <div style={{ marginBottom: '0.75rem' }}>
          {[...grouped.entries()].map(([group, list]) => (
            <div key={group} style={{ marginBottom: '0.5rem' }}>
              <strong style={{ display: 'block', fontSize: '12px', color: '#0A1550', letterSpacing: '0.04em' }}>
                {group}
              </strong>
              <ul style={{ margin: '4px 0 0', paddingLeft: '1.25rem' }}>
                {list.map((item) => (
                  <li key={item.id}>
                    {item.label}: {item.value}
                    {item.unit ? ` ${item.unit}` : ''}{' '}
                    <button
                      type="button"
                      className="admin-action"
                      onClick={() => void remove(item)}
                    >
                      {t('admin.specs.action.remove')}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          {ungrouped.length > 0 && (
            <div style={{ marginBottom: '0.5rem' }}>
              <strong style={{ display: 'block', fontSize: '12px', color: '#6B7686', letterSpacing: '0.04em' }}>
                {t('admin.specs.ungrouped')}
              </strong>
              <ul style={{ margin: '4px 0 0', paddingLeft: '1.25rem' }}>
                {ungrouped.map((item) => (
                  <li key={item.id}>
                    {item.label}: {item.value}
                    {item.unit ? ` ${item.unit}` : ''}{' '}
                    <button
                      type="button"
                      className="admin-action"
                      onClick={() => void remove(item)}
                    >
                      {t('admin.specs.action.remove')}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <form onSubmit={add} className="spec-form">
        <label>
          {t('admin.specs.field.group')}
          <input
            name="group"
            list="spec-group-suggestions"
            maxLength={80}
            placeholder={t('admin.specs.field.groupPlaceholder')}
          />
        </label>
        <datalist id="spec-group-suggestions">
          {SUGGESTED_GROUPS.map((g) => (
            <option key={g} value={g} />
          ))}
        </datalist>
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