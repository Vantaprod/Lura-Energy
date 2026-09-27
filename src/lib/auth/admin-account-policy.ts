export type AdminRole = 'OWNER' | 'ADMIN';
type AccountChange = { role: AdminRole } | { active: boolean } | { remove: true };
type AccountChangeContext = { actorId: string; targetId: string; currentRole: AdminRole; currentActive: boolean; activeOwnerCount: number; activeAccountCount: number; seatLimit: number; change: AccountChange };
export function adminAccountChangeError(context: AccountChangeContext): 'SELF' | 'LAST_OWNER' | 'NO_SEATS' | null {
  if (context.actorId === context.targetId) return 'SELF';
  if ('role' in context.change) {
    if (context.currentRole === 'OWNER' && context.change.role === 'ADMIN' && context.activeOwnerCount <= (context.currentActive ? 1 : 0)) return 'LAST_OWNER';
    return null;
  }
  if ('remove' in context.change) {
    if (context.currentRole === 'OWNER' && context.activeOwnerCount <= (context.currentActive ? 1 : 0)) return 'LAST_OWNER';
    return null;
  }
  if (context.currentActive && context.currentRole === 'OWNER' && !context.change.active && context.activeOwnerCount <= 1) return 'LAST_OWNER';
  if (!context.currentActive && context.change.active && context.activeAccountCount >= context.seatLimit) return 'NO_SEATS';
  return null;
}