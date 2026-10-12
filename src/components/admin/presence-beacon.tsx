'use client';

import { useEffect } from 'react';

export function PresenceBeacon() {
  useEffect(() => {
    let cancelled = false;

    async function ping() {
      if (cancelled) return;
      try {
        await fetch('/api/presence', { method: 'POST' });
      } catch {}
    }

    ping();
    const id = setInterval(ping, 45_000);
    function onFocus() { ping(); }
    window.addEventListener('focus', onFocus);

    return () => {
      cancelled = true;
      clearInterval(id);
      window.removeEventListener('focus', onFocus);
    };
  }, []);

  return null;
}