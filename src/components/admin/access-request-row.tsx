'use client';

import { useState } from 'react';

type Item = {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  role: string;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectionReason: string | null;
  createdAt: string;
  reviewedAt: string | null;
};

function clean(s: string | null | undefined): string {
  if (!s) return '';
  return s.replace(/[\r\n\t]+/g, ' ').replace(/\s+/g, ' ').trim();
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export function AccessRequestRow({ item }: { item: Item }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [granted, setGranted] = useState<{ email: string; message: string } | null>(null);
  const [showReject, setShowReject] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejected, setRejected] = useState(item.status === 'REJECTED');

  async function approve() {
    setBusy(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/access-requests/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve' }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError((data as { error?: string }).error ?? 'Could not approve.');
        return;
      }
      setGranted({
        email: (data as { email?: string }).email ?? item.email,
        message:
          (data as { message?: string }).message ??
          `Credentials emailed to ${item.email}.`,
      });
    } catch {
      setError('Network error.');
    } finally {
      setBusy(false);
    }
  }

  async function reject() {
    setBusy(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/access-requests/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reject',
          rejectionReason: rejectReason.trim() || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError((data as { error?: string }).error ?? 'Could not reject.');
        return;
      }
      setRejected(true);
      setShowReject(false);
    } catch {
      setError('Network error.');
    } finally {
      setBusy(false);
    }
  }

  const role = clean(item.role) || 'Other';
  const fullName = clean(item.fullName);
  const reason = clean(item.reason);

  return (
    <li
      style={{
        border: '1px solid #E4E7EC',
        borderRadius: 10,
        padding: 16,
        marginBottom: 12,
        background: '#FFFFFF',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
        <strong style={{ fontSize: 16, color: '#0A1550' }}>{fullName}</strong>
        <span
          style={{
            display: 'inline-block',
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            padding: '3px 8px',
            borderRadius: 999,
            background: '#F1F5F9',
            color: '#475569',
          }}
        >
          {role}
        </span>
      </div>

      <p style={{ margin: '4px 0', color: '#1428A0', fontSize: 13 }}>
        <a href={`mailto:${item.email}`} style={{ color: '#1428A0', textDecoration: 'none' }}>
          {item.email}
        </a>
        {item.phone ? <span style={{ color: '#6B7280' }}> · {clean(item.phone)}</span> : null}
      </p>

      <p style={{ margin: '8px 0', color: '#2B3441', fontSize: 14 }}>{reason}</p>

      <p style={{ margin: '4px 0 12px', color: '#9CA3AF', fontSize: 12 }}>
        Submitted {formatDate(item.createdAt)}
        {item.reviewedAt ? ` · Reviewed ${formatDate(item.reviewedAt)}` : ''}
      </p>

      {granted && (
        <div
          style={{
            background: '#ECFDF5',
            border: '1px solid #86EFAC',
            borderRadius: 8,
            padding: 14,
            marginBottom: 10,
          }}
        >
          <p style={{ margin: 0, color: '#065F46', fontSize: 14, fontWeight: 600 }}>
            Access granted
          </p>
          <p style={{ margin: '4px 0 10px', color: '#065F46', fontSize: 13 }}>
            {granted.message}
          </p>
          <p style={{ margin: '0 0 10px', color: '#065F46', fontSize: 12 }}>
            The password was sent directly to <strong>{granted.email}</strong>. For security it
            is not shown here. Ask the user to sign in and change it from their account page.
          </p>
          <button
            type="button"
            onClick={() => setGranted(null)}
            style={{
              background: '#F58220',
              color: '#FFFFFF',
              border: 'none',
              padding: '8px 16px',
              borderRadius: 6,
              fontWeight: 700,
              cursor: 'pointer',
              fontSize: 13,
            }}
          >
            Done
          </button>
        </div>
      )}

      {rejected && !granted && (
        <div
          style={{
            background: '#FEF2F2',
            border: '1px solid #FCA5A5',
            borderRadius: 8,
            padding: 12,
            marginBottom: 10,
            color: '#991B1B',
            fontSize: 13,
          }}
        >
          <strong>Rejected.</strong>
          {item.rejectionReason ? <span> {clean(item.rejectionReason)}</span> : null}
        </div>
      )}

      {showReject && !granted && (
        <div style={{ marginBottom: 10 }}>
          <textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Optional reason (shown to user if you contact them)"
            rows={2}
            maxLength={400}
            style={{
              width: '100%',
              border: '1px solid #E4E7EC',
              borderRadius: 6,
              padding: 8,
              fontSize: 13,
              fontFamily: 'inherit',
              marginBottom: 8,
            }}
          />
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              onClick={reject}
              disabled={busy}
              style={{
                background: '#DC2626',
                color: '#FFFFFF',
                border: 'none',
                padding: '8px 16px',
                borderRadius: 6,
                fontWeight: 700,
                cursor: busy ? 'wait' : 'pointer',
                fontSize: 13,
              }}
            >
              {busy ? 'Rejecting…' : 'Confirm reject'}
            </button>
            <button
              type="button"
              onClick={() => setShowReject(false)}
              disabled={busy}
              style={{
                background: 'transparent',
                color: '#6B7280',
                border: '1px solid #E4E7EC',
                padding: '8px 16px',
                borderRadius: 6,
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: 13,
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {error && (
        <p style={{ margin: '8px 0', color: '#DC2626', fontSize: 13 }} role="alert">
          {error}
        </p>
      )}

      {item.status === 'PENDING' && !granted && !rejected && !showReject && (
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            onClick={approve}
            disabled={busy}
            style={{
              background: '#F58220',
              color: '#FFFFFF',
              border: 'none',
              padding: '10px 18px',
              borderRadius: 6,
              fontWeight: 700,
              cursor: busy ? 'wait' : 'pointer',
              fontSize: 13,
            }}
          >
            {busy ? 'Approving…' : 'Approve & email password'}
          </button>
          <button
            type="button"
            onClick={() => setShowReject(true)}
            disabled={busy}
            style={{
              background: 'transparent',
              color: '#DC2626',
              border: '1px solid #FCA5A5',
              padding: '10px 18px',
              borderRadius: 6,
              fontWeight: 600,
              cursor: 'pointer',
              fontSize: 13,
            }}
          >
            Reject
          </button>
        </div>
      )}
    </li>
  );
}