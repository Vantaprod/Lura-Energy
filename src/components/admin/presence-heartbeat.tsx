'use client';
import { useEffect } from 'react';

export function PresenceHeartbeat() {
  useEffect(() => {
    let cancelled = false;
    async function ping() {
      if (cancelled) return;
      try {
        await fetch('/api/presence', { method: 'POST', credentials: 'same-origin' });
      } catch {}
    }
    ping();
    const id = window.setInterval(ping, 45_000);
    const onVisibility = () => {
      if (document.visibilityState === 'visible') ping();
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      cancelled = true;
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);
  return null;
}