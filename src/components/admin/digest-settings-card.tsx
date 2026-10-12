'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from '@/lib/i18n/context';

type State = {
  enabled: boolean;
  frequency: 'daily' | 'weekly';
  lastRunAt: string | null;
};

function fmt(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString([], {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function DigestSettingsCard() {
  const { t } = useTranslation();
  const [state, setState] = useState<State | null>(null);
  const [busy, setBusy] = useState(false);
  const [running, setRunning] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  async function load() {
    const res = await fetch('/api/admin/master/digest', { cache: 'no-store' });
    if (!res.ok) return;
    setState(await res.json());
  }

  useEffect(() => {
    void load();
  }, []);

  async function update(patch: Partial<State>) {
    setBusy(true);
    setErr('');
    setMsg('');
    try {
      const res = await fetch('/api/admin/master/digest', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setErr(data.error ?? t('master.digest.errorGeneric'));
        return;
      }
      setMsg(t('master.digest.saved'));
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function runNow() {
    setRunning(true);
    setErr('');
    setMsg('');
    try {
      const res = await fetch('/api/admin/master/digest/run', { method: 'POST' });
      const data = (await res.json().catch(() => ({}))) as {
        sent?: number;
        total?: number;
        failures?: string[];
        error?: string;
      };
      if (!res.ok) {
        setErr(data.error ?? t('master.digest.errorGeneric'));
        return;
      }
      setMsg(
        t('master.digest.runResult')
          .replace('{sent}', String(data.sent ?? 0))
          .replace('{total}', String(data.total ?? 0)),
      );
      if (data.failures && data.failures.length > 0) {
        setErr(data.failures.slice(0, 3).join(' · '));
      }
      await load();
    } finally {
      setRunning(false);
    }
  }

  if (!state) return null;

  return (
    <section className="digest-card">
      <header className="digest-card__head">
        <div>
          <h3 className="digest-card__title">{t('master.digest.title')}</h3>
          <p className="digest-card__sub">{t('master.digest.subtitle')}</p>
        </div>
      </header>

      <div className="digest-row">
        <label className="digest-switch">
          <input
            type="checkbox"
            checked={state.enabled}
            onChange={(e) => void update({ enabled: e.target.checked })}
            disabled={busy}
          />
          <span>{state.enabled ? t('master.digest.on') : t('master.digest.off')}</span>
        </label>

        <div className="digest-freq">
          <label htmlFor="digest-freq">{t('master.digest.frequency')}</label>
          <select
            id="digest-freq"
            value={state.frequency}
            onChange={(e) =>
              void update({ frequency: e.target.value as 'daily' | 'weekly' })
            }
            disabled={busy || !state.enabled}
          >
            <option value="daily">{t('master.digest.daily')}</option>
            <option value="weekly">{t('master.digest.weekly')}</option>
          </select>
        </div>

        <button
          type="button"
          className="button button-ghost"
          onClick={runNow}
          disabled={running}
        >
          {running ? t('master.digest.running') : t('master.digest.runNow')}
        </button>
      </div>

      <p className="digest-meta">
        {t('master.digest.lastRun')}: {fmt(state.lastRunAt)}
      </p>

      {err && (
        <p className="form-error" role="alert">
          {err}
        </p>
      )}
      {msg && <p className="form-success">{msg}</p>}
    </section>
  );
}