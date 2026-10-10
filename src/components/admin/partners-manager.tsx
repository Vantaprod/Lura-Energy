'use client';

import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from '@/lib/i18n/context';
import { Select } from '@/components/ui/select';

type Partner = {
  id: string;
  name: string;
  logoUrl: string;
  logoAlt: string | null;
  websiteUrl: string | null;
  sortOrder: number;
  published: boolean;
};

type MediaItem = { id: string; url: string; alt: string | null; kind: string };

type Values = {
  name: string;
  logoUrl: string;
  logoAlt: string;
  websiteUrl: string;
  sortOrder: string;
};

const empty: Values = {
  name: '',
  logoUrl: '',
  logoAlt: '',
  websiteUrl: '',
  sortOrder: '0',
};

const toValues = (p: Partner): Values => ({
  name: p.name,
  logoUrl: p.logoUrl,
  logoAlt: p.logoAlt ?? '',
  websiteUrl: p.websiteUrl ?? '',
  sortOrder: String(p.sortOrder ?? 0),
});

export function PartnersManager() {
  const { t } = useTranslation();
  const [items, setItems] = useState<Partner[]>([]);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState<Partner | null>(null);
  const [values, setValues] = useState<Values>(empty);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [pRes, mRes] = await Promise.all([
        fetch('/api/admin/partners'),
        fetch('/api/admin/media').catch(() => null),
      ]);
      if (!pRes.ok) throw new Error(t('admin.partners.error.load'));
      const pData = await pRes.json();
      setItems(pData.items ?? []);
      if (mRes && mRes.ok) {
        const mData = await mRes.json();
        const images: MediaItem[] = Array.isArray(mData.items)
          ? mData.items.filter((m: MediaItem) => m.kind === 'IMAGE')
          : [];
        setMedia(images);
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : t('admin.partners.error.load'));
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
      const response = await fetch('/api/admin/partners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: values.name,
          logoUrl: values.logoUrl,
          logoAlt: values.logoAlt || undefined,
          websiteUrl: values.websiteUrl || undefined,
          sortOrder: Number(values.sortOrder) || 0,
          published: false,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? t('admin.partners.error.save'));
      setNotice(t('admin.partners.notice.saved'));
      setValues(empty);
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : t('admin.partners.error.save'));
    } finally {
      setBusy(false);
    }
  }

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editing) return;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const response = await fetch(`/api/admin/partners/${editing.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: values.name,
          logoUrl: values.logoUrl,
          logoAlt: values.logoAlt || null,
          websiteUrl: values.websiteUrl || null,
          sortOrder: Number(values.sortOrder) || 0,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? t('admin.partners.error.update'));
      setNotice(t('admin.partners.notice.updated'));
      setEditing(null);
      setValues(empty);
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : t('admin.partners.error.update'));
    } finally {
      setBusy(false);
    }
  }

  async function toggle(p: Partner) {
    const r = await fetch(`/api/admin/partners/${p.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ published: !p.published }),
    });
    if (r.ok) await load();
    else setError(t('admin.partners.error.publish'));
  }

  async function remove(p: Partner) {
    if (!window.confirm(`${t('admin.partners.confirm.delete')} ${p.name}?`)) return;
    const r = await fetch(`/api/admin/partners/${p.id}`, { method: 'DELETE' });
    if (r.ok) await load();
    else setError(t('admin.partners.error.delete'));
  }

  const mediaOptions = media.map((m) => ({
    value: m.url,
    label: m.alt ?? m.url.split('/').pop() ?? m.url,
  }));

  return (
    <>
      <form className="form-grid" onSubmit={editing ? save : create}>
        <div className="field">
          <label htmlFor="partner-name">{t('admin.partners.form.name')}</label>
          <input
            id="partner-name"
            required
            maxLength={180}
            value={values.name}
            onChange={(e) => setValues({ ...values, name: e.target.value })}
          />
        </div>
        <div className="field">
          <label htmlFor="partner-sort">{t('admin.partners.form.sortOrder')}</label>
          <input
            id="partner-sort"
            type="number"
            min="0"
            max="9999"
            value={values.sortOrder}
            onChange={(e) => setValues({ ...values, sortOrder: e.target.value })}
          />
        </div>
        <div className="field field-wide">
          <label htmlFor="partner-logo">{t('admin.partners.form.logoUrl')}</label>
          <Select
            id="partner-logo"
            value={media.some((m) => m.url === values.logoUrl) ? values.logoUrl : ''}
            onChange={(v) => {
              if (v) setValues({ ...values, logoUrl: v });
            }}
            options={mediaOptions}
            placeholder={t('admin.partners.form.logoPick')}
            fullWidth
          />
          <input
            type="text"
            value={values.logoUrl}
            onChange={(e) => setValues({ ...values, logoUrl: e.target.value })}
            placeholder={t('admin.partners.form.logoPlaceholder')}
            style={{ marginTop: '0.5rem' }}
          />
          <span className="form-note">{t('admin.partners.form.logoHint')}</span>
        </div>
        <div className="field">
          <label htmlFor="partner-logo-alt">{t('admin.partners.form.logoAlt')}</label>
          <input
            id="partner-logo-alt"
            maxLength={200}
            value={values.logoAlt}
            onChange={(e) => setValues({ ...values, logoAlt: e.target.value })}
          />
        </div>
        <div className="field">
          <label htmlFor="partner-website">{t('admin.partners.form.websiteUrl')}</label>
          <input
            id="partner-website"
            maxLength={2000}
            value={values.websiteUrl}
            onChange={(e) => setValues({ ...values, websiteUrl: e.target.value })}
            placeholder="https://"
          />
        </div>
        <div className="field-wide">
          <button className="button" disabled={busy}>
            {busy
              ? t('admin.actions.saving')
              : editing
                ? t('admin.partners.edit.save')
                : t('admin.partners.form.submit')}
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
        {t('admin.partners.list.title')}
      </h2>

      {loading ? (
        <p className="form-note">{t('admin.partners.list.loading')}</p>
      ) : items.length === 0 ? (
        <p className="form-note">{t('admin.partners.list.empty')}</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>{t('admin.partners.list.colLogo')}</th>
                <th>{t('admin.partners.list.colName')}</th>
                <th>{t('admin.partners.list.colState')}</th>
                <th>{t('admin.partners.list.colActions')}</th>
              </tr>
            </thead>
            <tbody>
              {items.map((p) => (
                <tr key={p.id}>
                  <td>
                    {p.logoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.logoUrl}
                        alt={p.logoAlt ?? p.name}
                        style={{
                          width: '100px',
                          height: '48px',
                          objectFit: 'contain',
                          borderRadius: '4px',
                          background: '#F7F8FA',
                        }}
                      />
                    ) : (
                      <span className="form-note">-</span>
                    )}
                  </td>
                  <td>
                    <strong>{p.name}</strong>
                    {p.websiteUrl && (
                      <>
                        <br />
                        <span className="form-note">{p.websiteUrl}</span>
                      </>
                    )}
                  </td>
                  <td>
                    {p.published
                      ? t('admin.partners.list.published')
                      : t('admin.partners.list.draft')}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        className="admin-action admin-action--edit"
                        onClick={() => {
                          setEditing(p);
                          setValues(toValues(p));
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                      >
                        {t('admin.actions.edit')}
                      </button>
                      <button
                        type="button"
                        className="admin-action admin-action--primary"
                        onClick={() => void toggle(p)}
                      >
                        {p.published
                          ? t('admin.actions.unpublish')
                          : t('admin.actions.publish')}
                      </button>
                      <button
                        type="button"
                        className="admin-action admin-action--danger"
                        onClick={() => void remove(p)}
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