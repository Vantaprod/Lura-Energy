'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Item = {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectionReason: string | null;
  createdAt: string;
  reviewedAt: string | null;
};

export function AccessRequestRow({ item }: { item: Item }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [showReject, setShowReject] = useState(false);
  const [rejection, setRejection] = useState('');
  const [temp, setTemp] = useState<{ password: string; email: string } | null>(null);

  async function call(action: 'approve' | 'reject', rejectionReason?: string) {
    setBusy(true);
    setErr('');
    try {
      const res = await fetch(`/api/admin/access-requests/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, rejectionReason }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr((data as { error?: string }).error ?? 'Failed');
        return;
      }
      if (action === 'approve' && (data as { tempPassword?: string }).tempPassword) {
        setTemp({ password: (data as { tempPassword: string }).tempPassword, email: item.email });
      } else {
        router.refresh();
      }
    } catch {
      setErr('Network error');
    } finally {
      setBusy(false);
    }
  }

  const badge =
    item.status === 'PENDING' ? { bg: '#FEF3C7', fg: '#92400E', label: 'Pending' } :
    item.status === 'APPROVED' ? { bg: '#DCFCE7', fg: '#166534', label: 'Approved' } :
    { bg: '#FEE2E2', fg: '#991B1B', label: 'Rejected' };

  return (
    <li className="ar-row">
      <div className="ar-row__head">
        <div>
          <p className="ar-row__name">{item.fullName}</p>
          <p className="ar-row__meta">
            <a href={`mailto:${item.email}`} className="ar-row__email">{item.email}</a>
            {item.phone ? <> · <a href={`tel:${item.phone}`}>{item.phone}</a></> : null}
          </p>
        </div>
        <span className="ar-badge" style={{ background: badge.bg, color: badge.fg }}>{badge.label}</span>
      </div>

      <p className="ar-row__reason">{item.reason}</p>

      <p className="ar-row__date">
        Submitted {new Date(item.createdAt).toLocaleString()}
        {item.reviewedAt ? ` · Reviewed ${new Date(item.reviewedAt).toLocaleString()}` : ''}
      </p>

      {item.rejectionReason && (
        <p className="ar-row__rejection">Reason: {item.rejectionReason}</p>
      )}

      {err && <p className="form-error">{err}</p>}

      {temp && (
        <div className="ar-row__temp">
          <p><strong>Access granted.</strong> Share these credentials with the user (shown once):</p>
          <p className="ar-temp-creds">
            <code>{temp.email}</code><br />
            <code>{temp.password}</code>
          </p>
          <button className="button button-quiet" onClick={() => { setTemp(null); router.refresh(); }}>Done</button>
        </div>
      )}

      {!temp && item.status === 'PENDING' && !showReject && (
        <div className="ar-row__actions">
          <button className="button" disabled={busy} onClick={() => call('approve')}>Approve & create login</button>
          <button className="button button-quiet" disabled={busy} onClick={() => setShowReject(true)}>Reject</button>
        </div>
      )}

      {!temp && item.status === 'PENDING' && showReject && (
        <div className="ar-row__actions">
          <input
            type="text"
            placeholder="Reason for rejection (optional)"
            value={rejection}
            onChange={(e) => setRejection(e.target.value)}
            maxLength={400}
            className="ar-input"
          />
          <button className="button" disabled={busy} onClick={() => call('reject', rejection || undefined)}>Confirm reject</button>
          <button className="button button-quiet" disabled={busy} onClick={() => setShowReject(false)}>Cancel</button>
        </div>
      )}
    </li>
  );
}