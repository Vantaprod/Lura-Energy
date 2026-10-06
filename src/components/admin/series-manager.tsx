'use client';

import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from '@/lib/i18n/context';

type Category = {
  id: string;
  name: string;
  slug: string;
  summary: string | null;
  description: string | null;
  coverUrl: string | null;
  coverAlt: string | null;
  sortOrder: number;
  published: boolean;
};

type Values = {
  name: string;
  slug: string;
  summary: string;
  description: string;
  coverUrl: string;
  coverAlt: string;
  sortOrder: string;
};

type MediaItem = { id: string; url: string; alt: string | null; kind: string };

const empty: Values = {
  name: '',
  slug: '',
  summary: '',
  description: '',
  coverUrl: '',
  coverAlt: '',
  sortOrder: '0',
};

const toValues = (c: Category): Values => ({
  name: c.name,
  slug: c.slug,
  summary: c.summary ?? '',
  description: c.description ?? '',
  coverUrl: c.coverUrl ?? '',
  coverAlt: c.coverAlt ?? '',
  sortOrder: String(c.sortOrder ?? 0),
});

export function SeriesManager() {
  const { t } = useTranslation();
  const [items, setItems] = useState<Category[]>([]);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [values, setValues] = useState<Values>(empty);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [catsRes, mediaRes] = await Promise.all([
        fetch('/api/admin/content?collection=product-categories'),
        fetch('/api/admin/media').catch(() => null),
      ]);
      if (!catsRes.ok) throw new Error(t('admin.series.error.load'));
      setItems(await catsRes.json());
      if (mediaRes && mediaRes.ok) {
        const mediaData = await mediaRes.json();
        const images: MediaItem[] = Array.isArray(mediaData.items)
          ? mediaData.items.filter((m: MediaItem) => m.kind === 'IMAGE')
          : [];
        setMedia(images);
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : t('admin.series.error.load'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void load();
  }, [load]);

  async function create(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const response = await fetch('/api/admin/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          collection: 'product-categories',
          name: values.name,
          slug: values.slug,
          summary: values.summary || undefined,
          description: values.description || undefined,
          coverUrl: values.coverUrl || undefined,
          coverAlt: values.coverAlt || undefined,
          sortOrder: Number(values.sortOrder) || 0,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? t('admin.series.error.save'));
      setNotice(t('admin.series.notice.saved'));
      setValues(empty);
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : t('admin.series.error.save'));
    } finally {
      setBusy(false);
    }
  }

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editing) return;
    setError('');
    setNotice('');
    try {
      const response = await fetch('/api/admin/content', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          collection: 'product-categories',
          id: editing.id,
          name: values.name,
          slug: values.slug,
          summary: values.summary || undefined,
          description: values.description || undefined,
          coverUrl: values.coverUrl || undefined,
          coverAlt: values.coverAlt || undefined,
          sortOrder: Number(values.sortOrder) || 0,
          published: editing.published,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? t('admin.series.error.update'));
      setNotice(t('admin.series.notice.updated'));
      setEditing(null);
      setValues(empty);
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : t('admin.series.error.update'));
    }
  }

  async function toggle(item: Category) {
    const response = await fetch('/api/admin/content', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        collection: 'product-categories',
        id: item.id,
        published: !item.published,
      }),
    });
    if (response.ok) await load();
    else setError(t('admin.series.error.publish'));
  }

  async function remove(item: Category) {
    if (!window.confirm(`${t('admin.series.confirm.delete')} ${item.name}?`)) return;
    const response = await fetch('/api/admin/content', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ collection: 'product-categories', id: item.id }),
    });
    if (response.ok) await load();
    else setError(t('admin.series.error.delete'));
  }

  const previewUrl = values.coverUrl.trim();

  return (
    <>
      <form className="form-grid" onSubmit={editing ? save : create}>
        <div className="field">
          <label htmlFor="series-name">{t('admin.series.form.name')}</label>
          <input
            id="series-name"
            required
            maxLength={140}
            value={values.name}
            onChange={(e) => setValues({ ...values, name: e.target.value })}
          />
        </div>
        <div className="field">
          <label htmlFor="series-slug">{t('admin.series.form.slug')}</label>
          <input
            id="series-slug"
            required
            pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
            value={values.slug}
            onChange={(e) => setValues({ ...values, slug: e.target.value })}
          />
        </div>
        <div className="field">
          <label htmlFor="series-sort">{t('admin.series.form.sortOrder')}</label>
          <input
            id="series-sort"
            type="number"
            min="0"
            max="9999"
            value={values.sortOrder}
            onChange={(e) => setValues({ ...values, sortOrder: e.target.value })}
          />
        </div>
        <div className="field">
          <label htmlFor="series-cover-alt">{t('admin.series.form.coverAlt')}</label>
          <input
            id="series-cover-alt"
            maxLength={200}
            value={values.coverAlt}
            onChange={(e) => setValues({ ...values, coverAlt: e.target.value })}
          />
        </div>
        <div className="field field-wide">
          <label htmlFor="series-summary">{t('admin.series.form.summary')}</label>
          <input
            id="series-summary"
            maxLength={500}
            value={values.summary}
            onChange={(e) => setValues({ ...values, summary: e.target.value })}
          />
        </div>
        <div className="field field-wide">
          <label htmlFor="series-description">{t('admin.series.form.description')}</label>
          <textarea
            id="series-description"
            maxLength={4000}
            value={values.description}
            onChange={(e) => setValues({ ...values, description: e.target.value })}
          />
        </div>

        <div className="field field-wide">
          <label htmlFor="series-cover">{t('admin.series.form.coverUrl')}</label>
          <select
            id="series-cover"
            value={media.some((m) => m.url === values.coverUrl) ? values.coverUrl : ''}
            onChange={(e) => {
              if (e.target.value) setValues({ ...values, coverUrl: e.target.value });
            }}
            style={{ marginBottom: '0.5rem' }}
          >
            <option value="">{t('admin.series.form.coverPick')}</option>
            {media.map((m) => (
              <option key={m.id} value={m.url}>
                {m.alt ?? m.url.split('/').pop()}
              </option>
            ))}
          </select>
          <input
            type="text"
            value={values.coverUrl}
            onChange={(e) => setValues({ ...values, coverUrl: e.target.value })}
            placeholder={t('admin.series.form.coverPlaceholder')}
          />
          {previewUrl && (
            <img
              src={previewUrl}
              alt=""
              style={{
                marginTop: '0.75rem',
                maxWidth: '300px',
                borderRadius: '8px',
                border: '1px solid var(--line)',
              }}
            />
          )}
        </div>

        <div className="field-wide">
          <button className="button" disabled={busy}>
            {busy
              ? t('admin.actions.saving')
              : editing
                ? t('admin.series.action.save')
                : t('admin.series.action.add')}
          </button>
          {editing && (
            <>
              {' '}
              <button
                type="button"
                className="admin-action"
                onClick={() => {
                  setEditing(null);
                  setValues(empty);
                }}
              >
                {t('admin.actions.cancel')}
              </button>
            </>
          )}
        </div>
      </form>

      {notice && <p role="status" className="form-note">{notice}</p>}
      {error && (
        <p role="alert" className="form-error">
          {error}{' '}
          <button type="button" className="admin-action" onClick={() => void load()}>
            {t('admin.actions.retry')}
          </button>
        </p>
      )}

      <h2 style={{ fontSize: '1.8rem', marginTop: '3rem' }}>
        {t('admin.series.list.title')}
      </h2>

      {loading ? (
        <p className="form-note">{t('admin.series.list.loading')}</p>
      ) : items.length === 0 ? (
        <p className="form-note">{t('admin.series.list.empty')}</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>{t('admin.series.list.colCover')}</th>
                <th>{t('admin.series.list.colName')}</th>
                <th>{t('admin.series.list.colSort')}</th>
                <th>{t('admin.series.list.colState')}</th>
                <th>{t('admin.series.list.colActions')}</th>
              </tr>
            </thead>
            <tbody>
              {items.map((c) => (
                <tr key={c.id}>
                  <td>
                    {c.coverUrl ? (
                      <img
                        src={c.coverUrl}
                        alt=""
                        style={{
                          width: '80px',
                          height: '54px',
                          objectFit: 'cover',
                          borderRadius: '4px',
                        }}
                      />
                    ) : (
                      <span className="form-note">-</span>
                    )}
                  </td>
                  <td>
                    <strong>{c.name}</strong>
                    <br />
                    <span className="form-note">{c.slug}</span>
                    {c.summary && (
                      <>
                        <br />
                        <span className="form-note">{c.summary}</span>
                      </>
                    )}
                  </td>
                  <td>{c.sortOrder}</td>
                  <td>
                    {c.published
                      ? t('admin.series.list.published')
                      : t('admin.series.list.draft')}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        className="admin-action admin-action--edit"
                        onClick={() => {
                          setEditing(c);
                          setValues(toValues(c));
                          window.scrollTo({ top: 0, behavior: 'smooth' });
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
      )}
    </>
  );
}