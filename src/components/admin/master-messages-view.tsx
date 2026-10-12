'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from '@/lib/i18n/context';

type Participant = {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  role: string;
};

type Pair = {
  pairKey: string;
  a: Participant;
  b: Participant;
  messageCount: number;
  unreadCount: number;
  lastMessage: { body: string; createdAt: string; fromId: string };
  lastActivity: string;
};

type Msg = {
  id: string;
  fromId: string;
  body: string;
  readAt: string | null;
  createdAt: string;
};

function initials(s: string): string {
  return s
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((x) => x[0]?.toUpperCase())
    .join('');
}

function fmtRel(iso: string): string {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'now';
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const dd = Math.floor(h / 24);
  if (dd < 7) return `${dd}d`;
  return d.toLocaleDateString([], { day: '2-digit', month: 'short' });
}

function fmtFull(iso: string): string {
  return new Date(iso).toLocaleString([], {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function MasterMessagesView() {
  const { t } = useTranslation();
  const [pairs, setPairs] = useState<Pair[]>([]);
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [thread, setThread] = useState<Msg[]>([]);
  const [loadingThread, setLoadingThread] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetch('/api/admin/master/messages', { cache: 'no-store' });
      if (!res.ok) {
        if (!cancelled) setLoaded(true);
        return;
      }
      const data = (await res.json()) as { pairs: Pair[] };
      if (cancelled) return;
      setPairs(data.pairs);
      setLoaded(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!activeKey) return;
    let cancelled = false;
    setLoadingThread(true);
    (async () => {
      const res = await fetch(`/api/admin/master/messages/${activeKey}`, {
        cache: 'no-store',
      });
      if (!res.ok) {
        if (!cancelled) {
          setThread([]);
          setLoadingThread(false);
        }
        return;
      }
      const data = (await res.json()) as { messages: Msg[] };
      if (cancelled) return;
      setThread(data.messages);
      setLoadingThread(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [activeKey]);

  const activePair = pairs.find((p) => p.pairKey === activeKey) ?? null;

  if (!loaded) {
    return <p className="master-empty">{t('master.messages.loading')}</p>;
  }

  if (pairs.length === 0) {
    return <p className="master-empty">{t('master.messages.empty')}</p>;
  }

  return (
    <section className="mm-layout">
      <aside className="mm-sidebar">
        <header className="mm-sidebar__head">
          <strong>{t('master.messages.conversations')}</strong>
          <span className="mm-count">{pairs.length}</span>
        </header>
        <ul className="mm-pair-list">
          {pairs.map((p) => {
            const isActive = p.pairKey === activeKey;
            return (
              <li key={p.pairKey}>
                <button
                  type="button"
                  className={'mm-pair' + (isActive ? ' is-active' : '')}
                  onClick={() => setActiveKey(p.pairKey)}
                >
                  <span className="mm-pair__avatars">
                    <span className="mm-pair__av">
                      {p.a.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.a.avatarUrl} alt="" />
                      ) : (
                        initials(p.a.name || p.a.email)
                      )}
                    </span>
                    <span className="mm-pair__av mm-pair__av--second">
                      {p.b.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.b.avatarUrl} alt="" />
                      ) : (
                        initials(p.b.name || p.b.email)
                      )}
                    </span>
                  </span>
                  <span className="mm-pair__meta">
                    <span className="mm-pair__names">
                      {p.a.name || p.a.email} ↔ {p.b.name || p.b.email}
                    </span>
                    <span className="mm-pair__preview">{p.lastMessage.body}</span>
                  </span>
                  <span className="mm-pair__side">
                    <span className="mm-pair__time">{fmtRel(p.lastActivity)}</span>
                    {p.unreadCount > 0 && (
                      <span className="mm-pair__unread">{p.unreadCount}</span>
                    )}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </aside>

      <div className="mm-main">
        {!activePair ? (
          <div className="mm-placeholder">{t('master.messages.pick')}</div>
        ) : (
          <>
            <header className="mm-main__head">
              <div>
                <strong>{activePair.a.name || activePair.a.email}</strong>
                <span className="mm-arrow">↔</span>
                <strong>{activePair.b.name || activePair.b.email}</strong>
              </div>
              <span className="mm-main__meta">
                {t('master.messages.count').replace(
                  '{n}',
                  String(activePair.messageCount),
                )}
              </span>
            </header>

            <div className="mm-scroll">
              {loadingThread ? (
                <p className="mm-empty">{t('master.messages.loading')}</p>
              ) : thread.length === 0 ? (
                <p className="mm-empty">{t('master.messages.empty')}</p>
              ) : (
                thread.map((m) => {
                  const fromA = m.fromId === activePair.a.id;
                  return (
                    <div key={m.id} className={'mm-bubble' + (fromA ? '' : ' is-b')}>
                      <span className="mm-bubble__from">
                        {fromA
                          ? activePair.a.name || activePair.a.email
                          : activePair.b.name || activePair.b.email}
                      </span>
                      <p>{m.body}</p>
                      <span className="mm-bubble__time">{fmtFull(m.createdAt)}</span>
                    </div>
                  );
                })
              )}
            </div>

            <footer className="mm-foot">
              <span className="mm-note">{t('master.messages.readOnlyNote')}</span>
            </footer>
          </>
        )}
      </div>
    </section>
  );
}