'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from '@/lib/i18n/context';
import { Select } from '@/components/ui/select';

type Row = Record<string, unknown>;

type FieldDef = {
  key: string;
  labelKey: string;
  type?: 'textarea' | 'select';
  options?: string[];
  required?: boolean;
};

const fields: Record<string, FieldDef[]> = {
  'product-categories': [
    { key: 'name', labelKey: 'admin.cms.field.categoryName', required: true },
    { key: 'slug', labelKey: 'admin.cms.field.slug', required: true },
    { key: 'description', labelKey: 'admin.cms.field.description', type: 'textarea' },
  ],
  services: [
    { key: 'name', labelKey: 'admin.cms.field.serviceName', required: true },
    { key: 'slug', labelKey: 'admin.cms.field.slug', required: true },
    { key: 'summary', labelKey: 'admin.cms.field.summary' },
    { key: 'description', labelKey: 'admin.cms.field.description', type: 'textarea' },
  ],
  solutions: [
    { key: 'name', labelKey: 'admin.cms.field.solutionName', required: true },
    { key: 'slug', labelKey: 'admin.cms.field.slug', required: true },
    { key: 'summary', labelKey: 'admin.cms.field.summary' },
    { key: 'description', labelKey: 'admin.cms.field.description', type: 'textarea' },
  ],
  testimonials: [
    { key: 'name', labelKey: 'admin.cms.field.customerName', required: true },
    { key: 'role', labelKey: 'admin.cms.field.role' },
    { key: 'company', labelKey: 'admin.cms.field.company' },
    { key: 'quote', labelKey: 'admin.cms.field.testimonial', type: 'textarea', required: true },
  ],
  faqs: [
    { key: 'question', labelKey: 'admin.cms.field.question', type: 'textarea', required: true },
    { key: 'answer', labelKey: 'admin.cms.field.answer', type: 'textarea', required: true },
  ],
  resources: [
    { key: 'title', labelKey: 'admin.cms.field.resourceTitle', required: true },
    { key: 'slug', labelKey: 'admin.cms.field.slug', required: true },
    { key: 'summary', labelKey: 'admin.cms.field.summary', type: 'textarea' },
    { key: 'body', labelKey: 'admin.cms.field.articleContent', type: 'textarea' },
  ],
  media: [
    { key: 'kind', labelKey: 'admin.cms.field.mediaType', type: 'select', options: ['IMAGE', 'VIDEO', 'DOCUMENT'], required: true },
    { key: 'url', labelKey: 'admin.cms.field.mediaUrl', required: true },
    { key: 'title', labelKey: 'admin.cms.field.mediaTitle' },
    { key: 'alt', labelKey: 'admin.cms.field.mediaAlt' },
    { key: 'linkedRecord', labelKey: 'admin.cms.field.attachedRecord', type: 'select' },
  ],
};

const addKeys: Record<string, string> = {
  'product-categories': 'admin.cms.action.addCategory',
  services: 'admin.cms.action.addService',
  solutions: 'admin.cms.action.addSolution',
  testimonials: 'admin.cms.action.addTestimonial',
  faqs: 'admin.cms.action.addFaq',
  resources: 'admin.cms.action.addResource',
  media: 'admin.cms.action.addMedia',
};

type LinkOption = { value: string; label: string };
type ResourceResult = { items: Row[]; total: number; page: number; pageCount: number };

export function ContentManager({ collection }: { collection: string }) {
  const { t } = useTranslation();
  const [items, setItems] = useState<Row[]>([]);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [editing, setEditing] = useState<Row | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [createSelects, setCreateSelects] = useState<Record<string, string>>({});
  const [links, setLinks] = useState<LinkOption[]>([]);
  const [query, setQuery] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(
    async (signal?: AbortSignal) => {
      setLoading(true);
      setError('');
      const params = new URLSearchParams({ collection });
      if (collection === 'resources') {
        params.set('page', String(page));
        if (query.trim()) params.set('q', query.trim());
        if (stateFilter) params.set('state', stateFilter);
      }
      try {
        const response = await fetch(`/api/admin/content?${params}`, { signal });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error ?? t('admin.cms.error.load'));
        if (collection === 'resources') {
          const result = data as ResourceResult;
          setItems(result.items);
          setTotal(result.total);
          setPage(result.page);
          setPageCount(result.pageCount);
        } else {
          setItems(data);
        }
        if (collection === 'media') {
          const [productsResponse, projectsResponse] = await Promise.all([
            fetch('/api/admin/products', { signal }),
            fetch('/api/admin/projects', { signal }),
          ]);
          if (!productsResponse.ok || !projectsResponse.ok) {
            throw new Error(t('admin.cms.error.loadLinks'));
          }
          const [products, projects] = await Promise.all([
            productsResponse.json(),
            projectsResponse.json(),
          ]);
          setLinks([
            ...products.map((item: Row) => ({
              value: `product:${String(item.id)}`,
              label: `${t('admin.cms.label.product')} \u00B7 ${String(item.name)}`,
            })),
            ...projects.map((item: Row) => ({
              value: `project:${String(item.id)}`,
              label: `${t('admin.cms.label.project')} \u00B7 ${String(item.title)}`,
            })),
          ]);
        }
      } catch (reason) {
        if (reason instanceof Error && reason.name === 'AbortError') return;
        setError(reason instanceof Error ? reason.message : t('admin.cms.error.load'));
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    [collection, page, query, stateFilter],
  );

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(
      () => {
        void load(controller.signal);
      },
      collection === 'resources' && query ? 250 : 0,
    );
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [load, collection, query]);

  function mapLinkedRecord(value: string) {
    return value.startsWith('product:')
      ? { productId: value.slice(8), projectId: null }
      : value.startsWith('project:')
        ? { productId: null, projectId: value.slice(8) }
        : { productId: null, projectId: null };
  }

  function defaultSelectValue(field: FieldDef): string {
    if (field.key === 'linkedRecord') return '';
    return field.options?.[0] ?? '';
  }

  async function create(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    setError('');
    const data = Object.fromEntries(new FormData(formElement).entries());
    const { linkedRecord, ...rest } = data;
    const payload = {
      collection,
      ...rest,
      ...(collection === 'media' ? mapLinkedRecord(String(linkedRecord ?? '')) : {}),
    };
    try {
      const response = await fetch('/api/admin/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? t('admin.cms.error.save'));
      formElement.reset();
      setCreateSelects({});
      setNotice(t('admin.cms.notice.saved'));
      setPage(1);
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : t('admin.cms.error.save'));
    }
  }

  function startEdit(row: Row) {
    setEditing(row);
    const next = Object.fromEntries(
      fields[collection].map((field) => [field.key, String(row[field.key] ?? '')]),
    );
    if (collection === 'media') {
      next.linkedRecord = row.productId
        ? `product:${String(row.productId)}`
        : row.projectId
          ? `project:${String(row.projectId)}`
          : '';
    }
    setValues(next);
    setError('');
  }

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editing) return;
    const { linkedRecord, ...rest } = values;
    const payload = {
      collection,
      id: editing.id,
      ...rest,
      ...(collection === 'media'
        ? mapLinkedRecord(linkedRecord ?? '')
        : { published: editing.published }),
    };
    try {
      const response = await fetch('/api/admin/content', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? t('admin.cms.error.update'));
      setEditing(null);
      setNotice(t('admin.cms.notice.updated'));
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : t('admin.cms.error.update'));
    }
  }

  async function publish(row: Row) {
    const response = await fetch('/api/admin/content', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ collection, id: row.id, published: !row.published }),
    });
    if (response.ok) await load();
    else setError((await response.json()).error ?? t('admin.cms.error.publish'));
  }

  async function remove(row: Row) {
    const label = String(
      row.name ?? row.title ?? row.question ?? row.url ?? 'this record',
    );
    if (!window.confirm(`${t('admin.cms.confirm.delete')} ${label}?`)) return;
    const response = await fetch('/api/admin/content', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ collection, id: row.id }),
    });
    if (response.ok) await load();
    else setError((await response.json()).error ?? t('admin.cms.error.delete'));
  }

  const linkedRecordOptions = useMemo<LinkOption[]>(
    () => [
      { value: '', label: t('admin.cms.option.notAttached') },
      ...links,
    ],
    [links, t],
  );

  const stateOptions = useMemo(
    () => [
      { value: '', label: t('admin.cms.option.allRecords') },
      { value: 'PUBLISHED', label: t('admin.cms.option.published') },
      { value: 'DRAFT', label: t('admin.cms.option.draft') },
    ],
    [t],
  );

  function renderField(
    field: FieldDef,
    value?: string,
    onChange?: (value: string) => void,
    mode: 'create' | 'edit' = 'create',
  ) {
    const id = `${mode === 'edit' ? 'edit-' : ''}${field.key}`;
    return (
      <div
        className={`field ${field.type === 'textarea' ? 'field-wide' : ''}`}
        key={id}
      >
        <label htmlFor={id}>
          {t(field.labelKey)}
          {field.required ? ' *' : ''}
        </label>
        {field.type === 'textarea' ? (
          <textarea
            id={id}
            name={field.key}
            required={field.required}
            value={value}
            onChange={
              onChange ? (event) => onChange(event.target.value) : undefined
            }
          />
        ) : field.type === 'select' ? (
          field.key === 'linkedRecord' ? (
            <Select
              id={id}
              name={field.key}
              value={value ?? ''}
              onChange={onChange ?? (() => undefined)}
              options={linkedRecordOptions}
              fullWidth
            />
          ) : (
            <Select
              id={id}
              name={field.key}
              value={value ?? field.options?.[0] ?? ''}
              onChange={onChange ?? (() => undefined)}
              options={(field.options ?? []).map((o) => ({ value: o, label: o }))}
              fullWidth
            />
          )
        ) : (
          <input
            id={id}
            name={field.key}
            maxLength={field.key === 'url' ? 2000 : 500}
            required={field.required}
            value={value}
            onChange={
              onChange ? (event) => onChange(event.target.value) : undefined
            }
          />
        )}
      </div>
    );
  }

  return (
    <>
      <form onSubmit={create} className="form-grid" style={{ marginBottom: 0 }}>
        {fields[collection].map((field) => {
          if (field.type === 'select') {
            const v =
              createSelects[field.key] ?? defaultSelectValue(field);
            return renderField(field, v, (next) =>
              setCreateSelects((prev) => ({ ...prev, [field.key]: next })),
            );
          }
          return renderField(field);
        })}
        <div className="field-wide" style={{ marginBottom: 0 }}>
          <button className="button" type="submit">
            {t(addKeys[collection])}
          </button>
        </div>
      </form>

      {notice && (
        <p
          role="status"
          className="form-note"
          style={{
            display: 'block',
            marginTop: '1rem',
            marginBottom: 0,
            position: 'static',
          }}
        >
          {notice}
        </p>
      )}

      {error && (
        <div
          role="alert"
          className="form-error"
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: '0.75rem',
            marginTop: '1rem',
            marginBottom: 0,
            position: 'static',
            clear: 'both',
          }}
        >
          <span style={{ flex: '1 1 auto' }}>{error}</span>
          <button
            type="button"
            className="admin-action"
            onClick={() => void load()}
            style={{ flex: '0 0 auto' }}
          >
            {t('admin.cms.action.retry')}
          </button>
        </div>
      )}

      <h2 style={{ fontSize: '1.8rem', marginTop: '3rem' }}>
        {t('admin.cms.header.records')}
      </h2>

      {collection === 'resources' && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(240px, 1fr) minmax(180px, 220px)',
            gap: '16px',
            alignItems: 'end',
            marginBottom: '1.25rem',
          }}
        >
          <div className="field" style={{ marginBottom: 0 }}>
            <label htmlFor="resource-search">{t('admin.cms.search.title')}</label>
            <input
              id="resource-search"
              type="search"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setPage(1);
              }}
              placeholder={t('admin.cms.search.placeholder')}
              maxLength={120}
            />
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label htmlFor="resource-state">{t('admin.cms.filter.publication')}</label>
            <Select
              id="resource-state"
              value={stateFilter}
              onChange={(v) => {
                setStateFilter(v);
                setPage(1);
              }}
              options={stateOptions}
              fullWidth
            />
          </div>
        </div>
      )}

      {collection === 'resources' && (
        <p className="form-note" aria-live="polite">
          {total}{' '}
          {total === 1
            ? t('admin.cms.count.resource')
            : t('admin.cms.count.resources')}
          {loading ? ` \u00B7 ${t('admin.cms.state.loading')}` : ''}
        </p>
      )}

      {items.length ? (
        <div style={{ overflowX: 'auto' }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>{t('admin.cms.header.entry')}</th>
                <th>{t('admin.cms.header.state')}</th>
                <th>{t('admin.cms.header.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {items.map((row) => (
                <tr key={String(row.id)}>
                  <td>
                    <strong>
                      {String(row.name ?? row.title ?? row.question ?? row.url ?? '')}
                    </strong>
                    <br />
                    <span className="form-note">
                      {String(row.slug ?? row.summary ?? row.alt ?? '')}
                    </span>
                  </td>
                  <td>
                    {collection === 'media'
                      ? t('admin.cms.state.mediaLibrary')
                      : row.published
                        ? t('admin.cms.option.published')
                        : t('admin.cms.option.draft')}
                  </td>
                  <td>
                    {collection !== 'media' && (
                      <button
                        className="admin-action"
                        onClick={() => void publish(row)}
                      >
                        {row.published
                          ? t('admin.cms.action.unpublish')
                          : t('admin.cms.action.publish')}
                      </button>
                    )}{' '}
                    <button
                      className="admin-action"
                      onClick={() => startEdit(row)}
                    >
                      {t('admin.cms.action.edit')}
                    </button>{' '}
                    <button
                      className="admin-action"
                      onClick={() => void remove(row)}
                    >
                      {t('admin.cms.action.delete')}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="form-note">
          {loading
            ? t('admin.cms.state.loadingRecords')
            : collection === 'resources' && (query || stateFilter)
              ? t('admin.cms.empty.filteredResources')
              : t('admin.cms.empty.noRecords')}
        </p>
      )}

      {collection === 'resources' && pageCount > 1 && (
        <nav
          className="pagination"
          aria-label={t('aria.pagination.resources')}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            marginTop: '1.5rem',
          }}
        >
          <button
            className="admin-action"
            disabled={page <= 1 || loading}
            onClick={() => setPage((value) => Math.max(1, value - 1))}
          >
            {t('admin.cms.pagination.previous')}
          </button>
          <span className="form-note">
            {page} / {pageCount}
          </span>
          <button
            className="admin-action"
            disabled={page >= pageCount || loading}
            onClick={() => setPage((value) => Math.min(pageCount, value + 1))}
          >
            {t('admin.cms.pagination.next')}
          </button>
        </nav>
      )}

      {editing && (
        <form onSubmit={save} className="form-grid edit-panel">
          <div className="field-wide">
            <p className="eyebrow">{t('admin.cms.header.editRecord')}</p>
            <h2 style={{ fontSize: '1.7rem' }}>
              {String(
                editing.name ?? editing.title ?? editing.question ?? editing.url ?? '',
              )}
            </h2>
          </div>
          {fields[collection].map((field) =>
            renderField(
              field,
              values[field.key],
              (value) =>
                setValues((current) => ({ ...current, [field.key]: value })),
              'edit',
            ),
          )}
          <div className="field-wide">
            <button className="button">{t('admin.cms.action.saveChanges')}</button>{' '}
            <button
              type="button"
              className="admin-action"
              onClick={() => setEditing(null)}
            >
              {t('admin.cms.action.cancel')}
            </button>
          </div>
        </form>
      )}
    </>
  );
}