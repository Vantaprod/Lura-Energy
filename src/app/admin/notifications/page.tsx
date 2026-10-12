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
    day: '2-digit',
    month: 'short',
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

  useEffect(() => { void load(); }, []);

  async function markAll() {
    setBusy(true);
    try {
      await fetch('/api/admin/notifications/mark-read', { method: 'PATCH' });
      await load();
    } finally { setBusy(false); }
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
    <section className="notif-page">
      <header className="notif-page__head">
        <div>
          <p className="eyebrow">{t('admin.notifications.eyebrow')}</p>
          <h1 style={{ fontSize: '2.4rem' }}>{t('admin.notifications.title')}</h1>
          <p className="form-note">{t('admin.notifications.subtitle')}</p>
        </div>
        {unread > 0 && (
          <button className="button button-ghost" onClick={markAll} disabled={busy}>
            {t('admin.notifications.markAll')}
          </button>
        )}
      </header>

      {items.length === 0 ? (
        <p className="form-note">{t('admin.notifications.empty')}</p>
      ) : (
        <ul className="notif-page__list">
          {items.map((n) => (
            <li key={n.id} className={'notif-page__item' + (n.readAt ? '' : ' is-unread')}>
              <div className="notif-page__item-main">
                <strong>{n.title}</strong>
                {n.body && <p>{n.body}</p>}
                <span className="notif-page__item-meta">
                  {n.kind} · {fmt(n.createdAt)}
                </span>
              </div>
              <div className="notif-page__item-actions">
                {n.href && (
                  <Link href={n.href} className="admin-action">
                    {t('admin.notifications.open')}
                  </Link>
                )}
                {!n.readAt && (
                  <button className="admin-action" onClick={() => markOne(n.id)}>
                    {t('admin.notifications.markOne')}
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}