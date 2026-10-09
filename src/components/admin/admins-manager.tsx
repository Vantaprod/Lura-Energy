'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useTranslation } from '@/lib/i18n/context';

type Account = {
  id: string;
  email: string;
  name: string;
  role: 'OWNER' | 'ADMIN';
  active: boolean;
  createdAt: string;
  lastLoginAt: string | null;
};
type Invitation = { id: string; email: string; expiresAt: string };
type Payload = {
  users: Account[];
  pending: Invitation[];
  capacity: number;
  used: number;
  currentUserId: string;
};

export function AdminsManager() {
  const { t } = useTranslation();
  const [data, setData] = useState<Payload | null>(null);
  const [capacity, setCapacity] = useState<number | null>(null);
  const [email, setEmail] = useState('');
  const [invite, setInvite] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  async function load() {
    const response = await fetch('/api/admin/administrators');
    if (response.ok) {
      const result: Payload = await response.json();
      setData(result);
      setCapacity(result.capacity);
    } else setError(t('admin.admins.error.load'));
  }
  useEffect(() => { void load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  async function createInvite(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setMessage('');
    const response = await fetch('/api/admin/administrators', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const result = await response.json();
    if (!response.ok) {
      setError(result.error);
      return;
    }
    setInvite(result.invitationUrl);
    setEmail('');
    setMessage(t('admin.admins.notice.inviteCreated'));
    await load();
  }

  async function updateCapacity(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setMessage('');
    const response = await fetch('/api/admin/administrators/capacity', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ capacity: Number(capacity) }),
    });
    const result = await response.json();
    if (!response.ok) {
      setError(result.error);
      return;
    }
    setMessage(t('admin.admins.notice.capacityUpdated'));
    await load();
  }

  async function toggle(account: Account) {
    if (account.active && !window.confirm(t('admin.admins.confirm.disable'))) return;
    setError('');
    setMessage('');
    const response = await fetch(`/api/admin/administrators/${account.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !account.active }),
    });
    const result = await response.json();
    if (!response.ok) {
      setError(result.error);
      return;
    }
    setMessage(
      account.active
        ? t('admin.admins.notice.disabled')
        : t('admin.admins.notice.reactivated'),
    );
    await load();
  }

  async function remove(account: Account) {
    if (
      !window.confirm(
        t('admin.admins.confirm.remove').replace('{name}', account.name),
      )
    )
      return;
    setError('');
    setMessage('');
    const response = await fetch(`/api/admin/administrators/${account.id}`, {
      method: 'DELETE',
    });
    const result = await response.json();
    if (!response.ok) {
      setError(result.error);
      return;
    }
    setMessage(t('admin.admins.notice.removed'));
    await load();
  }

  async function changeRole(account: Account) {
    const role = account.role === 'ADMIN' ? 'OWNER' : 'ADMIN';
    if (
      !window.confirm(
        t('admin.admins.confirm.role')
          .replace('{name}', account.name)
          .replace('{role}', role),
      )
    )
      return;
    setError('');
    setMessage('');
    const response = await fetch(`/api/admin/administrators/${account.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role }),
    });
    const result = await response.json();
    if (!response.ok) {
      setError(result.error);
      return;
    }
    setMessage(t('admin.admins.notice.roleChanged').replace('{role}', role));
    await load();
  }

  return (
    <>
      <div className="stats">
        <div className="stat">
          <strong>{data?.capacity ?? '\u2014'}</strong>
          {t('admin.admins.stat.seatLimit')}
        </div>
        <div className="stat">
          <strong>{data?.used ?? '\u2014'}</strong>
          {t('admin.admins.stat.active')}
        </div>
        <div className="stat">
          <strong>
            {data ? data.capacity - data.used - data.pending.length : '\u2014'}
          </strong>
          {t('admin.admins.stat.available')}
        </div>
      </div>

      <form
        onSubmit={updateCapacity}
        className="field"
        style={{ maxWidth: 400 }}
      >
        <label htmlFor="capacity">{t('admin.admins.field.capacity')}</label>
        <input
          id="capacity"
          type="number"
          min="1"
          max="100"
          value={capacity ?? ''}
          onChange={(event) => setCapacity(Number(event.target.value))}
        />
        <button className="button" disabled={capacity === null}>
          {t('admin.admins.action.updateCapacity')}
        </button>
      </form>

      {message && <p role="status">{message}</p>}

      <h2 style={{ fontSize: '1.8rem', marginTop: '3rem' }}>
        {t('admin.admins.invite.title')}
      </h2>
      <form className="hero-actions" onSubmit={createInvite}>
        <input
          className="admin-input"
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder={t('admin.admins.invite.emailPlaceholder')}
        />
        <button className="button">{t('admin.admins.invite.create')}</button>
      </form>

      {invite && (
        <div className="success-box">
          {t('admin.admins.invite.copyLink')}{' '}
          <input className="admin-input" readOnly value={invite} />
        </div>
      )}

      <h2 style={{ fontSize: '1.8rem', marginTop: '3rem' }}>
        {t('admin.admins.accounts.title')}
      </h2>

      {data?.users.length ? (
        <div style={{ overflowX: 'auto' }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>{t('admin.admins.col.administrator')}</th>
                <th>{t('admin.admins.col.role')}</th>
                <th>{t('admin.admins.col.status')}</th>
                <th>{t('admin.admins.col.lastSignIn')}</th>
                <th>{t('admin.admins.col.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {data.users.map((account) => (
                <tr key={account.id}>
                  <td>
                    <Link
                      href={`/admin/administrators/${account.id}`}
                      style={{
                        color: '#1428A0',
                        fontWeight: 700,
                        textDecoration: 'none',
                      }}
                    >
                      {account.name}
                    </Link>
                    <br />
                    <span className="form-note">{account.email}</span>
                  </td>
                  <td>{account.role}</td>
                  <td>
                    {account.active
                      ? t('admin.admins.status.active')
                      : t('admin.admins.status.disabled')}
                  </td>
                  <td>
                    {account.lastLoginAt
                      ? new Date(account.lastLoginAt).toLocaleString()
                      : t('admin.admins.status.never')}
                  </td>
                  <td>
                    {account.id !== data.currentUserId && (
                      <>
                        <button
                          className="admin-action"
                          onClick={() => void changeRole(account)}
                        >
                          {account.role === 'ADMIN'
                            ? t('admin.admins.action.makeOwner')
                            : t('admin.admins.action.makeAdmin')}
                        </button>{' '}
                        <button
                          className="admin-action"
                          onClick={() => void toggle(account)}
                        >
                          {account.active
                            ? t('admin.admins.action.disable')
                            : t('admin.admins.action.reactivate')}
                        </button>{' '}
                        <button
                          className="admin-action"
                          onClick={() => void remove(account)}
                        >
                          {t('admin.admins.action.remove')}
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="form-note">{t('admin.admins.empty.noAccounts')}</p>
      )}

      {data?.pending.length ? (
        <>
          <h2 style={{ fontSize: '1.6rem', marginTop: '2rem' }}>
            {t('admin.admins.pending.title')}
          </h2>
          <ul>
            {data.pending.map((item) => (
              <li key={item.id}>
                {item.email} {'\u00B7'} {t('admin.admins.pending.expires')}{' '}
                {new Date(item.expiresAt).toLocaleString()}
              </li>
            ))}
          </ul>
        </>
      ) : null}

      {error && (
        <p role="alert" className="form-error">
          {error}
        </p>
      )}
    </>
  );
}