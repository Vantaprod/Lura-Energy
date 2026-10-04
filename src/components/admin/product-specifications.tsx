'use client';
import { useState } from 'react';
import { useTranslation } from '@/lib/i18n/context';

type Specification = { id: string; label: string; value: string; unit: string | null };

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

  return (
    <details>
      <summary>
        {t('admin.specs.summary')} ({items.length})
      </summary>
      {items.length > 0 && (
        <ul>
          {items.map((item) => (
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
      )}
      <form onSubmit={add} className="spec-form">
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