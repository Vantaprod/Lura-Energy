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
    const id = setInterval(poll, 120_000);
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

  const bellStyle: React.CSSProperties = {
    position: 'relative',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 36,
    height: 36,
    borderRadius: 8,
    background: '#EEF1F7',
    color: '#0A1550',
    border: 'none',
    padding: 0,
    margin: 0,
    cursor: 'pointer',
    fontFamily: 'inherit',
    boxShadow: 'none',
    outline: 'none',
  };

  return (
    <div style={{ position: 'relative' }} ref={rootRef}>
      <button
        type="button"
        style={bellStyle}
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
          style={{ display: 'block', color: 'inherit' }}
        >
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
        {unread > 0 && (
          <span
            style={{
              position: 'absolute',
              top: -4,
              right: -4,
              minWidth: 18,
              height: 18,
              padding: '0 5px',
              borderRadius: 9,
              background: '#DC2626',
              color: '#fff',
              fontSize: 10.5,
              fontWeight: 700,
              display: 'grid',
              placeItems: 'center',
              border: '2px solid #fff',
            }}
          >
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label={t('admin.notifications.title')}
          style={{
            position: 'absolute',
            top: 44,
            right: 0,
            width: 340,
            maxWidth: '90vw',
            background: '#fff',
            border: '1px solid #E3E7EF',
            borderRadius: 12,
            boxShadow: '0 12px 32px rgba(5,14,31,0.14)',
            zIndex: 60,
            overflow: 'hidden',
          }}
        >
          <header
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 14px',
              borderBottom: '1px solid #F1F3F8',
              fontSize: 13.5,
              color: '#0A1550',
            }}
          >
            <strong>{t('admin.notifications.title')}</strong>
            {unread > 0 && (
              <button
                type="button"
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#1428A0',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
                onClick={markAllRead}
              >
                {t('admin.notifications.markAll')}
              </button>
            )}
          </header>

          {items.length === 0 ? (
            <p
              style={{
                padding: '24px 16px',
                margin: 0,
                textAlign: 'center',
                color: '#97A1B2',
                fontSize: 13,
              }}
            >
              {t('admin.notifications.empty')}
            </p>
          ) : (
            <ul
              style={{
                listStyle: 'none',
                margin: 0,
                padding: 0,
                maxHeight: 400,
                overflowY: 'auto',
              }}
            >
              {items.slice(0, 8).map((n) => {
                const inner = (
                  <span style={{ display: 'block', padding: '12px 14px', textDecoration: 'none', color: 'inherit' }}>
                    <span style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#0A1550' }}>
                      {n.title}
                    </span>
                    {n.body && (
                      <span style={{ display: 'block', fontSize: 12, color: '#6B7686', marginTop: 2 }}>
                        {n.body}
                      </span>
                    )}
                    <span style={{ display: 'block', fontSize: 11, color: '#97A1B2', marginTop: 4 }}>
                      {fmt(n.createdAt)}
                    </span>
                  </span>
                );
                return (
                  <li
                    key={n.id}
                    style={{
                      borderBottom: '1px solid #F1F3F8',
                      background: n.readAt ? 'transparent' : '#F7F9FF',
                    }}
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

          <footer
            style={{
              padding: '10px 14px',
              textAlign: 'center',
              borderTop: '1px solid #F1F3F8',
            }}
          >
            <Link
              href="/admin/notifications"
              onClick={() => setOpen(false)}
              style={{ color: '#1428A0', fontSize: 12.5, fontWeight: 700, textDecoration: 'none' }}
            >
              {t('admin.notifications.viewAll')} →
            </Link>
          </footer>
        </div>
      )}
    </div>
  );
}