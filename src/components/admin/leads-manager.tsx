'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from '@/lib/i18n/context';
import { Select } from '@/components/ui/select';

type Lead = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  location: string | null;
  company: string | null;
  interestedSolution: string | null;
  interestedProduct: string | null;
  message: string;
  status: string;
  createdAt: string;
};
type Result = {
  items: Lead[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
};

const statuses = ['NEW', 'CONTACTED', 'QUALIFIED', 'QUOTED', 'WON', 'LOST'] as const;

function fill(template: string, vars: Record<string, string | number>): string {
  return Object.entries(vars).reduce(
    (acc, [key, value]) => acc.replaceAll(`{${key}}`, String(value)),
    template,
  );
}

export function LeadsManager() {
  const { t } = useTranslation();
  const [result, setResult] = useState<Result | null>(null);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(
    async (signal?: AbortSignal) => {
      setLoading(true);
      setError('');
      const params = new URLSearchParams({ page: String(page) });
      if (query.trim()) params.set('q', query.trim());
      if (status) params.set('status', status);
      try {
        const response = await fetch(`/api/admin/leads?${params}`, { signal });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error ?? t('admin.leads.error.load'));
        }
        setResult(data);
        setPage(data.page);
      } catch (reason) {
        if (reason instanceof Error && reason.name === 'AbortError') return;
        setError(
          reason instanceof Error ? reason.message : t('admin.leads.error.load'),
        );
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    [page, query, status],
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

  async function update(id: string, nextStatus: string) {
    setError('');
    try {
      const response = await fetch(`/api/admin/leads/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? t('admin.leads.error.update'));
      await load();
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : t('admin.leads.error.update'),
      );
    }
  }

  const summaryParts: string[] = [];
  if (result) {
    summaryParts.push(
      `${result.total} ${
        result.total === 1
          ? t('admin.leads.count.enquiry')
          : t('admin.leads.count.enquiries')
      }`,
    );
    if (status) summaryParts.push(status);
    if (query.trim()) {
      summaryParts.push(
        fill(t('admin.leads.count.matching'), { q: query.trim() }),
      );
    }
  }

  const statusOptions = useMemo(
    () => [
      { value: '', label: t('admin.leads.filter.all') },
      ...statuses.map((s) => ({ value: s, label: t(`admin.leads.status.${s}`) })),
    ],
    [t],
  );

  function statusOptionsForRow() {
    return statuses.map((s) => ({ value: s, label: t(`admin.leads.status.${s}`) }));
  }

  return (
    <>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(280px, 1fr) auto auto',
          gap: '16px',
          alignItems: 'end',
          marginBottom: '1.5rem',
        }}
      >
        <div className="field" style={{ marginBottom: 0 }}>
          <label htmlFor="lead-search">{t('admin.leads.search.label')}</label>
          <input
            id="lead-search"
            type="search"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setPage(1);
            }}
            placeholder={t('admin.leads.search.placeholder')}
            maxLength={120}
          />
        </div>
        <div className="field" style={{ marginBottom: 0, minWidth: '200px' }}>
          <label htmlFor="lead-status">{t('admin.leads.filter.label')}</label>
          <Select
            id="lead-status"
            value={status}
            onChange={(v) => {
              setStatus(v);
              setPage(1);
            }}
            options={statusOptions}
            fullWidth
          />
        </div>
        <div style={{ paddingBottom: '2px' }}>
          <button
            type="button"
            className="button"
            onClick={() => {
              setPage(1);
              void load();
            }}
          >
            {t('admin.leads.action.search')}
          </button>
        </div>
      </div>

      {error && (
        <p role="alert" className="form-error" style={{ marginBottom: '1rem' }}>
          {error}{' '}
          <button
            type="button"
            className="admin-action"
            onClick={() => void load()}
          >
            {t('admin.leads.action.retry')}
          </button>
        </p>
      )}

      {result && (
        <p className="form-note" aria-live="polite" style={{ marginBottom: '1rem' }}>
          {summaryParts.join(' \u00B7 ')}
        </p>
      )}

      {result?.items.length ? (
        <div style={{ overflowX: 'auto' }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>{t('admin.leads.col.received')}</th>
                <th>{t('admin.leads.col.contact')}</th>
                <th>{t('admin.leads.col.request')}</th>
                <th>{t('admin.leads.col.status')}</th>
              </tr>
            </thead>
            <tbody>
              {result.items.map((item) => (
                <tr key={item.id}>
                  <td>{new Date(item.createdAt).toLocaleDateString()}</td>
                  <td>
                    <strong>{item.name}</strong>
                    <br />
                    <a href={`mailto:${encodeURIComponent(item.email)}`}>
                      {item.email}
                    </a>
                    {item.phone && (
                      <>
                        <br />
                        {item.phone}
                      </>
                    )}
                    {item.company && (
                      <>
                        <br />
                        <span className="form-note">{item.company}</span>
                      </>
                    )}
                  </td>
                  <td>
                    {item.message}
                    <br />
                    <span className="form-note">
                      {[
                        item.location,
                        item.interestedSolution,
                        item.interestedProduct,
                      ]
                        .filter(Boolean)
                        .join(' \u00B7 ')}
                    </span>
                  </td>
                  <td>
                    <Select
                      value={item.status}
                      onChange={(v) => void update(item.id, v)}
                      options={statusOptionsForRow()}
                      aria-label={fill(t('admin.leads.statusAria'), {
                        name: item.name,
                      })}
                      minWidth={160}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="form-note">
          {loading
            ? t('admin.leads.state.loading')
            : query || status
              ? t('admin.leads.empty.filtered')
              : t('admin.leads.empty.none')}
        </p>
      )}

      {result && result.pageCount > 1 && (
        <nav
          className="pagination"
          aria-label={t('aria.pagination.leads')}
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
            {t('admin.leads.pagination.previous')}
          </button>
          <span className="form-note">
            {fill(t('admin.leads.pagination.pageOf'), {
              page: result.page,
              count: result.pageCount,
            })}
          </span>
          <button
            className="admin-action"
            disabled={page >= result.pageCount || loading}
            onClick={() => setPage((value) => Math.min(result.pageCount, value + 1))}
          >
            {t('admin.leads.pagination.next')}
          </button>
        </nav>
      )}
    </>
  );
}