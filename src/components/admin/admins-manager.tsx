'use client';
import { useEffect, useState } from 'react';
type Account = { id: string; email: string; name: string; role: 'OWNER' | 'ADMIN'; active: boolean; createdAt: string; lastLoginAt: string | null };
type Invitation = { id: string; email: string; expiresAt: string };
type Payload = { users: Account[]; pending: Invitation[]; capacity: number; used: number; currentUserId: string };

export function AdminsManager() {
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
    } else setError('Could not load administrator records.');
  }
  useEffect(() => { void load(); }, []);

  async function createInvite(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(''); setMessage('');
    const response = await fetch('/api/admin/administrators', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) });
    const result = await response.json();
    if (!response.ok) { setError(result.error); return; }
    setInvite(result.invitationUrl); setEmail(''); setMessage('Invitation created. Copy and deliver its private link.'); await load();
  }
  async function updateCapacity(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(''); setMessage('');
    const response = await fetch('/api/admin/administrators/capacity', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ capacity: Number(capacity) }) });
    const result = await response.json();
    if (!response.ok) { setError(result.error); return; }
    setMessage('Administrator capacity updated.'); await load();
  }
  async function toggle(account: Account) {
    if (account.active && !window.confirm('Disable this administrator? Their active sessions will be revoked.')) return;
    setError(''); setMessage('');
    const response = await fetch(`/api/admin/administrators/${account.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ active: !account.active }) });
    const result = await response.json();
    if (!response.ok) { setError(result.error); return; }
    setMessage(account.active ? 'Administrator disabled.' : 'Administrator reactivated.'); await load();
  }
  async function remove(account: Account) {
    if (!window.confirm(`Permanently remove ${account.name}? Their sessions will be revoked. Audit events and invitations will be retained.`)) return;
    setError(''); setMessage('');
    const response = await fetch(`/api/admin/administrators/${account.id}`, { method: 'DELETE' });
    const result = await response.json();
    if (!response.ok) { setError(result.error); return; }
    setMessage('Administrator account permanently removed.'); await load();
  }  async function changeRole(account: Account) {
    const role = account.role === 'ADMIN' ? 'OWNER' : 'ADMIN';
    if (!window.confirm(`Change ${account.name}'s role to ${role}? Their current sessions will be revoked.`)) return;
    setError(''); setMessage('');
    const response = await fetch(`/api/admin/administrators/${account.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ role }) });
    const result = await response.json();
    if (!response.ok) { setError(result.error); return; }
    setMessage(`Role changed to ${role}.`); await load();
  }

  return <>
    <div className="stats"><div className="stat"><strong>{data?.capacity ?? '—'}</strong>Seat limit</div><div className="stat"><strong>{data?.used ?? '—'}</strong>Active administrators</div><div className="stat"><strong>{data ? data.capacity - data.used - data.pending.length : '—'}</strong>Available seats</div></div>
    <form onSubmit={updateCapacity} className="field" style={{ maxWidth: 400 }}><label htmlFor="capacity">Administrator capacity</label><input id="capacity" type="number" min="1" max="100" value={capacity ?? ''} onChange={event => setCapacity(Number(event.target.value))} /><button className="button" disabled={capacity === null}>Update capacity</button></form>
    {message && <p role="status">{message}</p>}
    <h2 style={{ fontSize: '1.8rem', marginTop: '3rem' }}>Invite administrator</h2>
    <form className="hero-actions" onSubmit={createInvite}><input className="admin-input" type="email" required value={email} onChange={event => setEmail(event.target.value)} placeholder="Official email address" /><button className="button">Create 48-hour invitation</button></form>
    {invite && <div className="success-box">Copy this private invitation link and send it to the invitee: <input className="admin-input" readOnly value={invite} /></div>}
    <h2 style={{ fontSize: '1.8rem', marginTop: '3rem' }}>Accounts</h2>
    {data?.users.length ? <div style={{ overflowX: 'auto' }}><table className="admin-table"><thead><tr><th>Administrator</th><th>Role</th><th>Status</th><th>Last sign in</th><th>Actions</th></tr></thead><tbody>{data.users.map(account => <tr key={account.id}><td>{account.name}<br/><span className="form-note">{account.email}</span></td><td>{account.role}</td><td>{account.active ? 'Active' : 'Disabled'}</td><td>{account.lastLoginAt ? new Date(account.lastLoginAt).toLocaleString() : 'Never'}</td><td>{account.id !== data.currentUserId && <><button className="admin-action" onClick={() => void changeRole(account)}>{account.role === 'ADMIN' ? 'Make owner' : 'Make admin'}</button> <button className="admin-action" onClick={() => void toggle(account)}>{account.active ? 'Disable' : 'Reactivate'}</button> <button className="admin-action" onClick={() => void remove(account)}>Remove</button></>}</td></tr>)}</tbody></table></div> : <p className="form-note">No admin accounts.</p>}
    {data?.pending.length ? <><h2 style={{ fontSize: '1.6rem', marginTop: '2rem' }}>Pending invitations</h2><ul>{data.pending.map(item => <li key={item.id}>{item.email} · expires {new Date(item.expiresAt).toLocaleString()}</li>)}</ul></> : null}
    {error && <p role="alert" className="form-error">{error}</p>}
  </>;
}