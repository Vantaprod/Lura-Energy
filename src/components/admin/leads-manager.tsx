'use client';
import { useCallback, useEffect, useState } from 'react';
type Lead = { id: string; name: string; email: string; phone: string | null; location: string | null; company: string | null; interestedSolution: string | null; interestedProduct: string | null; message: string; status: string; createdAt: string };
type Result = { items: Lead[]; total: number; page: number; pageSize: number; pageCount: number };
const statuses = ['NEW', 'CONTACTED', 'QUALIFIED', 'QUOTED', 'WON', 'LOST'] as const;

export function LeadsManager() {
  const [result, setResult] = useState<Result | null>(null);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async (signal?: AbortSignal) => {
    setLoading(true); setError('');
    const params = new URLSearchParams({ page: String(page) });
    if (query.trim()) params.set('q', query.trim());
    if (status) params.set('status', status);
    try {
      const response = await fetch(`/api/admin/leads?${params}`, { signal });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? 'Could not load enquiries.');
      setResult(data);
      setPage(data.page);
    } catch (reason) {
      if (reason instanceof Error && reason.name === 'AbortError') return;
      setError(reason instanceof Error ? reason.message : 'Could not load enquiries.');
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [page, query, status]);
  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => { void load(controller.signal); }, query ? 250 : 0);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [load, query]);

  async function update(id: string, nextStatus: string) {
    setError('');
    try {
      const response = await fetch(`/api/admin/leads/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: nextStatus }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? 'Could not update enquiry.');
      await load();
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Could not update enquiry.'); }
  }

  return <>
    <form role="search" className="lead-filters" onSubmit={event => { event.preventDefault(); setPage(1); }}>
      <div className="field"><label htmlFor="lead-search">Search enquiries</label><input id="lead-search" type="search" value={query} onChange={event => { setQuery(event.target.value); setPage(1); }} placeholder="Name, email, phone, product…" maxLength={120} /></div>
      <div className="field"><label htmlFor="lead-status">Filter by status</label><select id="lead-status" value={status} onChange={event => { setStatus(event.target.value); setPage(1); }}><option value="">All statuses</option>{statuses.map(item => <option key={item} value={item}>{item}</option>)}</select></div>
      <button className="button" type="submit">Search</button>
    </form>
    {error && <p role="alert" className="form-error">{error} <button type="button" className="admin-action" onClick={() => void load()}>Retry</button></p>}
    {result && <p className="form-note" aria-live="polite">{result.total} {result.total === 1 ? 'enquiry' : 'enquiries'}{status ? ` · ${status}` : ''}{query.trim() ? ` matching “${query.trim()}”` : ''}</p>}
    {result?.items.length ? <div style={{ overflowX: 'auto' }}><table className="admin-table"><thead><tr><th>Received</th><th>Contact</th><th>Request</th><th>Status</th></tr></thead><tbody>{result.items.map(item => <tr key={item.id}><td>{new Date(item.createdAt).toLocaleDateString()}</td><td><strong>{item.name}</strong><br/><a href={`mailto:${encodeURIComponent(item.email)}`}>{item.email}</a>{item.phone && <><br/>{item.phone}</>}{item.company && <><br/><span className="form-note">{item.company}</span></>}</td><td>{item.message}<br/><span className="form-note">{[item.location, item.interestedSolution, item.interestedProduct].filter(Boolean).join(' · ')}</span></td><td><select aria-label={`Status for ${item.name}`} value={item.status} onChange={event => void update(item.id, event.target.value)}>{statuses.map(value => <option key={value}>{value}</option>)}</select></td></tr>)}</tbody></table></div> : <p className="form-note">{loading ? 'Loading enquiries…' : query || status ? 'No enquiries match these filters.' : 'No enquiries have been received.'}</p>}
    {result && result.pageCount > 1 && <nav className="pagination" aria-label="Lead pages"><button className="admin-action" disabled={page <= 1 || loading} onClick={() => setPage(value => Math.max(1, value - 1))}>Previous</button><span>Page {result.page} of {result.pageCount}</span><button className="admin-action" disabled={page >= result.pageCount || loading} onClick={() => setPage(value => Math.min(result.pageCount, value + 1))}>Next</button></nav>}
  </>;
}