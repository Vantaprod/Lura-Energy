'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslation } from '@/lib/i18n/context';

export function MessagesBell() {
  const { t } = useTranslation();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      try {
        const res = await fetch('/api/admin/messages', { cache: 'no-store' });
        if (!res.ok) return;
        const data = (await res.json()) as { totalUnread?: number };
        if (!cancelled) setUnread(data.totalUnread ?? 0);
      } catch {
        /* ignore */
      }
    }

    poll();
    const id = setInterval(poll, 45_000);

    function onFocus() {
      poll();
    }
    window.addEventListener('focus', onFocus);

    return () => {
      cancelled = true;
      clearInterval(id);
      window.removeEventListener('focus', onFocus);
    };
  }, []);

  return (
    <Link
      href="/admin/messages"
      className="msg-bell"
      aria-label={t('admin.messages.bell')}
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
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
      {unread > 0 && (
        <span className="msg-bell__badge">{unread > 9 ? '9+' : unread}</span>
      )}
    </Link>
  );
}