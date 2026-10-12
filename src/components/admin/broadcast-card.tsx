'use client';

import { useState } from 'react';
import { useTranslation } from '@/lib/i18n/context';

export function BroadcastCard() {
  const { t } = useTranslation();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr('');
    setMsg('');
    if (!title.trim()) {
      setErr(t('master.broadcast.errorTitle'));
      return;
    }
    if (
      !window.confirm(
        t('master.broadcast.confirm').replace('{title}', title.trim()),
      )
    )
      return;

    setBusy(true);
    try {
      const res = await fetch('/api/admin/master/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), body: body.trim() }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        delivered?: number;
        error?: string;
      };
      if (!res.ok) {
        setErr(data.error ?? t('master.broadcast.errorGeneric'));
        return;
      }
      setMsg(
        t('master.broadcast.sent').replace('{n}', String(data.delivered ?? 0)),
      );
      setTitle('');
      setBody('');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="broadcast-card">
      <header className="broadcast-card__head">
        <div>
          <h3 className="broadcast-card__title">{t('master.broadcast.title')}</h3>
          <p className="broadcast-card__sub">{t('master.broadcast.subtitle')}</p>
        </div>
      </header>

      <form onSubmit={submit} className="broadcast-form">
        <div className="field">
          <label htmlFor="bc-title">{t('master.broadcast.fieldTitle')}</label>
          <input
            id="bc-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={120}
            placeholder={t('master.broadcast.titlePlaceholder')}
            required
          />
        </div>

        <div className="field">
          <label htmlFor="bc-body">{t('master.broadcast.fieldBody')}</label>
          <textarea
            id="bc-body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            maxLength={2000}
            rows={4}
            placeholder={t('master.broadcast.bodyPlaceholder')}
          />
        </div>

        {err && (
          <p className="form-error" role="alert">
            {err}
          </p>
        )}
        {msg && <p className="form-success">{msg}</p>}

        <button
          type="submit"
          className="button"
          disabled={busy || !title.trim()}
        >
          {busy ? t('master.broadcast.sending') : t('master.broadcast.send')}
        </button>
      </form>
    </section>
  );
}