'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/lib/i18n/context';
import { LANGUAGES, type Lang } from '@/lib/i18n/dictionaries';

export function LanguageSwitcher({
  compact = false,
  showCode = true,
}: {
  compact?: boolean;
  showCode?: boolean;
}) {
  const router = useRouter();
  const { lang, scope, setLang } = useTranslation();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      const target = e.target as HTMLElement | null;
      if (target && !target.closest('[data-lang-switcher]')) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const current = LANGUAGES.find((l) => l.code === lang) ?? LANGUAGES[0];

  async function choose(code: Lang) {
    if (busy || code === lang) {
      setOpen(false);
      return;
    }

    // 1) Update client state immediately — nav, buttons, headings flip instantly.
    setLang(code);
    setOpen(false);

    // 2) Admin scope: wait for the DB write, then re-render server content.
    //    Front and login scopes only need the client-side cookie, which
    //    setLang() already wrote. Nothing more to do.
    if (scope === 'admin') {
      setBusy(true);
      try {
        await fetch('/api/admin/language', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lang: code }),
        });
      } catch {
        // Network blip — polling will retry the sync within 1s.
      } finally {
        setBusy(false);
      }
      router.refresh();
    }
  }

  return (
    <div style={{ position: 'relative' }} data-lang-switcher>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Change language"
        aria-expanded={open}
        disabled={busy}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '5px',
          background: '#FFFFFF',
          border: '1px solid #E4E7EC',
          cursor: busy ? 'wait' : 'pointer',
          padding: compact ? '6px 8px' : '8px 12px',
          borderRadius: '6px',
          color: '#0A1550',
          fontWeight: 600,
          fontFamily: 'inherit',
          fontSize: '13px',
          lineHeight: 1,
          opacity: busy ? 0.7 : 1,
        }}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="2" y1="12" x2="22" y2="12" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
        {showCode && <span>{current.code.toUpperCase()}</span>}
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            right: 0,
            background: '#FFFFFF',
            border: '1px solid #E4E7EC',
            borderRadius: '8px',
            boxShadow: '0 12px 32px rgba(5, 14, 31, 0.14)',
            minWidth: '170px',
            overflow: 'hidden',
            zIndex: 200,
          }}
        >
          {LANGUAGES.map((l) => (
            <button
              key={l.code}
              type="button"
              onClick={() => void choose(l.code)}
              disabled={busy}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                padding: '11px 16px',
                background: lang === l.code ? '#E8EEF9' : 'transparent',
                border: 0,
                cursor: busy ? 'wait' : 'pointer',
                fontFamily: 'inherit',
                fontSize: '14px',
                fontWeight: lang === l.code ? 700 : 500,
                color: lang === l.code ? '#1428A0' : '#0A1550',
                textAlign: 'left',
              }}
            >
              <span>{l.native}</span>
              <span
                style={{
                  fontSize: '11px',
                  color: '#6B7686',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  fontWeight: 700,
                }}
              >
                {l.code}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}