'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslation } from '@/lib/i18n/context';

type Me = {
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
};

async function toSquareJpegDataUrl(file: File, size = 256): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas unsupported');
  const side = Math.min(bitmap.width, bitmap.height);
  const sx = (bitmap.width - side) / 2;
  const sy = (bitmap.height - side) / 2;
  ctx.drawImage(bitmap, sx, sy, side, side, 0, 0, size, size);
  return canvas.toDataURL('image/jpeg', 0.85);
}

export default function AdminAccountPage() {
  const { t } = useTranslation();
  const [me, setMe] = useState<Me | null>(null);
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  // --- password change state ---
  const [pwCurrent, setPwCurrent] = useState('');
  const [pwNew, setPwNew] = useState('');
  const [pwConfirm, setPwConfirm] = useState('');
  const [pwBusy, setPwBusy] = useState(false);
  const [pwMsg, setPwMsg] = useState('');
  const [pwErr, setPwErr] = useState('');
  const [showPw, setShowPw] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetch('/api/admin/me');
      if (!res.ok) return;
      const data = (await res.json()) as Me;
      if (cancelled) return;
      setMe(data);
      setName(data.displayName ?? '');
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function save(patch: Partial<Me>) {
    setBusy(true);
    setErr('');
    setMsg('');
    try {
      const res = await fetch('/api/admin/account', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr((data as { error?: string }).error ?? 'Save failed.');
        return;
      }
      const updated = (data as { user: Me }).user;
      setMe((prev) => (prev ? { ...prev, ...updated } : prev));
      setMsg(t('admin.account.saved'));
    } finally {
      setBusy(false);
    }
  }

  async function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setErr(t('admin.account.imageOnly'));
      return;
    }
    try {
      const dataUrl = await toSquareJpegDataUrl(file);
      await save({ avatarUrl: dataUrl });
    } catch {
      setErr(t('admin.account.imageError'));
    } finally {
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  async function changePassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPwErr('');
    setPwMsg('');

    if (pwNew.length < 12) {
      setPwErr('New password must be at least 12 characters.');
      return;
    }
    if (pwNew !== pwConfirm) {
      setPwErr('New passwords do not match.');
      return;
    }
    if (pwNew === pwCurrent) {
      setPwErr('New password must be different from your current password.');
      return;
    }

    setPwBusy(true);
    try {
      const res = await fetch('/api/admin/account/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: pwCurrent,
          newPassword: pwNew,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setPwErr(
          (data as { error?: string }).error ?? 'Could not change password.',
        );
        return;
      }
      setPwCurrent('');
      setPwNew('');
      setPwConfirm('');
      setPwMsg('Password changed. All other sessions have been signed out.');
    } catch {
      setPwErr('Network error.');
    } finally {
      setPwBusy(false);
    }
  }

  if (!me) {
    return <p style={{ padding: 24 }}>…</p>;
  }

  const initials = (me.displayName || me.email || '?')
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join('');

  return (
    <div style={{ maxWidth: 640, padding: '8px 0' }}>
      <p className="eyebrow">{t('admin.account.eyebrow')}</p>
      <h1 style={{ fontSize: '2.2rem', marginTop: 4 }}>
        {t('admin.account.heading')}
      </h1>
      <p className="form-note" style={{ marginTop: 4 }}>
        {t('admin.account.subtitle')}
      </p>

      <div className="account-avatar-row">
        <div className="account-avatar">
          {me.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={me.avatarUrl} alt="" />
          ) : (
            <span>{initials || '?'}</span>
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={onPickFile}
            style={{ display: 'none' }}
          />
          <button
            type="button"
            className="button button-ghost"
            onClick={() => fileRef.current?.click()}
            disabled={busy}
          >
            {t('admin.account.changePhoto')}
          </button>
          {me.avatarUrl && (
            <button
              type="button"
              className="button button-ghost"
              onClick={() => save({ avatarUrl: null })}
              disabled={busy}
            >
              {t('admin.account.removePhoto')}
            </button>
          )}
        </div>
      </div>

      <div className="field" style={{ marginTop: '1.5rem' }}>
        <label htmlFor="displayName">{t('admin.account.displayName')}</label>
        <input
          id="displayName"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={60}
          placeholder={me.email}
        />
      </div>

      <div className="field" style={{ marginTop: '1rem' }}>
        <label>{t('admin.account.email')}</label>
        <input value={me.email} disabled />
      </div>

      {err && (
        <p className="form-error" role="alert">
          {err}
        </p>
      )}
      {msg && <p className="form-success">{msg}</p>}

      <button
        type="button"
        className="button"
        style={{ marginTop: '1.2rem' }}
        disabled={busy}
        onClick={() => save({ displayName: name })}
      >
        {busy ? t('admin.account.saving') : t('admin.account.save')}
      </button>

      {/* ============================================================
          PASSWORD CHANGE
          ============================================================ */}
      <hr
        style={{
          margin: '40px 0 24px',
          border: 0,
          borderTop: '1px solid #E4E7EC',
        }}
      />

      <h2 style={{ fontSize: '1.25rem', margin: 0, color: '#0A1550' }}>
        Change password
      </h2>
      <p
        className="form-note"
        style={{ marginTop: 6, marginBottom: 8 }}
      >
        You can change your password once every 14 days. Changing it signs you
        out of all other devices.
      </p>

      <form onSubmit={changePassword} style={{ marginTop: 16 }}>
        <div className="field" style={{ marginTop: '1rem' }}>
          <label htmlFor="currentPassword">Current password</label>
          <input
            id="currentPassword"
            type={showPw ? 'text' : 'password'}
            value={pwCurrent}
            onChange={(e) => setPwCurrent(e.target.value)}
            autoComplete="current-password"
            required
            maxLength={200}
          />
        </div>

        <div className="field" style={{ marginTop: '1rem' }}>
          <label htmlFor="newPassword">New password</label>
          <input
            id="newPassword"
            type={showPw ? 'text' : 'password'}
            value={pwNew}
            onChange={(e) => setPwNew(e.target.value)}
            autoComplete="new-password"
            required
            minLength={12}
            maxLength={200}
          />
          <p
            style={{
              fontSize: 12,
              color: '#6B7280',
              margin: '4px 0 0',
            }}
          >
            At least 12 characters.
          </p>
        </div>

        <div className="field" style={{ marginTop: '1rem' }}>
          <label htmlFor="confirmPassword">Confirm new password</label>
          <input
            id="confirmPassword"
            type={showPw ? 'text' : 'password'}
            value={pwConfirm}
            onChange={(e) => setPwConfirm(e.target.value)}
            autoComplete="new-password"
            required
            minLength={12}
            maxLength={200}
          />
        </div>

        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginTop: 14,
            fontSize: 13,
            color: '#2B3441',
          }}
        >
          <input
            type="checkbox"
            checked={showPw}
            onChange={(e) => setShowPw(e.target.checked)}
          />
          Show passwords
        </label>

        {pwErr && (
          <p className="form-error" role="alert" style={{ marginTop: 12 }}>
            {pwErr}
          </p>
        )}
        {pwMsg && (
          <p className="form-success" style={{ marginTop: 12 }}>
            {pwMsg}
          </p>
        )}

        <button
          type="submit"
          className="button"
          style={{ marginTop: '1.2rem' }}
          disabled={pwBusy}
        >
          {pwBusy ? 'Changing…' : 'Change password'}
        </button>
      </form>
    </div>
  );
}