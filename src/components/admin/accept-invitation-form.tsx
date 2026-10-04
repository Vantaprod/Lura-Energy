'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/lib/i18n/context';

export function AcceptInvitationForm() {
  const { t } = useTranslation();
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [token, setToken] = useState('');
  const router = useRouter();

  useEffect(() => {
    const value = new URLSearchParams(window.location.hash.slice(1)).get('token') ?? '';
    setToken(value);
    window.history.replaceState(null, '', window.location.pathname);
  }, []);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const r = await fetch('/api/auth/accept-invitation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...Object.fromEntries(form.entries()), token }),
    });
    if (!r.ok) {
      setError((await r.json()).error);
      return;
    }
    setDone(true);
    setTimeout(() => router.push('/admin/login'), 1200);
  }

  return (
    <form className="admin-login" onSubmit={submit}>
      <p className="eyebrow">{t('admin.invite.eyebrow')}</p>
      <h1 style={{ fontSize: '2.3rem' }}>{t('admin.invite.title')}</h1>
      {done ? (
        <p>{t('admin.invite.success')}</p>
      ) : (
        <>
          <div className="field">
            <label htmlFor="invite-name">{t('admin.invite.field.name')}</label>
            <input id="invite-name" name="name" required minLength={2} maxLength={120} />
          </div>
          <div className="field">
            <label htmlFor="invite-password">{t('admin.invite.field.password')}</label>
            <input
              id="invite-password"
              type="password"
              name="password"
              required
              minLength={12}
              maxLength={200}
              autoComplete="new-password"
            />
          </div>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <button className="button" disabled={!token}>
            {t('admin.invite.action.activate')}
          </button>
          {!token && <p className="form-note">{t('admin.invite.note.noToken')}</p>}
        </>
      )}
    </form>
  );
}