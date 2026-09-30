'use client';

import { useCallback, useEffect, useState } from 'react';

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

const TYPES = ['Service Centre', 'Pickup Point', 'Both'] as const;

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
  const [items, setItems] = useState<Centre[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [editing, setEditing] = useState<Centre | null>(null);
  const [values, setValues] = useState<EditValues | null>(null);
  const [query, setQuery] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/service-centres');
      const data = await res.json();
      if (!res.ok) throw new Error((data as { error?: string }).error ?? 'Could not load locations.');
      setItems(data as Centre[]);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not load locations.');
    } finally {
      setLoading(false);
    }
  }, []);

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
      type: String(data.get('type') ?? 'Service Centre'),
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
      if (!res.ok) throw new Error((body as { error?: string }).error ?? 'Could not save location.');
      form.reset();
      setMessage('Location saved as draft.');
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not save location.');
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
      if (!res.ok) throw new Error((body as { error?: string }).error ?? 'Could not update.');
      setEditing(null);
      setValues(null);
      setMessage('Location updated.');
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not update.');
    }
  }

  async function toggle(item: Centre) {
    const res = await fetch('/api/admin/service-centres/' + item.id, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ published: !item.published }),
    });
    if (res.ok) await load();
    else setError('Could not change publish status.');
  }

  async function remove(item: Centre) {
    if (!window.confirm('Delete "' + item.name + '"? This cannot be undone.')) return;
    const res = await fetch('/api/admin/service-centres/' + item.id, { method: 'DELETE' });
    if (res.ok) {
      setMessage('Location deleted.');
      await load();
    } else setError('Could not delete.');
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
          <label htmlFor="sc-name">Location name</label>
          <input name="name" id="sc-name" required maxLength={160} placeholder="Lura Chain Store Ikeja" />
        </div>
        <div className="field">
          <label htmlFor="sc-slug">URL slug</label>
          <input name="slug" id="sc-slug" maxLength={180} placeholder="auto-generated if empty" />
          <span className="form-note">Leave blank to auto-generate from the name.</span>
        </div>
        <div className="field">
          <label htmlFor="sc-type">Type</label>
          <select id="sc-type" name="type" defaultValue="Service Centre">
            {TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="sc-city">City</label>
          <input name="city" id="sc-city" required maxLength={120} />
        </div>
        <div className="field">
          <label htmlFor="sc-state">State</label>
          <input name="state" id="sc-state" maxLength={120} placeholder="Lagos" />
        </div>
        <div className="field">
          <label htmlFor="sc-phone">Phone</label>
          <input name="phone" id="sc-phone" maxLength={60} placeholder="+234..." />
        </div>
        <div className="field field-wide">
          <label htmlFor="sc-address">Street address</label>
          <input name="address" id="sc-address" required maxLength={400} />
        </div>
        <div className="field">
          <label htmlFor="sc-email">Email</label>
          <input name="email" id="sc-email" type="email" maxLength={180} />
        </div>
        <div className="field">
          <label htmlFor="sc-hours">Opening hours</label>
          <input name="hours" id="sc-hours" maxLength={200} placeholder="Mon-Sat, 8am-6pm" />
        </div>
        <div className="field field-wide">
          <label htmlFor="sc-description">Notes (optional)</label>
          <textarea name="description" id="sc-description" maxLength={2000} />
        </div>
        <div className="field-wide">
          <button className="button" disabled={busy}>
            {busy ? 'Saving...' : 'Add draft location'}
          </button>
        </div>
      </form>

      {error && (
        <p className="form-error" role="alert">
          {error} <button type="button" className="admin-action" onClick={() => void load()}>Retry</button>
        </p>
      )}
      {message && <p className="form-note" role="status">{message}</p>}

      <h2 style={{ fontSize: '1.6rem', margin: '3rem 0 1rem' }}>Locations</h2>

      <div className="field" style={{ maxWidth: '420px', marginBottom: '1rem' }}>
        <label htmlFor="sc-search">Search locations</label>
        <input
          id="sc-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Name, city, state..."
        />
      </div>

      <p className="form-note" aria-live="polite">
        {visible.length} {visible.length === 1 ? 'location' : 'locations'}
        {loading ? ' - Loading...' : ''}
      </p>

      {visible.length > 0 ? (
        <div style={{ overflowX: 'auto' }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
                <th>Location</th>
                <th>Contact</th>
                <th>State</th>
                <th>Actions</th>
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
                  <td>{c.type ?? '-'}</td>
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
                  <td>{c.published ? 'Published' : 'Draft'}</td>
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
                        Edit
                      </button>
                      <button
                        type="button"
                        className="admin-action admin-action--primary"
                        onClick={() => void toggle(c)}
                      >
                        {c.published ? 'Unpublish' : 'Publish'}
                      </button>
                      <button
                        type="button"
                        className="admin-action admin-action--danger"
                        onClick={() => void remove(c)}
                      >
                        Delete
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
            ? 'Loading locations...'
            : query
              ? 'No locations match that search.'
              : 'No locations have been entered yet.'}
        </p>
      )}

      {editing && values && (
        <form onSubmit={save} className="form-grid edit-panel">
          <div className="field-wide">
            <p className="eyebrow">Edit location</p>
            <h2 style={{ fontSize: '1.6rem' }}>{editing.name}</h2>
          </div>

          {editField('name', 'Name')}
          {editField('slug', 'Slug')}

          <div className="field">
            <label htmlFor="edit-sc-type">Type</label>
            <select
              id="edit-sc-type"
              value={values.type}
              onChange={(e) => setValues({ ...values, type: e.target.value })}
            >
              {TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {editField('city', 'City')}
          {editField('state', 'State')}
          {editField('address', 'Street address', true)}
          {editField('phone', 'Phone')}
          {editField('email', 'Email')}
          {editField('hours', 'Opening hours')}
          {editField('latitude', 'Latitude', false, '6.5244')}
          {editField('longitude', 'Longitude', false, '3.3792')}

          <div className="field field-wide">
            <label htmlFor="edit-sc-description">Notes</label>
            <textarea
              id="edit-sc-description"
              value={values.description}
              onChange={(e) => setValues({ ...values, description: e.target.value })}
              maxLength={2000}
            />
          </div>

          <div className="field">
            <label htmlFor="edit-sc-sortOrder">Sort order</label>
            <input
              id="edit-sc-sortOrder"
              type="number"
              value={values.sortOrder}
              onChange={(e) => setValues({ ...values, sortOrder: e.target.value })}
            />
          </div>

          <div className="field">
            <label htmlFor="edit-sc-published">Publication</label>
            <select
              id="edit-sc-published"
              value={values.published ? 'true' : 'false'}
              onChange={(e) => setValues({ ...values, published: e.target.value === 'true' })}
            >
              <option value="false">Draft</option>
              <option value="true">Published</option>
            </select>
          </div>

          <div className="field-wide">
            <button className="button">Save changes</button>{' '}
            <button
              type="button"
              className="admin-action"
              onClick={() => { setEditing(null); setValues(null); }}
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </>
  );
}