import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { adminAccountChangeError } from '../../src/lib/auth/admin-account-policy.ts';

const base = { actorId: 'owner-1', targetId: 'admin-2', currentRole: 'ADMIN' as const, currentActive: true, activeOwnerCount: 1, activeAccountCount: 5, seatLimit: 6 };

describe('administrator account safeguards', () => {
  it('allows reactivation when one seat is available', () => {
    assert.equal(adminAccountChangeError({ ...base, currentActive: false, change: { active: true } }), null);
  });
  it('rejects reactivation at the seat limit', () => {
    assert.equal(adminAccountChangeError({ ...base, currentActive: false, activeAccountCount: 6, change: { active: true } }), 'NO_SEATS');
  });
  it('allows an owner to promote an administrator', () => {
    assert.equal(adminAccountChangeError({ ...base, change: { role: 'OWNER' } }), null);
  });
  it('prevents changing the only active owner to administrator', () => {
    assert.equal(adminAccountChangeError({ ...base, currentRole: 'OWNER', activeOwnerCount: 1, change: { role: 'ADMIN' } }), 'LAST_OWNER');
  });
  it('allows changing an owner when another active owner remains', () => {
    assert.equal(adminAccountChangeError({ ...base, currentRole: 'OWNER', activeOwnerCount: 2, change: { role: 'ADMIN' } }), null);
  });
  it('prevents an owner from changing their own access', () => {
    assert.equal(adminAccountChangeError({ ...base, targetId: 'owner-1', currentRole: 'OWNER', change: { role: 'ADMIN' } }), 'SELF');
  });
  it('prevents removing the last active owner but permits removing another owner', () => {
    assert.equal(adminAccountChangeError({ ...base, currentRole: 'OWNER', change: { remove: true } }), 'LAST_OWNER');
    assert.equal(adminAccountChangeError({ ...base, targetId: 'owner-2', currentRole: 'OWNER', activeOwnerCount: 2, change: { remove: true } }), null);
  });
});