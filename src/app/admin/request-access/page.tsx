'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTranslation } from '@/lib/i18n/context';
import { LanguageSwitcher } from '@/components/layout/language-switcher';

export default function RequestAccessPage() {
  const { t } = useTranslation();
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError('');
    const form = new FormData(e.currentTarget);
    try {
      const res = await fetch('/api/access-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: form.get('fullName'),
          email: form.get('email'),
          phone: form.get('phone'),
          reason: form.get('reason'),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError((data as { error?: string }).error ?? t('admin.requestAccess.error'));
        return;
      }
      setDone(true);
    } catch {
      setError(t('admin.requestAccess.error'));
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="admin-shell" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '16px 0' }}>
          <LanguageSwitcher />
        </div>
        <div className="admin-login">
          <p className="eyebrow">{t('admin.requestAccess.eyebrow')}</p>
          <h1 style={{ fontSize: '2.2rem' }}>{t('admin.requestAccess.thanksTitle')}</h1>
          <p className="form-note">{t('admin.requestAccess.thanksBody')}</p>
          <p style={{ marginTop: '1.5rem' }}>
            <Link href="/admin/login" className="button" style={{ display: 'inline-block', textDecoration: 'none' }}>
              {t('admin.requestAccess.backToLogin')}
            </Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-shell" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '16px 0' }}>
        <LanguageSwitcher />
      </div>
      <form className="admin-login" onSubmit={submit}>
        <p className="eyebrow">{t('admin.requestAccess.eyebrow')}</p>
        <h1 style={{ fontSize: '2.2rem' }}>{t('admin.requestAccess.heading')}</h1>
        <p className="form-note">{t('admin.requestAccess.subtitle')}</p>

        <div className="field" style={{ marginTop: '1rem' }}>
          <label htmlFor="fullName">{t('admin.requestAccess.fullName')}</label>
          <input id="fullName" name="fullName" type="text" autoComplete="name" required maxLength={120} />
        </div>

        <div className="field" style={{ marginTop: '1rem' }}>
          <label htmlFor="email">{t('admin.requestAccess.email')}</label>
          <input id="email" name="email" type="email" autoComplete="email" required maxLength={254} />
        </div>

        <div className="field" style={{ marginTop: '1rem' }}>
          <label htmlFor="phone">{t('admin.requestAccess.phone')}</label>
          <input id="phone" name="phone" type="tel" autoComplete="tel" maxLength={40} />
        </div>

        <div className="field" style={{ marginTop: '1rem' }}>
          <label htmlFor="reason">{t('admin.requestAccess.reason')}</label>
          <textarea
            id="reason"
            name="reason"
            required
            minLength={20}
            maxLength={800}
            rows={4}
            style={{ width: '100%', fontFamily: 'inherit', fontSize: '15px', padding: '12px', border: '1px solid #CFD6E2', borderRadius: '8px', resize: 'vertical' }}
          />
        </div>

        {error && (
          <p className="form-error" role="alert">{error}</p>
        )}

        <button className="button" style={{ marginTop: '1.2rem' }} disabled={busy}>
          {busy ? t('admin.requestAccess.submitting') : t('admin.requestAccess.submit')}
        </button>

        <p style={{ marginTop: '1.25rem', textAlign: 'center' }}>
          <Link href="/admin/login" style={{ color: '#1428A0', textDecoration: 'none', fontWeight: 600, fontSize: '14px' }}>
            {t('admin.requestAccess.backToLogin')}
          </Link>
        </p>
      </form>
    </div>
  );
}