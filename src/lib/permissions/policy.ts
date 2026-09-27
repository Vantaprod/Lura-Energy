import type { Role } from '@prisma/client';

export type Permission = 'content.read' | 'content.manage' | 'lead.read' | 'lead.manage' | 'admin.manage' | 'settings.manage' | 'audit.read';
const grants: Record<Role, ReadonlySet<Permission>> = {
  OWNER: new Set(['content.read','content.manage','lead.read','lead.manage','admin.manage','settings.manage','audit.read']),
  ADMIN: new Set(['content.read','content.manage','lead.read','lead.manage']),
};
export function can(role: Role, permission: Permission) { return grants[role].has(permission); }
