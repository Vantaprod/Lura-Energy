'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from '@/lib/i18n/context';
import { ProductSpecifications } from '@/components/admin/product-specifications';
import { MediaDropzone, type ProductMedia } from '@/components/admin/media-dropzone';
import { Select } from '@/components/ui/select';
import { HeroImageDropzone } from '@/components/admin/hero-image-dropzone';

type Specification = { id: string; label: string; value: string; unit: string | null; group: string | null };
type FeatureBanner = { url: string; alt: string };
type Product = {
  id: string;
  name: string;
  slug: string;
  modelNumber: string | null;
  brand: string | null;
  summary: string | null;
  description: string | null;
  status: string | null;
  warranty: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  datasheetUrl: string | null;
  heroImageUrl: string | null;
  notice: string | null;
  featureBanners: FeatureBanner[] | null;
  keyFeatures: string[] | null;
  sortOrder: number;
  published: boolean;
  featured: boolean;
  categoryId: string | null;
  category: { name: string } | null;
  specifications: Specification[];
  media: ProductMedia[];
};
type Category = { id: string; name: string; slug: string; published: boolean };
type EditValues = {
  name: string;
  slug: string;
  modelNumber: string;
  brand: string;
  categoryId: string;
  summary: string;
  description: string;
  status: string;
  warranty: string;
  seoTitle: string;
  seoDescription: string;
  datasheetUrl: string;
  heroImageUrl: string;
  notice: string;
  keyFeatures: string;
  sortOrder: string;
};
type ProductResult = {
  items: Product[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
};

const emptyEdit = (product: Product): EditValues => ({
  name: product.name,
  slug: product.slug,
  modelNumber: product.modelNumber ?? '',
  brand: product.brand ?? '',
  categoryId: product.categoryId ?? '',
  summary: product.summary ?? '',
  description: product.description ?? '',
  status: product.status ?? '',
  warranty: product.warranty ?? '',
  seoTitle: product.seoTitle ?? '',
  seoDescription: product.seoDescription ?? '',
  datasheetUrl: product.datasheetUrl ?? '',
  heroImageUrl: product.heroImageUrl ?? '',
  notice: product.notice ?? '',
  keyFeatures: Array.isArray(product.keyFeatures) ? product.keyFeatures.join('\n') : '',
  sortOrder: String(product.sortOrder ?? 0),
});

export function ProductsManager() {
  const { t } = useTranslation();
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
  const [featureBanners, setFeatureBanners] = useState<FeatureBanner[]>([]);
  const [bannerUploading, setBannerUploading] = useState(false);
  const [createCategoryId, setCreateCategoryId] = useState('');
  const bannerFileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(
    async (signal?: AbortSignal) => {
      setLoading(true);
      setError('');
      const params = new URLSearchParams({ page: String(page) });
      if (query.trim()) params.set('q', query.trim());
      if (categoryFilter) params.set('categoryId', categoryFilter);
      if (stateFilter) params.set('state', stateFilter);
      try {
        const [productsResponse, categoriesResponse] = await Promise.all([
          fetch(`/api/admin/products?${params}`, { signal }),
          fetch('/api/admin/content?collection=product-categories', { signal }),
        ]);
        const productResult = await productsResponse.json();
        if (!productsResponse.ok) {
          throw new Error(productResult.error ?? t('admin.prod.error.load'));
        }
        if (!categoriesResponse.ok) {
          throw new Error(t('admin.prod.error.categories'));
        }
        const data: ProductResult = productResult;
        setItems(data.items);
        setTotal(data.total);
        setPageCount(data.pageCount);
        setPage(data.page);
        setCategories(await categoriesResponse.json());
      } catch (reason) {
        if (reason instanceof Error && reason.name === 'AbortError') return;
        setError(reason instanceof Error ? reason.message : t('admin.prod.error.load'));
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [page, query, categoryFilter, stateFilter, t],
  );

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      void load(controller.signal);
    }, query ? 250 : 0);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [load, query]);

  function startEdit(product: Product) {
    setEditing(product);
    setValues(emptyEdit(product));
    setFeatureBanners(
      Array.isArray(product.featureBanners) ? product.featureBanners : [],
    );
  }

  function closeEdit() {
    setEditing(null);
    setValues(null);
    setFeatureBanners([]);
  }

  async function uploadImage(file: File, subfolder: string): Promise<string | null> {
    const form = new FormData();
    form.append('file', file);
    form.append('subfolder', subfolder);
    try {
      const res = await fetch('/api/admin/media/upload', { method: 'POST', body: form });
      const data = await res.json();
      if (!res.ok) {
        setError((data as { error?: string }).error ?? t('admin.prod.error.upload'));
        return null;
      }
      return (data as { url: string }).url;
    } catch {
      setError(t('admin.prod.error.upload'));
      return null;
    }
  }


  async function uploadBanner(file: File) {
    setBannerUploading(true);
    const url = await uploadImage(file, 'products-banners');
    if (url) setFeatureBanners((b) => [...b, { url, alt: '' }]);
    setBannerUploading(false);
    if (bannerFileRef.current) bannerFileRef.current.value = '';
  }

  function removeBanner(i: number) {
    setFeatureBanners((b) => b.filter((_, idx) => idx !== i));
  }

  function moveBanner(i: number, dir: -1 | 1) {
    const target = i + dir;
    if (target < 0 || target >= featureBanners.length) return;
    setFeatureBanners((b) => {
      const next = [...b];
      [next[i], next[target]] = [next[target], next[i]];
      return next;
    });
  }

  function updateBannerAlt(i: number, alt: string) {
    setFeatureBanners((b) =>
      b.map((item, idx) => (idx === i ? { ...item, alt } : item)),
    );
  }

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
        body: JSON.stringify({
          ...form,
          categoryId: createCategoryId || undefined,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? t('admin.prod.error.save'));
      formElement.reset();
      setCreateCategoryId('');
      setPage(1);
      await load();
      const created: Product = {
        ...(data as Omit<Product, 'media' | 'specifications' | 'category' | 'featureBanners'>),
        media: [],
        specifications: [],
        category: null,
        featureBanners: [],
      };
      startEdit(created);
      setTimeout(() => {
        const panel = document.querySelector('.edit-panel');
        if (panel) panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : t('admin.prod.error.save'));
    } finally {
      setBusy(false);
    }
  }

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editing || !values) return;
    setError('');
    const keyFeaturesArray = values.keyFeatures
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);
    try {
      const response = await fetch('/api/admin/products/' + editing.id, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...values,
          categoryId: values.categoryId || null,
          sortOrder: Number(values.sortOrder) || 0,
          keyFeatures: keyFeaturesArray,
          heroImageUrl: values.heroImageUrl || null,
          notice: values.notice || null,
          featureBanners: featureBanners.length ? featureBanners : null,
          datasheetUrl: values.datasheetUrl || null,
          published: editing.published,
          featured: editing.featured,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? t('admin.prod.error.update'));
      closeEdit();
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : t('admin.prod.error.update'));
    }
  }

  async function toggle(item: Product) {
    const response = await fetch('/api/admin/products/' + item.id, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ published: !item.published }),
    });
    if (response.ok) await load();
    else setError(t('admin.prod.error.publish'));
  }

  async function remove(item: Product) {
    if (!window.confirm(t('admin.actions.confirmDelete'))) return;
    const response = await fetch('/api/admin/products/' + item.id, { method: 'DELETE' });
    if (response.ok) await load();
    else setError(t('admin.prod.error.delete'));
  }

  function editField(key: keyof EditValues, label: string, wide = false) {
    const isTextarea = key === 'description' || key === 'keyFeatures' || key === 'notice';
    return (
      <div className={'field ' + (wide ? 'field-wide' : '')} key={key}>
        <label htmlFor={'edit-' + key}>{label}</label>
        {isTextarea ? (
          <textarea
            id={'edit-' + key}
            value={values?.[key] ?? ''}
            maxLength={key === 'keyFeatures' ? 4000 : key === 'notice' ? 4000 : 10000}
            onChange={(event) =>
              setValues((current) =>
                current ? { ...current, [key]: event.target.value } : current,
              )
            }
          />
        ) : (
          <input
            id={'edit-' + key}
            value={values?.[key] ?? ''}
            maxLength={key === 'seoDescription' ? 320 : key === 'brand' ? 80 : 500}
            onChange={(event) =>
              setValues((current) =>
                current ? { ...current, [key]: event.target.value } : current,
              )
            }
          />
        )}
      </div>
    );
  }

  const createCategoryOptions = useMemo(
    () =>
      categories
        .filter((c) => c.published)
        .map((c) => ({ value: c.id, label: c.name })),
    [categories],
  );

  const editCategoryOptions = createCategoryOptions;

  const filterCategoryOptions = useMemo(
    () => categories.map((c) => ({ value: c.id, label: c.name })),
    [categories],
  );

  const stateOptions = useMemo(
    () => [
      { value: '', label: t('admin.prod.list.allRecords') },
      { value: 'PUBLISHED', label: t('admin.prod.list.published') },
      { value: 'DRAFT', label: t('admin.prod.list.draft') },
    ],
    [t],
  );

  return (
    <>
      <form className="form-grid" onSubmit={create}>
        <div className="field">
          <label htmlFor="name">{t('admin.prod.form.name')}</label>
          <input name="name" id="name" required maxLength={160} />
        </div>
        <div className="field">
          <label htmlFor="slug">{t('admin.prod.form.slug')}</label>
          <input name="slug" id="slug" pattern="[a-z0-9]+(?:-[a-z0-9]+)*" required />
        </div>
        <div className="field">
          <label htmlFor="brand">{t('admin.prod.form.brand')}</label>
          <input
            name="brand"
            id="brand"
            maxLength={80}
            placeholder={t('admin.prod.form.brandPlaceholder')}
          />
          <span className="form-note">{t('admin.prod.form.brandHint')}</span>
        </div>
        <div className="field">
          <label htmlFor="categoryId">{t('admin.prod.form.category')}</label>
          <Select
            id="categoryId"
            name="categoryId"
            value={createCategoryId}
            onChange={setCreateCategoryId}
            options={createCategoryOptions}
            placeholder={t('admin.prod.form.categoryNone')}
            fullWidth
          />
          <span className="form-note">{t('admin.prod.form.categoryHint')}</span>
        </div>
        <div className="field">
          <label htmlFor="summary">{t('admin.prod.form.summary')}</label>
          <input name="summary" id="summary" maxLength={500} />
        </div>
        <div className="field field-wide">
          <label htmlFor="description">{t('admin.prod.form.description')}</label>
          <textarea name="description" id="description" maxLength={10000} />
        </div>
        <div className="field-wide">
          <button className="button" disabled={busy}>
            {busy ? t('admin.actions.saving') : t('admin.prod.form.submit')}
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

      <h2 style={{ fontSize: '1.8rem', margin: '3rem 0 1rem' }}>
        {t('admin.prod.list.title')}
      </h2>

      <form
        role="search"
        className="lead-filters"
        onSubmit={(event) => {
          event.preventDefault();
          setPage(1);
        }}
      >
        <div className="field">
          <label htmlFor="product-search">{t('admin.prod.list.search')}</label>
          <input
            id="product-search"
            type="search"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setPage(1);
            }}
            placeholder={t('admin.prod.list.searchPlaceholder')}
            maxLength={120}
          />
        </div>
        <div className="field">
          <label htmlFor="product-category-filter">{t('admin.prod.list.category')}</label>
          <Select
            id="product-category-filter"
            value={categoryFilter}
            onChange={(v) => {
              setCategoryFilter(v);
              setPage(1);
            }}
            options={filterCategoryOptions}
            placeholder={t('admin.prod.list.allCategories')}
            fullWidth
          />
        </div>
        <div className="field">
          <label htmlFor="product-state-filter">{t('admin.prod.list.publication')}</label>
          <Select
            id="product-state-filter"
            value={stateFilter}
            onChange={(v) => {
              setStateFilter(v);
              setPage(1);
            }}
            options={stateOptions}
            fullWidth
          />
        </div>
      </form>

      <p className="form-note" aria-live="polite">
        {total} {total === 1 ? t('admin.prod.list.countOne') : t('admin.prod.list.countMany')}
        {loading ? ' - ' + t('admin.actions.loading') : ''}
      </p>

      {items.length ? (
        <div style={{ overflowX: 'auto' }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>{t('admin.prod.list.colProduct')}</th>
                <th>{t('admin.prod.list.colBrand')}</th>
                <th>{t('admin.prod.list.colCategory')}</th>
                <th>{t('admin.prod.list.colImages')}</th>
                <th>{t('admin.prod.list.colState')}</th>
                <th>{t('admin.prod.list.colActions')}</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>
                    {item.name}
                    {item.modelNumber && (
                      <>
                        <br />
                        <span className="form-note" style={{ fontFamily: 'monospace' }}>
                          {item.modelNumber}
                        </span>
                      </>
                    )}
                    <br />
                    <span className="form-note">{item.slug}</span>
                    <br />
                    <ProductSpecifications
                      productId={item.id}
                      initial={item.specifications}
                    />
                  </td>
                  <td>{item.brand ?? '-'}</td>
                  <td>{item.category?.name ?? '-'}</td>
                  <td>{item.media?.filter((m) => m.kind === 'IMAGE').length ?? 0}</td>
                  <td>
                    {item.published
                      ? t('admin.prod.list.published')
                      : t('admin.prod.list.draft')}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        className="admin-action admin-action--edit"
                        onClick={() => startEdit(item)}
                      >
                        {t('admin.actions.edit')}
                      </button>
                      <button
                        type="button"
                        className="admin-action admin-action--primary"
                        onClick={() => void toggle(item)}
                      >
                        {item.published
                          ? t('admin.actions.unpublish')
                          : t('admin.actions.publish')}
                      </button>
                      <button
                        type="button"
                        className="admin-action admin-action--danger"
                        onClick={() => void remove(item)}
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
            ? t('admin.prod.list.loading')
            : query || categoryFilter || stateFilter
              ? t('admin.prod.list.noMatch')
              : t('admin.prod.list.empty')}
        </p>
      )}

      {pageCount > 1 && (
        <nav className="pagination" aria-label={t('aria.pagination.products')}>
          <button
            className="admin-action"
            disabled={page <= 1 || loading}
            onClick={() => setPage((value) => Math.max(1, value - 1))}
          >
            {t('admin.actions.cancel')}
          </button>
          <span>
            {page} / {pageCount}
          </span>
          <button
            className="admin-action"
            disabled={page >= pageCount || loading}
            onClick={() => setPage((value) => Math.min(pageCount, value + 1))}
          >
            {'\u2192'}
          </button>
        </nav>
      )}

      {editing && values && (
        <form onSubmit={save} className="form-grid edit-panel">
          <div className="field-wide">
            <p className="eyebrow">{t('admin.prod.edit.title')}</p>
            <h2 style={{ fontSize: '1.7rem' }}>{editing.name}</h2>
          </div>
          {editField('name', t('admin.prod.form.name'))}
          {editField('slug', t('admin.prod.form.slug'))}
          {editField('modelNumber', t('admin.prod.form.modelNumber'))}
          {editField('brand', t('admin.prod.form.brand'))}
          <div className="field">
            <label htmlFor="edit-categoryId">{t('admin.prod.form.category')}</label>
            <Select
              id="edit-categoryId"
              value={values.categoryId}
              onChange={(v) => setValues({ ...values, categoryId: v })}
              options={editCategoryOptions}
              placeholder={t('admin.prod.form.categoryNone')}
              fullWidth
            />
          </div>
          {editField('sortOrder', t('admin.prod.form.sortOrder'))}
          {editField('summary', t('admin.prod.form.summary'))}
          {editField('status', t('admin.prod.edit.status'))}
          {editField('warranty', t('admin.prod.edit.warranty'))}
          {editField('description', t('admin.prod.form.description'), true)}
          {editField('keyFeatures', t('admin.prod.form.keyFeatures'), true)}
          {editField('datasheetUrl', t('admin.prod.form.datasheetUrl'))}

          <div className="field-wide">
            <label>{t('admin.prod.form.images')}</label>
            <MediaDropzone productId={editing.id} initial={editing.media ?? []} />
          </div>

          <div className="field-wide">
            <label>{t('admin.prod.form.heroImage')}</label>
            <span className="form-note" style={{ display: 'block', marginBottom: '0.5rem' }}>
              {t('admin.prod.form.heroHint')}
            </span>
            <HeroImageDropzone
              value={values.heroImageUrl}
              onChange={(url) => setValues({ ...values, heroImageUrl: url })}
            />
          </div>

          {editField('notice', t('admin.prod.form.notice'), true)}
          <div className="field-wide" style={{ marginTop: '-1rem' }}>
            <span className="form-note">{t('admin.prod.form.noticeHint')}</span>
          </div>

          <div className="field-wide">
            <label>{t('admin.prod.form.banners')}</label>
            <span className="form-note" style={{ display: 'block', marginBottom: '0.5rem' }}>
              {t('admin.prod.form.bannersHint')}
            </span>

            {featureBanners.length > 0 && (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  marginBottom: '12px',
                }}
              >
                {featureBanners.map((banner, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      gap: '10px',
                      alignItems: 'flex-start',
                      padding: '10px',
                      border: '1px solid var(--line)',
                      borderRadius: '8px',
                      background: '#FAFBFC',
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={banner.url}
                      alt=""
                      style={{
                        width: '120px',
                        height: '80px',
                        objectFit: 'cover',
                        borderRadius: '6px',
                        flex: '0 0 auto',
                      }}
                    />
                    <div style={{ flex: '1 1 auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <input
                        type="text"
                        value={banner.url}
                        readOnly
                        style={{ fontFamily: 'monospace', fontSize: '12px' }}
                      />
                      <input
                        type="text"
                        value={banner.alt}
                        placeholder={t('admin.prod.form.bannerAlt')}
                        onChange={(e) => updateBannerAlt(i, e.target.value)}
                      />
                    </div>
                    <div style={{ display: 'flex', gap: '4px', flex: '0 0 auto' }}>
                      <button
                        type="button"
                        className="admin-action"
                        disabled={i === 0}
                        onClick={() => moveBanner(i, -1)}
                        aria-label={t('admin.prod.form.bannerUp')}
                      >
                        {'\u2191'}
                      </button>
                      <button
                        type="button"
                        className="admin-action"
                        disabled={i === featureBanners.length - 1}
                        onClick={() => moveBanner(i, 1)}
                        aria-label={t('admin.prod.form.bannerDown')}
                      >
                        {'\u2193'}
                      </button>
                      <button
                        type="button"
                        className="admin-action admin-action--danger"
                        onClick={() => removeBanner(i)}
                      >
                        {'\u00D7'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button
              type="button"
              className="button"
              disabled={bannerUploading}
              onClick={() => bannerFileRef.current?.click()}
            >
              {bannerUploading
                ? t('admin.prod.form.uploading')
                : t('admin.prod.form.bannerAdd')}
            </button>
            <input
              ref={bannerFileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
              style={{ display: 'none' }}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void uploadBanner(f);
              }}
            />
          </div>

          {editField('seoTitle', t('admin.prod.edit.seoTitle'))}
          {editField('seoDescription', t('admin.prod.edit.seoDescription'))}
          <div className="field-wide">
            <button className="button">{t('admin.prod.edit.save')}</button>{' '}
            <button type="button" className="admin-action" onClick={closeEdit}>
              {t('admin.actions.cancel')}
            </button>
          </div>
        </form>
      )}
    </>
  );
}