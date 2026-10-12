'use client';

import { useEffect } from 'react';

export function PresenceBeacon() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    // Dev: one ping on mount only. Production: heartbeat every 60s.
    const isDev =
      process.env.NODE_ENV !== 'production' ||
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1';

    async function ping() {
      try {
        await fetch('/api/presence', { method: 'POST' });
      } catch {}
    }

    ping();
    if (isDev) return; // no interval in dev

    const id = setInterval(ping, 60_000);
    function onFocus() { ping(); }
    window.addEventListener('focus', onFocus);
    return () => {
      clearInterval(id);
      window.removeEventListener('focus', onFocus);
    };
  }, []);

  return null;
}