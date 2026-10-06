'use client';

import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from '@/lib/i18n/context';
import { Select } from '@/components/ui/select';

type Centre = {
  id: string;
  name: string;
  slug: string;
  type: string | null;
  address: string;
  city: string;
  state: string | null;
  phone: string | null;
  email: string | null;
  hours: string | null;
  latitude: number | null;
  longitude: number | null;
  description: string | null;
  imageUrl: string | null;
  published: boolean;
  sortOrder: number;
};

type EditValues = {
  name: string;
  slug: string;
  type: string;
  address: string;
  city: string;
  state: string;
  phone: string;
  email: string;
  hours: string;
  latitude: string;
  longitude: string;
  description: string;
  published: boolean;
  sortOrder: string;
};

function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export function ServiceCentresManager() {
  const { t } = useTranslation();
  const [items, setItems] = useState<Centre[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [editing, setEditing] = useState<Centre | null>(null);
  const [values, setValues] = useState<EditValues | null>(null);
  const [query, setQuery] = useState('');
  const [createType, setCreateType] = useState('Service Centre');

  const TYPES = [
    { value: 'Service Centre', label: t('admin.sc.type.service') },
    { value: 'Pickup Point', label: t('admin.sc.type.pickup') },
    { value: 'Both', label: t('admin.sc.type.both') },
  ];

  const PUBLISH_OPTIONS = [
    { value: 'false', label: t('admin.sc.edit.draft') },
    { value: 'true', label: t('admin.sc.edit.published') },
  ];

  const emptyEdit = (c: Centre): EditValues => ({
    name: c.name,
    slug: c.slug,
    type: c.type ?? 'Service Centre',
    address: c.address,
    city: c.city,
    state: c.state ?? '',
    phone: c.phone ?? '',
    email: c.email ?? '',
    hours: c.hours ?? '',
    latitude: c.latitude !== null ? String(c.latitude) : '',
    longitude: c.longitude !== null ? String(c.longitude) : '',
    description: c.description ?? '',
    published: c.published,
    sortOrder: String(c.sortOrder),
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/service-centres');
      const data = await res.json();
      if (!res.ok) {
        throw new Error((data as { error?: string }).error ?? t('admin.sc.error.load'));
      }
      setItems(data as Centre[]);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : t('admin.sc.error.load'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void load();
  }, [load]);

  async function create(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setBusy(true);
    setError('');
    setMessage('');

    const data = new FormData(form);
    const name = String(data.get('name') ?? '').trim();
    const slugInput = String(data.get('slug') ?? '').trim();
    const slug = slugInput || slugify(name);
    const payload: Record<string, unknown> = {
      name,
      slug,
      type: createType,
      address: String(data.get('address') ?? '').trim(),
      city: String(data.get('city') ?? '').trim(),
      state: String(data.get('state') ?? '').trim() || undefined,
      phone: String(data.get('phone') ?? '').trim() || undefined,
      email: String(data.get('email') ?? '').trim() || undefined,
      hours: String(data.get('hours') ?? '').trim() || undefined,
      description: String(data.get('description') ?? '').trim() || undefined,
    };

    try {
      const res = await fetch('/api/admin/service-centres', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const body = await res.json();
      if (!res.ok) {
        throw new Error((body as { error?: string }).error ?? t('admin.sc.error.save'));
      }
      form.reset();
      setCreateType('Service Centre');
      setMessage(t('admin.sc.toast.saved'));
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : t('admin.sc.error.save'));
    } finally {
      setBusy(false);
    }
  }

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editing || !values) return;
    setError('');
    setMessage('');

    const payload = {
      name: values.name,
      slug: values.slug,
      type: values.type || null,
      address: values.address,
      city: values.city,
      state: values.state || null,
      phone: values.phone || null,
      email: values.email || null,
      hours: values.hours || null,
      latitude: values.latitude.trim() ? Number(values.latitude) : null,
      longitude: values.longitude.trim() ? Number(values.longitude) : null,
      description: values.description || null,
      published: values.published,
      sortOrder: Number(values.sortOrder) || 0,
    };

    try {
      const res = await fetch('/api/admin/service-centres/' + editing.id, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const body = await res.json();
      if (!res.ok) {
        throw new Error((body as { error?: string }).error ?? t('admin.sc.error.update'));
      }
      setEditing(null);
      setValues(null);
      setMessage(t('admin.sc.toast.updated'));
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : t('admin.sc.error.update'));
    }
  }

  async function toggle(item: Centre) {
    const res = await fetch('/api/admin/service-centres/' + item.id, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ published: !item.published }),
    });
    if (res.ok) await load();
    else setError(t('admin.sc.error.publish'));
  }

  async function remove(item: Centre) {
    if (!window.confirm(t('admin.actions.confirmDelete'))) return;
    const res = await fetch('/api/admin/service-centres/' + item.id, {
      method: 'DELETE',
    });
    if (res.ok) {
      setMessage(t('admin.sc.toast.deleted'));
      await load();
    } else setError(t('admin.sc.error.delete'));
  }

  function editField(
    key: keyof EditValues,
    label: string,
    wide = false,
    placeholder = '',
  ) {
    return (
      <div className={'field ' + (wide ? 'field-wide' : '')} key={key}>
        <label htmlFor={'edit-sc-' + key}>{label}</label>
        <input
          id={'edit-sc-' + key}
          value={String(values?.[key] ?? '')}
          placeholder={placeholder}
          onChange={(e) =>
            setValues((cur) => (cur ? { ...cur, [key]: e.target.value } : cur))
          }
        />
      </div>
    );
  }

  const visible = items.filter((c) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.city.toLowerCase().includes(q) ||
      (c.state ?? '').toLowerCase().includes(q)
    );
  });

  return (
    <>
      <form className="form-grid" onSubmit={create}>
        <div className="field">
          <label htmlFor="sc-name">{t('admin.sc.form.name')}</label>
          <input
            name="name"
            id="sc-name"
            required
            maxLength={160}
            placeholder={t('admin.sc.form.namePlaceholder')}
          />
        </div>
        <div className="field">
          <label htmlFor="sc-slug">{t('admin.sc.form.slug')}</label>
          <input
            name="slug"
            id="sc-slug"
            maxLength={180}
            placeholder={t('admin.sc.form.slugPlaceholder')}
          />
          <span className="form-note">{t('admin.sc.form.slugHint')}</span>
        </div>
        <div className="field">
          <label htmlFor="sc-type">{t('admin.sc.form.type')}</label>
          <Select
            id="sc-type"
            name="type"
            value={createType}
            onChange={setCreateType}
            options={TYPES}
            fullWidth
          />
        </div>
        <div className="field">
          <label htmlFor="sc-city">{t('admin.sc.form.city')}</label>
          <input name="city" id="sc-city" required maxLength={120} />
        </div>
        <div className="field">
          <label htmlFor="sc-state">{t('admin.sc.form.state')}</label>
          <input name="state" id="sc-state" maxLength={120} />
        </div>
        <div className="field">
          <label htmlFor="sc-phone">{t('admin.sc.form.phone')}</label>
          <input
            name="phone"
            id="sc-phone"
            maxLength={60}
            placeholder={t('admin.sc.form.phonePlaceholder')}
          />
        </div>
        <div className="field field-wide">
          <label htmlFor="sc-address">{t('admin.sc.form.address')}</label>
          <input name="address" id="sc-address" required maxLength={400} />
        </div>
        <div className="field">
          <label htmlFor="sc-email">{t('admin.sc.form.email')}</label>
          <input name="email" id="sc-email" type="email" maxLength={180} />
        </div>
        <div className="field">
          <label htmlFor="sc-hours">{t('admin.sc.form.hours')}</label>
          <input
            name="hours"
            id="sc-hours"
            maxLength={200}
            placeholder={t('admin.sc.form.hoursPlaceholder')}
          />
        </div>
        <div className="field field-wide">
          <label htmlFor="sc-description">{t('admin.sc.form.notes')}</label>
          <textarea name="description" id="sc-description" maxLength={2000} />
        </div>
        <div className="field-wide">
          <button className="button" disabled={busy}>
            {busy ? t('admin.actions.saving') : t('admin.sc.form.submit')}
          </button>
        </div>
      </form>

      {error && (
        <p className="form-error" role="alert">
          {error}{' '}
          <button type="button" className="admin-action" onClick={() => void load()}>
            {t('admin.actions.retry')}
          </button>
        </p>
      )}
      {message && (
        <p className="form-note" role="status">
          {message}
        </p>
      )}

      <h2 style={{ fontSize: '1.6rem', margin: '3rem 0 1rem' }}>
        {t('admin.sc.list.heading')}
      </h2>

      <div className="field" style={{ maxWidth: '420px', marginBottom: '1rem' }}>
        <label htmlFor="sc-search">{t('admin.sc.list.search')}</label>
        <input
          id="sc-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('admin.sc.list.searchPlaceholder')}
        />
      </div>

      <p className="form-note" aria-live="polite">
        {visible.length}{' '}
        {visible.length === 1
          ? t('admin.sc.list.countOne')
          : t('admin.sc.list.countMany')}
        {loading ? ' - ' + t('admin.actions.loading') : ''}
      </p>

      {visible.length > 0 ? (
        <div style={{ overflowX: 'auto' }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>{t('admin.sc.list.colName')}</th>
                <th>{t('admin.sc.list.colType')}</th>
                <th>{t('admin.sc.list.colLocation')}</th>
                <th>{t('admin.sc.list.colContact')}</th>
                <th>{t('admin.sc.list.colState')}</th>
                <th>{t('admin.sc.list.colActions')}</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((c) => (
                <tr key={c.id}>
                  <td>
                    {c.name}
                    <br />
                    <span className="form-note">{c.slug}</span>
                  </td>
                  <td>
                    {c.type === 'Service Centre'
                      ? t('admin.sc.type.service')
                      : c.type === 'Pickup Point'
                        ? t('admin.sc.type.pickup')
                        : c.type === 'Both'
                          ? t('admin.sc.type.both')
                          : '-'}
                  </td>
                  <td>
                    {c.address}
                    <br />
                    <span className="form-note">
                      {c.city}
                      {c.state ? ', ' + c.state : ''}
                    </span>
                  </td>
                  <td>
                    {c.phone && <div>{c.phone}</div>}
                    {c.email && <div className="form-note">{c.email}</div>}
                  </td>
                  <td>
                    {c.published
                      ? t('admin.sc.edit.published')
                      : t('admin.sc.edit.draft')}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        className="admin-action admin-action--edit"
                        onClick={() => {
                          setEditing(c);
                          setValues(emptyEdit(c));
                          setTimeout(() => {
                            const p = document.querySelector('.edit-panel');
                            if (p) p.scrollIntoView({ behavior: 'smooth', block: 'start' });
                          }, 50);
                        }}
                      >
                        {t('admin.actions.edit')}
                      </button>
                      <button
                        type="button"
                        className="admin-action admin-action--primary"
                        onClick={() => void toggle(c)}
                      >
                        {c.published
                          ? t('admin.actions.unpublish')
                          : t('admin.actions.publish')}
                      </button>
                      <button
                        type="button"
                        className="admin-action admin-action--danger"
                        onClick={() => void remove(c)}
                      >
                        {t('admin.actions.delete')}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="form-note">
          {loading
            ? t('admin.sc.list.loading')
            : query
              ? t('admin.sc.list.noMatch')
              : t('admin.sc.list.empty')}
        </p>
      )}

      {editing && values && (
        <form onSubmit={save} className="form-grid edit-panel">
          <div className="field-wide">
            <p className="eyebrow">{t('admin.sc.edit.title')}</p>
            <h2 style={{ fontSize: '1.6rem' }}>{editing.name}</h2>
          </div>

          {editField('name', t('admin.sc.form.name'))}
          {editField('slug', t('admin.sc.form.slug'))}

          <div className="field">
            <label htmlFor="edit-sc-type">{t('admin.sc.form.type')}</label>
            <Select
              id="edit-sc-type"
              value={values.type}
              onChange={(v) => setValues({ ...values, type: v })}
              options={TYPES}
              fullWidth
            />
          </div>

          {editField('city', t('admin.sc.form.city'))}
          {editField('state', t('admin.sc.form.state'))}
          {editField('address', t('admin.sc.form.address'), true)}
          {editField('phone', t('admin.sc.form.phone'))}
          {editField('email', t('admin.sc.form.email'))}
          {editField('hours', t('admin.sc.form.hours'))}
          {editField('latitude', t('admin.sc.edit.latitude'), false, '6.5244')}
          {editField('longitude', t('admin.sc.edit.longitude'), false, '3.3792')}

          <div className="field field-wide">
            <label htmlFor="edit-sc-description">{t('admin.sc.form.notes')}</label>
            <textarea
              id="edit-sc-description"
              value={values.description}
              onChange={(e) => setValues({ ...values, description: e.target.value })}
              maxLength={2000}
            />
          </div>

          <div className="field">
            <label htmlFor="edit-sc-sortOrder">{t('admin.sc.edit.sortOrder')}</label>
            <input
              id="edit-sc-sortOrder"
              type="number"
              value={values.sortOrder}
              onChange={(e) => setValues({ ...values, sortOrder: e.target.value })}
            />
          </div>

          <div className="field">
            <label htmlFor="edit-sc-published">{t('admin.sc.edit.publication')}</label>
            <Select
              id="edit-sc-published"
              value={values.published ? 'true' : 'false'}
              onChange={(v) => setValues({ ...values, published: v === 'true' })}
              options={PUBLISH_OPTIONS}
              fullWidth
            />
          </div>

          <div className="field-wide">
            <button className="button">{t('admin.sc.edit.save')}</button>{' '}
            <button
              type="button"
              className="admin-action"
              onClick={() => {
                setEditing(null);
                setValues(null);
              }}
            >
              {t('admin.actions.cancel')}
            </button>
          </div>
        </form>
      )}
    </>
  );
}