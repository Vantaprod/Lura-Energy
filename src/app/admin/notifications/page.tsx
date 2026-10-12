'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslation } from '@/lib/i18n/context';

type Item = {
  id: string;
  kind: string;
  title: string;
  body: string | null;
  href: string | null;
  readAt: string | null;
  createdAt: string;
};

function fmt(iso: string): string {
  return new Date(iso).toLocaleString([], {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function NotificationsPage() {
  const { t } = useTranslation();
  const [items, setItems] = useState<Item[]>([]);
  const [unread, setUnread] = useState(0);
  const [busy, setBusy] = useState(false);

  async function load() {
    const res = await fetch('/api/admin/notifications', { cache: 'no-store' });
    if (!res.ok) return;
    const data = (await res.json()) as { items: Item[]; unread: number };
    setItems(data.items);
    setUnread(data.unread);
  }

  useEffect(() => {
    void load();
  }, []);

  async function markAll() {
    setBusy(true);
    try {
      await fetch('/api/admin/notifications/mark-read', { method: 'PATCH' });
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function markOne(id: string) {
    await fetch('/api/admin/notifications/mark-read', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: [id] }),
    });
    await load();
  }

  return (
    <section className="np">
      <div className="np-wrap">
        <header className="np-head">
          <p className="np-eyebrow">{t('admin.notifications.eyebrow')}</p>
          <h1 className="np-title">{t('admin.notifications.title')}</h1>
          <p className="np-subtitle">{t('admin.notifications.subtitle')}</p>

          {unread > 0 && (
            <button
              className="np-markall"
              onClick={markAll}
              disabled={busy}
              type="button"
            >
              {busy ? t('admin.notifications.saving') : t('admin.notifications.markAll')}
            </button>
          )}
        </header>

        {items.length === 0 ? (
          <div className="np-empty">
            <div className="np-empty-icon" aria-hidden="true">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
              </svg>
            </div>
            <p className="np-empty-title">{t('admin.notifications.empty')}</p>
            <p className="np-empty-sub">{t('admin.notifications.emptySub')}</p>
          </div>
        ) : (
          <ul className="np-list">
            {items.map((n) => (
              <li
                key={n.id}
                className={'np-card' + (n.readAt ? '' : ' np-card--unread')}
              >
                <div className="np-card-top">
                  {!n.readAt && (
                    <span className="np-dot" aria-label="unread" />
                  )}
                  <h2 className="np-card-title">{n.title}</h2>
                </div>

                {n.body && <p className="np-card-body">{n.body}</p>}

                <div className="np-card-foot">
                  <span className="np-card-time">{fmt(n.createdAt)}</span>

                  <div className="np-card-actions">
                    {n.href && (
                      <Link href={n.href} className="np-btn np-btn--primary">
                        {t('admin.notifications.open')}
                      </Link>
                    )}
                    {!n.readAt && (
                      <button
                        type="button"
                        className="np-btn np-btn--ghost"
                        onClick={() => markOne(n.id)}
                      >
                        {t('admin.notifications.markOne')}
                      </button>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}