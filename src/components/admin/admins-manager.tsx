'use client';

import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from '@/lib/i18n/context';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

type User = {
  id: string;
  email: string;
  name: string;
  role: 'OWNER' | 'ADMIN';
  active: boolean;
  createdAt: string;
  lastLoginAt: string | null;
};

type Invitation = {
  id: string;
  email: string;
  role: 'OWNER' | 'ADMIN';
  expiresAt: string;
};

type AdminData = {
  users: User[];
  pending: Invitation[];
  capacity: number;
  used: number;
  currentUserId: string;
};

export function AdminsManager() {
  const { t } = useTranslation();
  const [data, setData] = useState<AdminData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteLink, setInviteLink] = useState('');
  const [inviteBusy, setInviteBusy] = useState(false);
  const [capacity, setCapacity] = useState(6);
  const [capacityBusy, setCapacityBusy] = useState(false);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState<{
    title: string;
    message: string;
    confirmText: string;
    isDestructive: boolean;
    onConfirm: () => void;
  } | null>(null);

  const loadData = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/administrators');
      if (!res.ok) throw new Error('Failed to load administrators');
      const json = await res.json();
      setData(json);
      setCapacity(json.capacity);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const showDialog = (config: typeof confirmConfig) => {
    setConfirmConfig(config);
    setConfirmOpen(true);
  };

  const handleCloseDialog = () => {
    setConfirmOpen(false);
    setTimeout(() => setConfirmConfig(null), 200);
  };

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    if (!data) return;
    // Only selectable users are active admins who are not the current user
    const manageableUsers = data.users.filter(u => u.id !== data.currentUserId && u.role === 'ADMIN');
    if (selectedIds.length === manageableUsers.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(manageableUsers.map(u => u.id));
    }
  };

  const toggleActive = async (id: string, active: boolean) => {
    setError(''); setSuccess('');
    try {
      const res = await fetch(`/api/admin/administrators/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active }),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Failed to update status');
      setSuccess('Status updated successfully.');
      loadData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const deleteUser = async (id: string) => {
    setError(''); setSuccess('');
    try {
      const res = await fetch(`/api/admin/administrators/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error((await res.json()).error || 'Failed to remove user');
      setSuccess('User removed successfully.');
      loadData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const confirmRemoveUser = (user: User) => {
    showDialog({
      title: `Remove ${user.name || user.email}`,
      message: 'Permanently remove this administrator? Their sessions will be revoked.',
      confirmText: 'Remove',
      isDestructive: true,
      onConfirm: () => {
        handleCloseDialog();
        deleteUser(user.id);
      }
    });
  };

  const handleBulkAction = (action: 'activate' | 'deactivate' | 'remove') => {
    if (action === 'remove') {
      showDialog({
        title: `Remove ${selectedIds.length} Admins`,
        message: 'Permanently remove the selected administrators? Their sessions will be revoked.',
        confirmText: 'Remove All',
        isDestructive: true,
        onConfirm: async () => {
          handleCloseDialog();
          await executeBulkAction(action);
        }
      });
    } else {
      executeBulkAction(action);
    }
  };

  const executeBulkAction = async (action: 'activate' | 'deactivate' | 'remove') => {
    setError(''); setSuccess('');
    try {
      const res = await fetch('/api/admin/administrators/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds, action }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Bulk action failed');
      
      setSuccess(`Bulk action completed.`);
      setSelectedIds([]);
      loadData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccess(''); setInviteLink('');
    setInviteBusy(true);
    try {
      const res = await fetch('/api/admin/administrators', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to create invitation');
      
      setInviteLink(json.invitationUrl);
      setInviteEmail('');
      loadData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setInviteBusy(false);
    }
  };

  const handleUpdateCapacity = async () => {
    setError(''); setSuccess('');
    setCapacityBusy(true);
    try {
      const res = await fetch('/api/admin/administrators/capacity', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ capacity }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to update capacity');
      
      setSuccess('Capacity updated successfully.');
      loadData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCapacityBusy(false);
    }
  };

  if (loading) return <p className="form-note">Loading administrators...</p>;
  if (!data) return <p className="form-error">Failed to load data.</p>;

  // Only regular ADMINs can be selected in bulk
  const manageableUsers = data.users.filter(u => u.id !== data.currentUserId && u.role === 'ADMIN');

  return (
    <div>
      {error && <p className="form-error" style={{ marginBottom: '1rem' }}>{error}</p>}
      {success && <p className="form-success" style={{ marginBottom: '1rem' }}>{success}</p>}

      <section style={{ marginBottom: '3rem', padding: '1.5rem', background: '#F7F8FA', borderRadius: '8px' }}>
        <h2 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', fontWeight: 700 }}>Seat limit</h2>
        <p className="form-note" style={{ marginBottom: '1rem' }}>
          {data.used} of {data.capacity} seats currently in use ({data.pending.length} pending invites).
        </p>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <input
            type="number"
            min={1}
            max={100}
            value={capacity}
            onChange={e => setCapacity(Number(e.target.value))}
            style={{ padding: '10px', borderRadius: '6px', border: '1px solid #DDE2EB', width: '100px' }}
          />
          <button
            type="button"
            className="button button-secondary"
            onClick={handleUpdateCapacity}
            disabled={capacityBusy || capacity === data.capacity}
          >
            {capacityBusy ? 'Updating...' : 'Update capacity'}
          </button>
        </div>
      </section>

      <section style={{ marginBottom: '3rem' }}>
        <h2 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', fontWeight: 700 }}>Invite administrator</h2>
        <form onSubmit={handleInvite} style={{ display: 'flex', gap: '1rem', alignItems: 'center', maxWidth: '600px' }}>
          <input
            type="email"
            required
            placeholder="Official email address"
            value={inviteEmail}
            onChange={e => setInviteEmail(e.target.value)}
            style={{ flex: 1, padding: '12px', borderRadius: '6px', border: '1px solid #DDE2EB' }}
          />
          <button type="submit" className="button" disabled={inviteBusy || !inviteEmail}>
            {inviteBusy ? 'Generating...' : 'Create 48-hour invitation'}
          </button>
        </form>

        {inviteLink && (
          <div style={{ marginTop: '1rem', padding: '1rem', background: '#E0F2FE', borderRadius: '6px', border: '1px solid #BAE6FD' }}>
            <p style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Invitation link created!</p>
            <code style={{ display: 'block', padding: '8px', background: '#FFF', borderRadius: '4px', wordBreak: 'break-all' }}>
              {inviteLink}
            </code>
          </div>
        )}
      </section>

      <section>
        <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem', fontWeight: 700 }}>Accounts</h2>
        
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem', padding: '12px', background: '#F7F8FA', borderRadius: '8px' }}>
          <span style={{ fontSize: '14px', fontWeight: 600 }}>{selectedIds.length} selected</span>
          <div style={{ flex: 1 }} />
          <button className="admin-action" onClick={() => handleBulkAction('deactivate')} disabled={selectedIds.length === 0}>Deactivate</button>
          <button className="admin-action" onClick={() => handleBulkAction('activate')} disabled={selectedIds.length === 0}>Activate</button>
          <button className="admin-action" style={{ background: '#DC2626', color: '#FFF', borderColor: '#DC2626' }} onClick={() => handleBulkAction('remove')} disabled={selectedIds.length === 0}>Remove</button>
          <button className="admin-action" onClick={() => setSelectedIds([])} disabled={selectedIds.length === 0}>Clear</button>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: '40px' }}>
                  <input 
                    type="checkbox" 
                    checked={selectedIds.length === manageableUsers.length && manageableUsers.length > 0}
                    onChange={toggleAll}
                  />
                </th>
                <th>Administrator</th>
                <th>Role</th>
                <th>Status</th>
                <th>Last Sign In</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.users.map(user => (
                <tr key={user.id}>
                  <td>
                    {/* Only show checkbox for ADMINs that aren't the current user */}
                    {user.id !== data.currentUserId && user.role === 'ADMIN' && (
                      <input 
                        type="checkbox" 
                        checked={selectedIds.includes(user.id)}
                        onChange={() => toggleSelection(user.id)}
                      />
                    )}
                  </td>
                  <td>
                    <strong>{user.name}</strong>
                    <br />
                    <span className="form-note">{user.email}</span>
                  </td>
                  <td>
                    <span style={{ 
                      padding: '2px 8px', borderRadius: '99px', fontSize: '11px', fontWeight: 700,
                      background: user.role === 'OWNER' ? '#FEF3C7' : '#E0E7FF',
                      color: user.role === 'OWNER' ? '#92400E' : '#3730A3'
                    }}>
                      {user.role}
                    </span>
                  </td>
                  <td>
                    <span style={{ color: user.active ? '#059669' : '#DC2626', fontWeight: 600 }}>
                      {user.active ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                  <td className="form-note">
                    {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : 'Never'}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      {/* If it's the current user, just show "You" */}
                      {user.id === data.currentUserId ? (
                        <span className="form-note">You</span>
                      ) : user.role === 'OWNER' ? (
                        /* If it's another OWNER, show no actions */
                        <span className="form-note" style={{ color: '#9CA3AF' }}>Protected</span>
                      ) : (
                        /* If it's an ADMIN, show Disable/Activate and Remove */
                        <>
                          <button className="admin-action" onClick={() => toggleActive(user.id, !user.active)}>
                            {user.active ? 'Disable' : 'Activate'}
                          </button>
                          
                          <button className="admin-action" style={{ color: '#DC2626' }} onClick={() => confirmRemoveUser(user)}>
                            Remove
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {confirmConfig && (
        <ConfirmDialog
          open={confirmOpen}
          title={confirmConfig.title}
          message={confirmConfig.message}
          confirmText={confirmConfig.confirmText}
          isDestructive={confirmConfig.isDestructive}
          onCancel={handleCloseDialog}
          onConfirm={confirmConfig.onConfirm}
        />
      )}
    </div>
  );
}