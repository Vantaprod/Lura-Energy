'use client';

import { useCallback, useEffect, useState } from 'react';
import { ProductSpecifications } from '@/components/admin/product-specifications';

type Specification = { id: string; label: string; value: string; unit: string | null };
type Product = {
  id: string;
  name: string;
  slug: string;
  brand: string | null;
  summary: string | null;
  description: string | null;
  status: string | null;
  warranty: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  published: boolean;
  featured: boolean;
  categoryId: string | null;
  category: { name: string } | null;
  specifications: Specification[];
};
type Category = { id: string; name: string; slug: string; published: boolean };
type EditValues = {
  name: string;
  slug: string;
  brand: string;
  categoryId: string;
  summary: string;
  description: string;
  status: string;
  warranty: string;
  seoTitle: string;
  seoDescription: string;
};
type ProductResult = { items: Product[]; total: number; page: number; pageSize: number; pageCount: number };

const emptyEdit = (product: Product): EditValues => ({
  name: product.name,
  slug: product.slug,
  brand: product.brand ?? '',
  categoryId: product.categoryId ?? '',
  summary: product.summary ?? '',
  description: product.description ?? '',
  status: product.status ?? '',
  warranty: product.warranty ?? '',
  seoTitle: product.seoTitle ?? '',
  seoDescription: product.seoDescription ?? '',
});

export function ProductsManager() {
  const [items, setItems] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [total, setTotal] = useState(0);
  const [pageCount, setPageCount] = useState(1);
  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [page, setPage] = useState(1);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Product | null>(null);
  const [values, setValues] = useState<EditValues | null>(null);

  const load = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError('');
    const params = new URLSearchParams({ page: String(page) });
    if (query.trim()) params.set('q', query.trim());
    if (categoryFilter) params.set('categoryId', categoryFilter);
    if (stateFilter) params.set('state', stateFilter);
    try {
      const [productsResponse, categoriesResponse] = await Promise.all([
        fetch('/api/admin/products?' + params, { signal }),
        fetch('/api/admin/content?collection=product-categories', { signal }),
      ]);
      const productResult = await productsResponse.json();
      if (!productsResponse.ok) throw new Error(productResult.error ?? 'Could not load catalog records.');
      if (!categoriesResponse.ok) throw new Error('Could not load product categories.');
      const data: ProductResult = productResult;
      setItems(data.items);
      setTotal(data.total);
      setPageCount(data.pageCount);
      setPage(data.page);
      setCategories(await categoriesResponse.json());
    } catch (reason) {
      if (reason instanceof Error && reason.name === 'AbortError') return;
      setError(reason instanceof Error ? reason.message : 'Could not load catalog records.');
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [page, query, categoryFilter, stateFilter]);

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => { void load(controller.signal); }, query ? 250 : 0);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [load, query]);

  async function create(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    setBusy(true);
    setError('');
    const form = Object.fromEntries(new FormData(formElement).entries());
    try {
      const response = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, categoryId: form.categoryId || undefined }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? 'Could not save product.');
      formElement.reset();
      setPage(1);
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not save product.');
    } finally {
      setBusy(false);
    }
  }

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editing || !values) return;
    setError('');
    try {
      const response = await fetch('/api/admin/products/' + editing.id, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...values,
          categoryId: values.categoryId || null,
          published: editing.published,
          featured: editing.featured,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? 'Could not update product.');
      setEditing(null);
      setValues(null);
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not update product.');
    }
  }

  async function toggle(item: Product) {
    const response = await fetch('/api/admin/products/' + item.id, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ published: !item.published }),
    });
    if (response.ok) await load();
    else setError('Could not change publish status.');
  }

  async function remove(item: Product) {
    if (!window.confirm('Delete ' + item.name + '?')) return;
    const response = await fetch('/api/admin/products/' + item.id, { method: 'DELETE' });
    if (response.ok) await load();
    else setError('Could not delete product.');
  }

  function editField(key: keyof EditValues, label: string, wide = false) {
    return (
      <div className={'field ' + (wide ? 'field-wide' : '')} key={key}>
        <label htmlFor={'edit-' + key}>{label}</label>
        {key === 'description' ? (
          <textarea
            id={'edit-' + key}
            value={values?.[key] ?? ''}
            maxLength={10000}
            onChange={(event) =>
              setValues((current) => (current ? { ...current, [key]: event.target.value } : current))
            }
          />
        ) : (
          <input
            id={'edit-' + key}
            value={values?.[key] ?? ''}
            maxLength={key === 'seoDescription' ? 320 : key === 'brand' ? 80 : 500}
            onChange={(event) =>
              setValues((current) => (current ? { ...current, [key]: event.target.value } : current))
            }
          />
        )}
      </div>
    );
  }

  return (
    <>
      <form className="form-grid" onSubmit={create}>
        <div className="field"><label htmlFor="name">Product name</label><input name="name" id="name" required maxLength={160} /></div>
        <div className="field"><label htmlFor="slug">URL slug</label><input name="slug" id="slug" pattern="[a-z0-9]+(?:-[a-z0-9]+)*" required /></div>
        <div className="field"><label htmlFor="brand">Brand</label><input name="brand" id="brand" maxLength={80} placeholder="e.g. Litharv, Huihang" /><span className="form-note">Partner brand this product belongs to. Leave empty if Lura-branded.</span></div>
        <div className="field"><label htmlFor="categoryId">Category</label><select id="categoryId" name="categoryId"><option value="">No category selected</option>{categories.filter((item) => item.published).map((item) => (<option key={item.id} value={item.id}>{item.name}</option>))}</select><span className="form-note">Categories must be published before assignment.</span></div>
        <div className="field"><label htmlFor="summary">Summary</label><input name="summary" id="summary" maxLength={500} /></div>
        <div className="field field-wide"><label htmlFor="description">Description</label><textarea name="description" id="description" maxLength={10000} /></div>
        <div className="field-wide"><button className="button" disabled={busy}>{busy ? 'Saving...' : 'Add draft product'}</button></div>
      </form>

      {error && (
        <p className="form-error" role="alert">
          {error} <button type="button" className="admin-action" onClick={() => void load()}>Retry</button>
        </p>
      )}

      <h2 style={{ fontSize: '1.8rem', margin: '3rem 0 1rem' }}>Product records</h2>

      <form role="search" className="lead-filters" onSubmit={(event) => { event.preventDefault(); setPage(1); }}>
        <div className="field"><label htmlFor="product-search">Search products</label><input id="product-search" type="search" value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder="Name, slug, brand, summary..." maxLength={120} /></div>
        <div className="field"><label htmlFor="product-category-filter">Category</label><select id="product-category-filter" value={categoryFilter} onChange={(event) => { setCategoryFilter(event.target.value); setPage(1); }}><option value="">All categories</option>{categories.map((category) => (<option key={category.id} value={category.id}>{category.name}</option>))}</select></div>
        <div className="field"><label htmlFor="product-state-filter">Publication</label><select id="product-state-filter" value={stateFilter} onChange={(event) => { setStateFilter(event.target.value); setPage(1); }}><option value="">All records</option><option value="PUBLISHED">Published</option><option value="DRAFT">Draft</option></select></div>
      </form>

      <p className="form-note" aria-live="polite">{total} {total === 1 ? 'product' : 'products'}{loading ? ' - Loading...' : ''}</p>

      {items.length ? (
        <div style={{ overflowX: 'auto' }}>
          <table className="admin-table">
            <thead>
              <tr><th>Product</th><th>Brand</th><th>Category</th><th>State</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>{item.name}<br /><span className="form-note">{item.slug}</span><br /><ProductSpecifications productId={item.id} initial={item.specifications} /></td>
                  <td>{item.brand ?? '-'}</td>
                  <td>{item.category?.name ?? '-'}</td>
                  <td>{item.published ? 'Published' : 'Draft'}</td>
                  <td>
                    <button className="admin-action" onClick={() => { setEditing(item); setValues(emptyEdit(item)); }} type="button">Edit</button>{' '}
                    <button className="admin-action" onClick={() => void toggle(item)} type="button">{item.published ? 'Unpublish' : 'Publish'}</button>{' '}
                    <button className="admin-action" onClick={() => void remove(item)} type="button">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="form-note">{loading ? 'Loading products...' : query || categoryFilter || stateFilter ? 'No products match these filters.' : 'No products have been entered yet.'}</p>
      )}

      {pageCount > 1 && (
        <nav className="pagination" aria-label="Product pages">
          <button className="admin-action" disabled={page <= 1 || loading} onClick={() => setPage((value) => Math.max(1, value - 1))}>Previous</button>
          <span>Page {page} of {pageCount}</span>
          <button className="admin-action" disabled={page >= pageCount || loading} onClick={() => setPage((value) => Math.min(pageCount, value + 1))}>Next</button>
        </nav>
      )}

      {editing && values && (
        <form onSubmit={save} className="form-grid edit-panel">
          <div className="field-wide"><p className="eyebrow">Edit product</p><h2 style={{ fontSize: '1.7rem' }}>{editing.name}</h2></div>
          {editField('name', 'Product name')}
          {editField('slug', 'URL slug')}
          {editField('brand', 'Brand')}
          <div className="field">
            <label htmlFor="edit-categoryId">Category</label>
            <select id="edit-categoryId" value={values.categoryId} onChange={(event) => setValues({ ...values, categoryId: event.target.value })}>
              <option value="">No category selected</option>
              {categories.filter((item) => item.published).map((item) => (<option value={item.id} key={item.id}>{item.name}</option>))}
            </select>
          </div>
          {editField('summary', 'Summary')}
          {editField('status', 'Product status')}
          {editField('warranty', 'Warranty information')}
          {editField('description', 'Description', true)}
          {editField('seoTitle', 'SEO title')}
          {editField('seoDescription', 'SEO description')}
          <div className="field-wide">
            <button className="button">Save product</button>{' '}
            <button type="button" className="admin-action" onClick={() => { setEditing(null); setValues(null); }}>Cancel</button>
          </div>
        </form>
      )}
    </>
  );
}