'use client';

import { useEffect } from 'react';

/**
 * Fires POST /api/admin/heartbeat every 45s while the admin panel is open.
 * Also pings immediately on mount and on window focus.
 */
export function PresenceBeacon() {
  useEffect(() => {
    let cancelled = false;

    async function ping() {
      if (cancelled) return;
      try {
        await fetch('/api/admin/heartbeat', { method: 'POST' });
      } catch {
        /* ignore network blips */
      }
    }

    ping();
    const id = setInterval(ping, 45_000);

    function onFocus() {
      ping();
    }
    window.addEventListener('focus', onFocus);

    return () => {
      cancelled = true;
      clearInterval(id);
      window.removeEventListener('focus', onFocus);
    };
  }, []);

  return null;
}