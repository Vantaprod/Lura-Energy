'use client';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from '@/lib/i18n/context';

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
  interest: string | null;
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

const INTEREST_LABELS: Record<string, string> = {
  product: 'Product enquiry',
  partnership: 'Partnership / distribution',
  support: 'Technical support',
  visit: 'Request a site visit',
  other: 'Other',
};

function InterestBadge({ value }: { value: string | null }) {
  if (!value) return null;
  const label = INTEREST_LABELS[value] ?? value;
  return (
    <span
      style={{
        display: 'inline-block',
        marginTop: 6,
        padding: '2px 10px',
        borderRadius: 999,
        background: '#FFF3E8',
        color: '#B35A0E',
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: '0.02em',
      }}
    >
      {label}
    </span>
  );
}

function fill(template: string, vars: Record<string, string | number>): string {
  return Object.entries(vars).reduce(
    (acc, [key, value]) => acc.replaceAll(`{${key}}`, String(value)),
    template,
  );
}

const DownloadIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

export function LeadsManager() {
  const { t } = useTranslation();
  const [result, setResult] = useState<Result | null>(null);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError('');
    const params = new URLSearchParams({ page: String(page) });
    if (query.trim()) params.set('q', query.trim());
    if (status) params.set('status', status);
    try {
      const response = await fetch(`/api/admin/leads?${params}`, { signal });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? t('admin.leads.error.load'));
      setResult(data);
      setPage(data.page);
    } catch (reason) {
      if (reason instanceof Error && reason.name === 'AbortError') return;
      setError(reason instanceof Error ? reason.message : t('admin.leads.error.load'));
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, query, status]);

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => { void load(controller.signal); }, query ? 250 : 0);
    return () => { clearTimeout(timer); controller.abort(); };
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
      setError(reason instanceof Error ? reason.message : t('admin.leads.error.update'));
    }
  }

  const exportHref = useMemo(() => {
    const p = new URLSearchParams();
    if (query.trim()) p.set('q', query.trim());
    if (status) p.set('status', status);
    const qs = p.toString();
    return '/api/admin/leads/export' + (qs ? '?' + qs : '');
  }, [query, status]);

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

  return (
    <>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(240px, 1fr) minmax(180px, 220px) auto auto',
          gap: '16px',
          alignItems: 'end',
          marginBottom: '1.5rem',
        }}
      >
        <div className="field">
          <label htmlFor="lead-search">{t('admin.leads.search.label')}</label>
          <input
            id="lead-search"
            type="search"
            value={query}
            onChange={(event) => { setQuery(event.target.value); setPage(1); }}
            placeholder={t('admin.leads.search.placeholder')}
            maxLength={120}
          />
        </div>
        <div className="field" style={{ marginBottom: 0 }}>
          <label htmlFor="lead-status">{t('admin.leads.filter.label')}</label>
          <select
            id="lead-status"
            value={status}
            onChange={(event) => { setStatus(event.target.value); setPage(1); }}
          >
            <option value="">{t('admin.leads.filter.all')}</option>
            {statuses.map((item) => (
              <option key={item} value={item}>
                {t(`admin.leads.status.${item}`)}
              </option>
            ))}
          </select>
        </div>
        <div style={{ paddingBottom: '2px' }}>
          <a
            href={exportHref}
            className="admin-action"
            download
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              height: '42px',
              padding: '0 18px',
              textDecoration: 'none',
              fontWeight: 700,
              whiteSpace: 'nowrap',
            }}
          >
            <DownloadIcon />
            {t('admin.leads.action.export')}
          </a>
        </div>
      </div>

      {error && (
        <p role="alert" className="form-error">
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
        <p className="form-note" aria-live="polite">
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
                    <InterestBadge value={item.interest} />
                    <br />
                    <span className="form-note">
                      {[item.location, item.interestedSolution, item.interestedProduct]
                        .filter(Boolean)
                        .join(' \u00B7 ')}
                    </span>
                  </td>
                  <td>
                    <select
                      aria-label={fill(t('admin.leads.statusAria'), { name: item.name })}
                      value={item.status}
                      onChange={(event) => void update(item.id, event.target.value)}
                    >
                      {statuses.map((value) => (
                        <option key={value} value={value}>
                          {t(`admin.leads.status.${value}`)}
                        </option>
                      ))}
                    </select>
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
       <nav className="pagination" aria-label={t('aria.pagination.leads')}>
          <button
            className="admin-action"
            disabled={page <= 1 || loading}
            onClick={() => setPage((value) => Math.max(1, value - 1))}
          >
            {t('admin.leads.pagination.previous')}
          </button>
          <span>
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
