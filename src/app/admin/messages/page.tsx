'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from '@/lib/i18n/context';

type Contact = {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  role: string;
};

type Thread = {
  counterparty: Contact;
  lastMessage: { body: string; createdAt: string; fromMe: boolean };
  unread: number;
};

type Msg = {
  id: string;
  fromMe: boolean;
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

function fmtTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const same = d.toDateString() === now.toDateString();
  return same
    ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : d.toLocaleDateString([], { day: '2-digit', month: 'short' });
}

export default function MessagesPage() {
  const { t } = useTranslation();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const scrollerRef = useRef<HTMLDivElement>(null);

  async function loadThreads() {
    const res = await fetch('/api/admin/messages', { cache: 'no-store' });
    if (!res.ok) return;
    const data = (await res.json()) as { threads: Thread[] };
    setThreads(data.threads);
  }

  async function loadContacts() {
    const res = await fetch('/api/admin/messages/contacts', { cache: 'no-store' });
    if (!res.ok) return;
    const data = (await res.json()) as { contacts: Contact[] };
    setContacts(data.contacts);
  }

  useEffect(() => {
    loadThreads();
    loadContacts();
  }, []);

  useEffect(() => {
    if (!activeId) return;
    let cancelled = false;
    (async () => {
      const res = await fetch(`/api/admin/messages/${activeId}`, { cache: 'no-store' });
      if (!res.ok) return;
      const data = (await res.json()) as { messages: Msg[] };
      if (cancelled) return;
      setMessages(data.messages);
      // Refresh thread list so unread resets.
      loadThreads();
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId]);

  useEffect(() => {
    if (scrollerRef.current) {
      scrollerRef.current.scrollTop = scrollerRef.current.scrollHeight;
    }
  }, [messages.length]);

  const activeContact = useMemo<Contact | null>(() => {
    if (!activeId) return null;
    const fromThreads = threads.find((x) => x.counterparty.id === activeId)?.counterparty;
    if (fromThreads) return fromThreads;
    return contacts.find((c) => c.id === activeId) ?? null;
  }, [activeId, threads, contacts]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!activeId || !draft.trim() || sending) return;
    setSending(true);
    try {
      const res = await fetch('/api/admin/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipientId: activeId, body: draft.trim() }),
      });
      if (!res.ok) return;
      setDraft('');
      const r = await fetch(`/api/admin/messages/${activeId}`, { cache: 'no-store' });
      if (r.ok) {
        const data = (await r.json()) as { messages: Msg[] };
        setMessages(data.messages);
      }
      loadThreads();
    } finally {
      setSending(false);
    }
  }

  return (
    <section className="msg-page">
      <header className="msg-head">
        <p className="eyebrow">{t('admin.messages.eyebrow')}</p>
        <h1 style={{ fontSize: '2.4rem' }}>{t('admin.messages.title')}</h1>
        <p className="form-note">{t('admin.messages.subtitle')}</p>
      </header>

      <div className="msg-layout">
        <aside className="msg-sidebar">
          <div className="msg-sidebar__section">
            <h3 className="msg-sidebar__heading">{t('admin.messages.threads')}</h3>
            {threads.length === 0 ? (
              <p className="msg-sidebar__empty">{t('admin.messages.noThreads')}</p>
            ) : (
              <ul className="msg-thread-list">
                {threads.map((th) => {
                  const c = th.counterparty;
                  const isActive = activeId === c.id;
                  return (
                    <li key={c.id}>
                      <button
                        type="button"
                        className={'msg-thread' + (isActive ? ' is-active' : '')}
                        onClick={() => setActiveId(c.id)}
                      >
                        <span className="msg-avatar">
                          {c.avatarUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={c.avatarUrl} alt="" />
                          ) : (
                            initials(c.name || c.email)
                          )}
                        </span>
                        <span className="msg-thread__meta">
                          <span className="msg-thread__name">
                            {c.name || c.email}
                          </span>
                          <span className="msg-thread__preview">
                            {th.lastMessage.fromMe ? `${t('admin.messages.you')}: ` : ''}
                            {th.lastMessage.body}
                          </span>
                        </span>
                        <span className="msg-thread__side">
                          <span className="msg-thread__time">
                            {fmtTime(th.lastMessage.createdAt)}
                          </span>
                          {th.unread > 0 && (
                            <span className="msg-unread">{th.unread}</span>
                          )}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="msg-sidebar__section">
            <h3 className="msg-sidebar__heading">{t('admin.messages.newMessage')}</h3>
            <ul className="msg-contact-list">
              {contacts.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    className="msg-contact"
                    onClick={() => setActiveId(c.id)}
                  >
                    <span className="msg-avatar msg-avatar--sm">
                      {c.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={c.avatarUrl} alt="" />
                      ) : (
                        initials(c.name || c.email)
                      )}
                    </span>
                    <span>{c.name || c.email}</span>
                    {c.role === 'OWNER' && (
                      <span className="msg-badge">{t('admin.messages.owner')}</span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        <div className="msg-main">
          {!activeId ? (
            <div className="msg-placeholder">{t('admin.messages.pickSomeone')}</div>
          ) : (
            <>
              <header className="msg-main__head">
                <span className="msg-avatar msg-avatar--sm">
                  {activeContact?.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={activeContact.avatarUrl} alt="" />
                  ) : (
                    initials(activeContact?.name || activeContact?.email || '?')
                  )}
                </span>
                <strong>{activeContact?.name || activeContact?.email}</strong>
              </header>

              <div className="msg-scroll" ref={scrollerRef}>
                {messages.length === 0 ? (
                  <p className="msg-empty">{t('admin.messages.noMessages')}</p>
                ) : (
                  messages.map((m) => (
                    <div
                      key={m.id}
                      className={'msg-bubble' + (m.fromMe ? ' is-mine' : '')}
                    >
                      <p>{m.body}</p>
                      <span className="msg-bubble__time">{fmtTime(m.createdAt)}</span>
                    </div>
                  ))
                )}
              </div>

              <form className="msg-compose" onSubmit={send}>
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder={t('admin.messages.placeholder')}
                  rows={2}
                  maxLength={4000}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      send(e);
                    }
                  }}
                />
                <button
                  type="submit"
                  className="button"
                  disabled={sending || !draft.trim()}
                >
                  {sending ? t('admin.messages.sending') : t('admin.messages.send')}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </section>
  );
}