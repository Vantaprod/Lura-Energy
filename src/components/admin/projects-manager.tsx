'use client';

import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from '@/lib/i18n/context';

type Item = {
  id: string;
  title: string;
  slug: string;
  category: string | null;
  location: string | null;
  description: string | null;
  systemCapacity: string | null;
  published: boolean;
};
type Values = Omit<Item, 'id' | 'published'>;
type Result = {
  items: Item[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
  categories: string[];
};

const empty: Values = {
  title: '',
  slug: '',
  category: '',
  location: '',
  description: '',
  systemCapacity: '',
};

export function ProjectsManager() {
  const { t } = useTranslation();
  const [result, setResult] = useState<Result>({
    items: [],
    total: 0,
    page: 1,
    pageSize: 20,
    pageCount: 1,
    categories: [],
  });
  const [error, setError] = useState('');
  const [values, setValues] = useState<Values>(empty);
  const [editing, setEditing] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [category, setCategory] = useState('');
  const [state, setState] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(query.trim()), 250);
    return () => window.clearTimeout(timer);
  }, [query]);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ page: String(page) });
      if (debouncedQuery) params.set('q', debouncedQuery);
      if (category) params.set('category', category);
      if (state) params.set('state', state);
      const r = await fetch(`/api/admin/projects?${params}`);
      if (!r.ok) {
        throw new Error(
          (await r.json().catch(() => ({}))).error ?? t('admin.proj.error.load'),
        );
      }
      setResult(await r.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : t('admin.proj.error.load'));
    } finally {
      setLoading(false);
    }
  }, [page, debouncedQuery, category, state, t]);

  useEffect(() => {
    void load();
  }, [load]);

  function fromForm(form: HTMLFormElement) {
    const f = new FormData(form);
    return Object.fromEntries(f.entries());
  }

  async function add(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const r = await fetch('/api/admin/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...fromForm(form), published: false }),
    });
    if (r.ok) {
      form.reset();
      setError('');
      setPage(1);
      await load();
    } else {
      setError((await r.json()).error ?? t('admin.actions.saveFailed'));
    }
  }

  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editing) return;
    const r = await fetch(`/api/admin/projects/${editing}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fromForm(e.currentTarget)),
    });
    if (r.ok) {
      setEditing(null);
      setError('');
      await load();
    } else {
      setError((await r.json()).error ?? t('admin.proj.error.update'));
    }
  }

  async function toggle(x: Item) {
    const r = await fetch(`/api/admin/projects/${x.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ published: !x.published }),
    });
    if (r.ok) await load();
    else setError((await r.json()).error ?? t('admin.proj.error.publish'));
  }

  async function remove(x: Item) {
    if (!window.confirm(t('admin.actions.confirmDelete'))) return;
    const r = await fetch(`/api/admin/projects/${x.id}`, { method: 'DELETE' });
    if (r.ok) await load();
    else setError((await r.json()).error ?? t('admin.proj.error.delete'));
  }

  function edit(x: Item) {
    setEditing(x.id);
    setValues({
      title: x.title,
      slug: x.slug,
      category: x.category ?? '',
      location: x.location ?? '',
      description: x.description ?? '',
      systemCapacity: x.systemCapacity ?? '',
    });
  }

  const fields = (value?: Values) => (
    <>
      <div className="field">
        <label>{t('admin.proj.form.title')}</label>
        <input name="title" required maxLength={180} defaultValue={value?.title} />
      </div>
      <div className="field">
        <label>{t('admin.proj.form.slug')}</label>
        <input
          name="slug"
          pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
          required
          defaultValue={value?.slug}
        />
      </div>
      <div className="field">
        <label>{t('admin.proj.form.category')}</label>
        <input
          name="category"
          maxLength={100}
          defaultValue={value?.category ?? ''}
        />
      </div>
      <div className="field">
        <label>{t('admin.proj.form.location')}</label>
        <input
          name="location"
          maxLength={160}
          defaultValue={value?.location ?? ''}
        />
      </div>
      <div className="field field-wide">
        <label>{t('admin.proj.form.description')}</label>
        <textarea
          name="description"
          maxLength={12000}
          defaultValue={value?.description ?? ''}
        />
      </div>
      <div className="field">
        <label>{t('admin.proj.form.capacity')}</label>
        <input
          name="systemCapacity"
          maxLength={100}
          defaultValue={value?.systemCapacity ?? ''}
        />
      </div>
    </>
  );

  return (
    <>
      <form className="form-grid" onSubmit={add}>
        {fields()}
        <div className="field-wide">
          <button className="button">{t('admin.proj.form.submit')}</button>
        </div>
      </form>

      {error && (
        <p role="alert" className="form-error">
          {error}{' '}
          <button type="button" className="admin-action" onClick={() => void load()}>
            {t('admin.actions.retry')}
          </button>
        </p>
      )}

      <h2 style={{ fontSize: '1.8rem', marginTop: '3rem' }}>
        {t('admin.proj.list.title')}
      </h2>

      <div className="lead-filters">
        <label>
          {t('admin.proj.list.search')}
          <input
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            placeholder={t('admin.proj.list.searchPlaceholder')}
          />
        </label>
        <label>
          {t('admin.proj.form.category')}
          <select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setPage(1);
            }}
          >
            <option value="">{t('admin.proj.list.allCategories') || 'All categories'}</option>
            {result.categories.map((x) => (
              <option key={x} value={x}>
                {x}
              </option>
            ))}
          </select>
        </label>
        <label>
          {t('admin.proj.list.state')}
          <select
            value={state}
            onChange={(e) => {
              setState(e.target.value);
              setPage(1);
            }}
          >
            <option value="">{t('admin.proj.list.allRecords')}</option>
            <option value="PUBLISHED">{t('admin.proj.list.published')}</option>
            <option value="DRAFT">{t('admin.proj.list.draft')}</option>
          </select>
        </label>
      </div>

      <p aria-live="polite" className="form-note">
        {loading
          ? t('admin.proj.list.loading')
          : `${result.total} ${
              result.total === 1
                ? t('admin.proj.list.countOne')
                : t('admin.proj.list.countMany')
            }`}
      </p>

      {result.items.length ? (
        <div style={{ overflowX: 'auto' }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>{t('admin.proj.list.colTitle')}</th>
                <th>{t('admin.proj.list.colLocation')}</th>
                <th>{t('admin.proj.list.colState')}</th>
                <th>{t('admin.proj.list.colActions')}</th>
              </tr>
            </thead>
            <tbody>
              {result.items.map((x) => (
                <tr key={x.id}>
                  <td>{x.title}</td>
                  <td>{x.location}</td>
                  <td>
                    {x.published
                      ? t('admin.proj.list.published')
                      : t('admin.proj.list.draft')}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        className="admin-action admin-action--edit"
                        onClick={() => edit(x)}
                      >
                        {t('admin.actions.edit')}
                      </button>
                      <button
                        type="button"
                        className="admin-action admin-action--primary"
                        onClick={() => void toggle(x)}
                      >
                        {x.published
                          ? t('admin.actions.unpublish')
                          : t('admin.actions.publish')}
                      </button>
                      <button
                        type="button"
                        className="admin-action admin-action--danger"
                        onClick={() => void remove(x)}
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
        !loading && (
          <p className="form-note">
            {query || category || state
              ? t('admin.proj.list.noMatch')
              : t('admin.proj.list.empty')}
          </p>
        )
      )}

      <nav aria-label={t('aria.pagination.projects')} className="pagination">
        <button
          type="button"
          className="admin-action"
          disabled={page <= 1 || loading}
          onClick={() => setPage((p) => p - 1)}
        >
          {'\u2190'}
        </button>
        <span>
          {result.page} / {result.pageCount}
        </span>
        <button
          type="button"
          className="admin-action"
          disabled={page >= result.pageCount || loading}
          onClick={() => setPage((p) => p + 1)}
        >
          {'\u2192'}
        </button>
      </nav>

      {editing && (
        <form className="form-grid edit-panel" onSubmit={save}>
          <div className="field-wide">
            <p className="eyebrow">{t('admin.proj.edit.title')}</p>
          </div>
          {fields(values)}
          <div className="field-wide">
            <button className="button">{t('admin.proj.edit.save')}</button>{' '}
            <button
              type="button"
              className="admin-action"
              onClick={() => setEditing(null)}
            >
              {t('admin.actions.cancel')}
            </button>
          </div>
        </form>
      )}
    </>
  );
}