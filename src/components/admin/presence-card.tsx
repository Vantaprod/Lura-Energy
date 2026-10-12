'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from '@/lib/i18n/context';

type Row = {
  id: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
  role: string;
  online: boolean;
  lastSeenAt: string | null;
};

export function PresenceCard() {
  const { t } = useTranslation();
  const [rows, setRows] = useState<Row[]>([]);
  const [online, setOnline] = useState(0);
  const [total, setTotal] = useState(0);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const res = await fetch('/api/admin/presence');
      if (!res.ok) {
        if (!cancelled) setHidden(true);
        return;
      }
      const data = (await res.json()) as {
        admins: Row[];
        online: number;
        total: number;
      };
      if (cancelled) return;
      setRows(data.admins);
      setOnline(data.online);
      setTotal(data.total);
    }

    load();
    const id = setInterval(load, 30_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  if (hidden) return null;

  return (
    <section className="presence-card">
      <header className="presence-head">
        <h3>{t('admin.presence.heading')}</h3>
        <span className="presence-count">
          <span className="presence-dot" /> {online} / {total}
        </span>
      </header>
      <ul className="presence-list">
        {rows.map((r) => {
          const initials = (r.displayName || r.email || '?')
            .split(/[\s@.]+/)
            .filter(Boolean)
            .slice(0, 2)
            .map((s) => s[0]?.toUpperCase())
            .join('');
          return (
            <li key={r.id} className="presence-row">
              <span className={'presence-avatar' + (r.online ? ' is-online' : '')}>
                {r.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={r.avatarUrl} alt="" />
                ) : (
                  initials || '?'
                )}
              </span>
              <span className="presence-meta">
                <span className="presence-name">{r.displayName || r.email}</span>
                <span className="presence-role">{r.role}</span>
              </span>
              <span className={'presence-status' + (r.online ? ' is-online' : '')}>
                {r.online ? t('admin.presence.online') : t('admin.presence.offline')}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}