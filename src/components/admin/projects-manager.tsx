'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from '@/lib/i18n/context';
import { Select } from '@/components/ui/select';
import { MediaDropzone, type ProductMedia } from '@/components/admin/media-dropzone';

type Item = {
  id: string;
  title: string;
  slug: string;
  category: string | null;
  location: string | null;
  description: string | null;
  systemCapacity: string | null;
  published: boolean;
  featured: boolean;
  media?: ProductMedia[];
};
type Values = Omit<Item, 'id' | 'published' | 'media' | 'featured'>;
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
  const [editingMedia, setEditingMedia] = useState<ProductMedia[]>([]);
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
      closeEdit();
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

  async function toggleFeatured(x: Item) {
    const r = await fetch(`/api/admin/projects/${x.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ featured: !x.featured }),
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
    setEditingMedia(x.media ?? []);
    setValues({
      title: x.title,
      slug: x.slug,
      category: x.category ?? '',
      location: x.location ?? '',
      description: x.description ?? '',
      systemCapacity: x.systemCapacity ?? '',
    });
  }

  function closeEdit() {
    setEditing(null);
    setEditingMedia([]);
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
        <input name="category" maxLength={100} defaultValue={value?.category ?? ''} />
      </div>
      <div className="field">
        <label>{t('admin.proj.form.location')}</label>
        <input name="location" maxLength={160} defaultValue={value?.location ?? ''} />
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

  const categoryOptions = useMemo(
    () =>
      result.categories.map((c) => ({
        value: c,
        label: c,
      })),
    [result.categories],
  );

  const stateOptions = useMemo(
    () => [
      { value: '', label: t('admin.proj.list.allRecords') },
      { value: 'PUBLISHED', label: t('admin.proj.list.published') },
      { value: 'DRAFT', label: t('admin.proj.list.draft') },
    ],
    [t],
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

      <h2 style={{ fontSize: '1.8rem', margin: '3rem 0 1.5rem' }}>
        {t('admin.proj.list.title')}
      </h2>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(220px, 1fr) auto auto',
          gap: '16px',
          alignItems: 'end',
          marginBottom: '1.25rem',
        }}
      >
        <div className="field" style={{ marginBottom: 0 }}>
          <label htmlFor="proj-search">{t('admin.proj.list.search')}</label>
          <input
            id="proj-search"
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            placeholder={t('admin.proj.list.searchPlaceholder')}
          />
        </div>
        <div className="field" style={{ marginBottom: 0, minWidth: '200px' }}>
          <label htmlFor="proj-category-filter">{t('admin.proj.form.category')}</label>
          <Select
            id="proj-category-filter"
            value={category}
            onChange={(v) => {
              setCategory(v);
              setPage(1);
            }}
            options={categoryOptions}
            placeholder={t('admin.prod.list.allCategories')}
            fullWidth
          />
        </div>
        <div className="field" style={{ marginBottom: 0, minWidth: '180px' }}>
          <label htmlFor="proj-state-filter">{t('admin.proj.list.state')}</label>
          <Select
            id="proj-state-filter"
            value={state}
            onChange={(v) => {
              setState(v);
              setPage(1);
            }}
            options={stateOptions}
            fullWidth
          />
        </div>
      </div>

      <p aria-live="polite" className="form-note" style={{ marginBottom: '1rem' }}>
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
                        className={
                          'admin-action' +
                          (x.featured ? ' admin-action--featured' : '')
                        }
                        onClick={() => void toggleFeatured(x)}
                      >
                        {x.featured
                          ? t('admin.actions.unfeature')
                          : t('admin.actions.feature')}
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

      {result.pageCount > 1 && (
        <nav
          aria-label={t('aria.pagination.projects')}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            marginTop: '1.5rem',
          }}
        >
          <button
            type="button"
            className="admin-action"
            disabled={page <= 1 || loading}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            {t('admin.cms.pagination.previous')}
          </button>
          <span className="form-note">
            {result.page} / {result.pageCount}
          </span>
          <button
            type="button"
            className="admin-action"
            disabled={page >= result.pageCount || loading}
            onClick={() => setPage((p) => Math.min(result.pageCount, p + 1))}
          >
            {t('admin.cms.pagination.next')}
          </button>
        </nav>
      )}

      {editing && (
        <form className="form-grid edit-panel" onSubmit={save}>
          <div className="field-wide">
            <p className="eyebrow">{t('admin.proj.edit.title')}</p>
          </div>
          {fields(values)}
          <div className="field-wide">
            <label>{t('admin.proj.form.images')}</label>
            <MediaDropzone
              projectId={editing}
              initial={editingMedia}
              onChanged={setEditingMedia}
            />
          </div>
          <div className="field-wide">
            <button className="button">{t('admin.proj.edit.save')}</button>{' '}
            <button type="button" className="admin-action" onClick={closeEdit}>
              {t('admin.actions.cancel')}
            </button>
          </div>
        </form>
      )}
    </>
  );
}