import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { can } from '../../src/lib/permissions/policy.ts';

describe('centralized role permissions', () => {
  it('grants owners all administrative permissions', () => {
    for (const permission of ['content.read','content.manage','lead.read','lead.manage','admin.manage','settings.manage','audit.read'] as const) {
      assert.equal(can('OWNER', permission), true);
    }
  });
  it('does not grant administrators owner-only controls', () => {
    assert.equal(can('ADMIN', 'content.manage'), true);
    assert.equal(can('ADMIN', 'lead.manage'), true);
    assert.equal(can('ADMIN', 'admin.manage'), false);
    assert.equal(can('ADMIN', 'settings.manage'), false);
    assert.equal(can('ADMIN', 'audit.read'), false);
  });
});
