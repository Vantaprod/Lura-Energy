'use client';
import { useCallback, useEffect, useState } from 'react';
type Row = Record<string, unknown>;
type Field = { key: string; label: string; type?: 'textarea' | 'select'; options?: string[]; required?: boolean };
const fields: Record<string, Field[]> = {
  'product-categories': [{ key: 'name', label: 'Category name', required: true }, { key: 'slug', label: 'URL slug', required: true }, { key: 'description', label: 'Description', type: 'textarea' }],
  services: [{ key: 'name', label: 'Service name', required: true }, { key: 'slug', label: 'URL slug', required: true }, { key: 'summary', label: 'Summary' }, { key: 'description', label: 'Description', type: 'textarea' }],
  solutions: [{ key: 'name', label: 'Solution name', required: true }, { key: 'slug', label: 'URL slug', required: true }, { key: 'summary', label: 'Summary' }, { key: 'description', label: 'Description', type: 'textarea' }],
  testimonials: [{ key: 'name', label: 'Customer name', required: true }, { key: 'role', label: 'Role' }, { key: 'company', label: 'Company' }, { key: 'quote', label: 'Approved testimonial', type: 'textarea', required: true }],
  faqs: [{ key: 'question', label: 'Question', type: 'textarea', required: true }, { key: 'answer', label: 'Answer', type: 'textarea', required: true }],
  resources: [{ key: 'title', label: 'Resource title', required: true }, { key: 'slug', label: 'URL slug', required: true }, { key: 'summary', label: 'Summary', type: 'textarea' }, { key: 'body', label: 'Article content', type: 'textarea' }],
  media: [{ key: 'kind', label: 'Media type', type: 'select', options: ['IMAGE', 'VIDEO', 'DOCUMENT'], required: true }, { key: 'url', label: 'Secure HTTPS URL', required: true }, { key: 'title', label: 'Title' }, { key: 'alt', label: 'Alternative text' }, { key: 'linkedRecord', label: 'Attach to product or project', type: 'select' }],
};
const titles: Record<string, string> = { 'product-categories': 'Product categories', services: 'Services', solutions: 'Solutions', testimonials: 'Testimonials', faqs: 'FAQs', resources: 'Resources / blog', media: 'Media library' };
type LinkOption = { value: string; label: string };
type ResourceResult = { items: Row[]; total: number; page: number; pageCount: number };

export function ContentManager({ collection }: { collection: string }) {
  const [items, setItems] = useState<Row[]>([]); const [error, setError] = useState(''); const [notice, setNotice] = useState(''); const [editing, setEditing] = useState<Row | null>(null); const [values, setValues] = useState<Record<string, string>>({}); const [links, setLinks] = useState<LinkOption[]>([]);
  const [query, setQuery] = useState(''); const [stateFilter, setStateFilter] = useState(''); const [page, setPage] = useState(1); const [pageCount, setPageCount] = useState(1); const [total, setTotal] = useState(0); const [loading, setLoading] = useState(true);

  const load = useCallback(async (signal?: AbortSignal) => {
    setLoading(true); setError('');
    const params = new URLSearchParams({ collection });
    if (collection === 'resources') { params.set('page', String(page)); if (query.trim()) params.set('q', query.trim()); if (stateFilter) params.set('state', stateFilter); }
    try {
      const response = await fetch(`/api/admin/content?${params}`, { signal });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? 'Could not load this content.');
      if (collection === 'resources') { const result = data as ResourceResult; setItems(result.items); setTotal(result.total); setPage(result.page); setPageCount(result.pageCount); }
      else setItems(data);
      if (collection === 'media') {
        const [productsResponse, projectsResponse] = await Promise.all([fetch('/api/admin/products', { signal }), fetch('/api/admin/projects', { signal })]);
        if (!productsResponse.ok || !projectsResponse.ok) throw new Error('Could not load linked records.');
        const [products, projects] = await Promise.all([productsResponse.json(), projectsResponse.json()]);
        setLinks([...products.map((item: Row) => ({ value: `product:${String(item.id)}`, label: `Product · ${String(item.name)}` })), ...projects.map((item: Row) => ({ value: `project:${String(item.id)}`, label: `Project · ${String(item.title)}` }))]);
      }
    } catch (reason) {
      if (reason instanceof Error && reason.name === 'AbortError') return;
      setError(reason instanceof Error ? reason.message : 'Could not load this content.');
    } finally { if (!signal?.aborted) setLoading(false); }
  }, [collection, page, query, stateFilter]);
  useEffect(() => { const controller = new AbortController(); const timer = setTimeout(() => { void load(controller.signal); }, collection === 'resources' && query ? 250 : 0); return () => { clearTimeout(timer); controller.abort(); }; }, [load, collection, query]);

  function mapLinkedRecord(value: string) { return value.startsWith('product:') ? { productId: value.slice(8), projectId: null } : value.startsWith('project:') ? { productId: null, projectId: value.slice(8) } : { productId: null, projectId: null }; }
  async function create(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); const formElement = event.currentTarget; setError('');
    const data = Object.fromEntries(new FormData(formElement).entries()); const { linkedRecord, ...rest } = data;
    const payload = { collection, ...rest, ...(collection === 'media' ? mapLinkedRecord(String(linkedRecord ?? '')) : {}) };
    try { const response = await fetch('/api/admin/content', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }); const result = await response.json(); if (!response.ok) throw new Error(result.error ?? 'Could not save record.'); formElement.reset(); setNotice('Record saved.'); setPage(1); await load(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Could not save record.'); }
  }
  function startEdit(row: Row) {
    setEditing(row); const next = Object.fromEntries(fields[collection].map(field => [field.key, String(row[field.key] ?? '')]));
    if (collection === 'media') next.linkedRecord = row.productId ? `product:${String(row.productId)}` : row.projectId ? `project:${String(row.projectId)}` : '';
    setValues(next); setError('');
  }
  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!editing) return; const { linkedRecord, ...rest } = values;
    const payload = { collection, id: editing.id, ...rest, ...(collection === 'media' ? mapLinkedRecord(linkedRecord ?? '') : { published: editing.published }) };
    try { const response = await fetch('/api/admin/content', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }); const data = await response.json(); if (!response.ok) throw new Error(data.error ?? 'Could not update record.'); setEditing(null); setNotice('Record updated.'); await load(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Could not update record.'); }
  }
  async function publish(row: Row) { const response = await fetch('/api/admin/content', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ collection, id: row.id, published: !row.published }) }); if (response.ok) await load(); else setError((await response.json()).error ?? 'Could not change publish state.'); }
  async function remove(row: Row) { const label = String(row.name ?? row.title ?? row.question ?? row.url ?? 'this record'); if (!window.confirm(`Delete ${label}?`)) return; const response = await fetch('/api/admin/content', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ collection, id: row.id }) }); if (response.ok) await load(); else setError((await response.json()).error ?? 'Could not delete record.'); }
  function renderField(field: Field, value?: string, onChange?: (value: string) => void) {
    const id = `${editing ? 'edit-' : ''}${field.key}`;
    return <div className={`field ${field.type === 'textarea' ? 'field-wide' : ''}`} key={id}><label htmlFor={id}>{field.label}{field.required ? ' *' : ''}</label>{field.type === 'textarea' ? <textarea id={id} name={field.key} required={field.required} value={value} onChange={onChange ? event => onChange(event.target.value) : undefined} /> : field.type === 'select' ? <select id={id} name={field.key} required={field.required} value={value ?? ''} onChange={onChange ? event => onChange(event.target.value) : undefined}>{field.options?.map(option => <option key={option}>{option}</option>)}{field.key === 'linkedRecord' && <><option value="">Not attached</option>{links.map(link => <option key={link.value} value={link.value}>{link.label}</option>)}</>}</select> : <input id={id} name={field.key} maxLength={field.key === 'url' ? 2000 : 500} required={field.required} value={value} onChange={onChange ? event => onChange(event.target.value) : undefined} />}</div>;
  }

  return <>
    <form onSubmit={create} className="form-grid">{fields[collection].map(field => renderField(field))}<div className="field-wide"><button className="button">Add {titles[collection]?.toLowerCase()} draft</button></div></form>
    {notice && <p role="status">{notice}</p>}{error && <p role="alert" className="form-error">{error} <button type="button" className="admin-action" onClick={() => void load()}>Retry</button></p>}
    <h2 style={{ fontSize: '1.8rem', marginTop: '3rem' }}>Records</h2>
    {collection === 'resources' && <form role="search" className="lead-filters" onSubmit={event => { event.preventDefault(); setPage(1); }}><div className="field"><label htmlFor="resource-search">Search resources</label><input id="resource-search" type="search" value={query} onChange={event => { setQuery(event.target.value); setPage(1); }} placeholder="Title, slug, article text…" maxLength={120} /></div><div className="field"><label htmlFor="resource-state">Publication</label><select id="resource-state" value={stateFilter} onChange={event => { setStateFilter(event.target.value); setPage(1); }}><option value="">All records</option><option value="PUBLISHED">Published</option><option value="DRAFT">Draft</option></select></div></form>}
    {collection === 'resources' && <p className="form-note" aria-live="polite">{total} {total === 1 ? 'resource' : 'resources'}{loading ? ' · Loading…' : ''}</p>}
    {items.length ? <div style={{ overflowX: 'auto' }}><table className="admin-table"><thead><tr><th>Entry</th><th>State</th><th>Actions</th></tr></thead><tbody>{items.map(row => <tr key={String(row.id)}><td><strong>{String(row.name ?? row.title ?? row.question ?? row.url ?? '')}</strong><br/><span className="form-note">{String(row.slug ?? row.summary ?? row.alt ?? '')}</span></td><td>{collection === 'media' ? 'Media library' : row.published ? 'Published' : 'Draft'}</td><td>{collection !== 'media' && <button className="admin-action" onClick={() => void publish(row)}>{row.published ? 'Unpublish' : 'Publish'}</button>} <button className="admin-action" onClick={() => startEdit(row)}>Edit</button> <button className="admin-action" onClick={() => void remove(row)}>Delete</button></td></tr>)}</tbody></table></div> : <p className="form-note">{loading ? 'Loading records…' : collection === 'resources' && (query || stateFilter) ? 'No resources match these filters.' : 'No records have been created.'}</p>}
    {collection === 'resources' && pageCount > 1 && <nav className="pagination" aria-label="Resource pages"><button className="admin-action" disabled={page <= 1 || loading} onClick={() => setPage(value => Math.max(1, value - 1))}>Previous</button><span>Page {page} of {pageCount}</span><button className="admin-action" disabled={page >= pageCount || loading} onClick={() => setPage(value => Math.min(pageCount, value + 1))}>Next</button></nav>}
    {editing && <form onSubmit={save} className="form-grid edit-panel"><div className="field-wide"><p className="eyebrow">Edit record</p><h2 style={{ fontSize: '1.7rem' }}>{String(editing.name ?? editing.title ?? editing.question ?? editing.url ?? '')}</h2></div>{fields[collection].map(field => renderField(field, values[field.key], value => setValues(current => ({ ...current, [field.key]: value }))) )}<div className="field-wide"><button className="button">Save changes</button> <button type="button" className="admin-action" onClick={() => setEditing(null)}>Cancel</button></div></form>}
  </>;
}