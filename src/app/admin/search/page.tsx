'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslation } from '@/lib/i18n/context';

type Msg = {
  id: string;
  body: string;
  createdAt: string;
  senderId: string;
  recipientId: string;
  sender: { id: string; name: string; email: string };
  recipient: { id: string; name: string; email: string };
};

type Notif = {
  id: string;
  title: string;
  body: string | null;
  href: string | null;
  readAt: string | null;
  createdAt: string;
};

type Audit = {
  id: string;
  action: string;
  entityType: string | null;
  entityId: string | null;
  createdAt: string;
  actor: { id: string; name: string; email: string } | null;
};

function fmt(iso: string): string {
  return new Date(iso).toLocaleString([], {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function SearchInner() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useSearchParams();
  const q = params.get('q') ?? '';
  const [input, setInput] = useState(q);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{
    messages: Msg[];
    notifications: Notif[];
    audit: Audit[];
  } | null>(null);

  useEffect(() => {
    if (!q || q.length < 2) {
      setResults(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    (async () => {
      const res = await fetch(`/api/admin/search?q=${encodeURIComponent(q)}`, {
        cache: 'no-store',
      });
      if (!res.ok) {
        if (!cancelled) setLoading(false);
        return;
      }
      const data = await res.json();
      if (cancelled) return;
      setResults(data);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [q]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const v = input.trim();
    if (v.length < 2) return;
    router.push(`/admin/search?q=${encodeURIComponent(v)}`);
  }

  return (
    <section className="search-page">
      <p className="eyebrow">{t('admin.search.eyebrow')}</p>
      <h1 style={{ fontSize: '2.4rem' }}>{t('admin.search.title')}</h1>
      <p className="form-note">{t('admin.search.subtitle')}</p>

      <form className="search-bar" onSubmit={submit}>
        <input
          type="search"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t('admin.search.placeholder')}
          autoFocus
        />
        <button className="button" type="submit" disabled={input.trim().length < 2}>
          {t('admin.search.go')}
        </button>
      </form>

      {loading && <p className="form-note">{t('admin.search.loading')}</p>}

      {!loading && q && q.length < 2 && (
        <p className="form-note">{t('admin.search.tooShort')}</p>
      )}

      {!loading && results && (
        <>
          <section className="search-block">
            <h2 className="search-block__title">
              {t('admin.search.messages')}{' '}
              <span className="search-count">{results.messages.length}</span>
            </h2>
            {results.messages.length === 0 ? (
              <p className="search-empty">{t('admin.search.none')}</p>
            ) : (
              <ul className="search-list">
                {results.messages.map((m) => (
                  <li key={m.id} className="search-item">
                    <div className="search-item__main">
                      <strong>{m.sender.name || m.sender.email}</strong>
                      <span className="search-arrow">→</span>
                      <strong>{m.recipient.name || m.recipient.email}</strong>
                    </div>
                    <p className="search-item__snippet">{m.body}</p>
                    <span className="search-item__meta">{fmt(m.createdAt)}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="search-block">
            <h2 className="search-block__title">
              {t('admin.search.notifications')}{' '}
              <span className="search-count">{results.notifications.length}</span>
            </h2>
            {results.notifications.length === 0 ? (
              <p className="search-empty">{t('admin.search.none')}</p>
            ) : (
              <ul className="search-list">
                {results.notifications.map((n) => (
                  <li key={n.id} className="search-item">
                    {n.href ? (
                      <Link href={n.href} className="search-item__main">
                        <strong>{n.title}</strong>
                      </Link>
                    ) : (
                      <div className="search-item__main">
                        <strong>{n.title}</strong>
                      </div>
                    )}
                    {n.body && <p className="search-item__snippet">{n.body}</p>}
                    <span className="search-item__meta">{fmt(n.createdAt)}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {results.audit.length > 0 && (
            <section className="search-block">
              <h2 className="search-block__title">
                {t('admin.search.audit')}{' '}
                <span className="search-count">{results.audit.length}</span>
              </h2>
              <ul className="search-list">
                {results.audit.map((a) => (
                  <li key={a.id} className="search-item">
                    <div className="search-item__main">
                      <strong>{a.action}</strong>
                      {a.entityType && (
                        <span className="search-item__tag">{a.entityType}</span>
                      )}
                    </div>
                    <span className="search-item__meta">
                      {a.actor?.name ?? t('admin.search.systemActor')} · {fmt(a.createdAt)}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </section>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={null}>
      <SearchInner />
    </Suspense>
  );
}