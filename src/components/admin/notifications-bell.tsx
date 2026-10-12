'use client';

import { useEffect, useRef, useState } from 'react';
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
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const dd = Math.floor(h / 24);
  if (dd < 7) return `${dd}d`;
  return d.toLocaleDateString([], { day: '2-digit', month: 'short' });
}

export function NotificationsBell() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Item[]>([]);
  const [unread, setUnread] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);

  async function load() {
    try {
      const res = await fetch('/api/admin/notifications', { cache: 'no-store' });
      if (!res.ok) return;
      const data = (await res.json()) as { items: Item[]; unread: number };
      setItems(data.items);
      setUnread(data.unread);
    } catch {}
  }

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      if (cancelled) return;
      try {
        const res = await fetch('/api/admin/notifications', { cache: 'no-store' });
        if (!res.ok) return;
        const data = (await res.json()) as { items: Item[]; unread: number };
        if (cancelled) return;
        setItems(data.items);
        setUnread(data.unread);
      } catch {}
    }

    poll();
    const id = setInterval(poll, 30_000);
    function onFocus() { poll(); }
    window.addEventListener('focus', onFocus);
    return () => {
      cancelled = true;
      clearInterval(id);
      window.removeEventListener('focus', onFocus);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  async function markAllRead() {
    await fetch('/api/admin/notifications/mark-read', { method: 'PATCH' });
    await load();
  }

  return (
    <div className="notif-root" ref={rootRef}>
      <button
        type="button"
        className="notif-bell"
        aria-label={t('admin.notifications.bell')}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
        {unread > 0 && (
          <span className="notif-bell__badge">{unread > 9 ? '9+' : unread}</span>
        )}
      </button>

      {open && (
        <div className="notif-panel" role="dialog" aria-label={t('admin.notifications.title')}>
          <header className="notif-panel__head">
            <strong>{t('admin.notifications.title')}</strong>
            {unread > 0 && (
              <button type="button" className="notif-panel__mark" onClick={markAllRead}>
                {t('admin.notifications.markAll')}
              </button>
            )}
          </header>

          {items.length === 0 ? (
            <p className="notif-panel__empty">{t('admin.notifications.empty')}</p>
          ) : (
            <ul className="notif-list">
              {items.slice(0, 8).map((n) => {
                const inner = (
                  <>
                    <span className="notif-item__title">{n.title}</span>
                    {n.body && <span className="notif-item__body">{n.body}</span>}
                    <span className="notif-item__time">{fmt(n.createdAt)}</span>
                  </>
                );
                return (
                  <li
                    key={n.id}
                    className={'notif-item' + (n.readAt ? '' : ' is-unread')}
                  >
                    {n.href ? (
                      <Link href={n.href} onClick={() => setOpen(false)}>
                        {inner}
                      </Link>
                    ) : (
                      <div>{inner}</div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}

          <footer className="notif-panel__foot">
            <Link href="/admin/notifications" onClick={() => setOpen(false)}>
              {t('admin.notifications.viewAll')} →
            </Link>
          </footer>
        </div>
      )}
    </div>
  );
}