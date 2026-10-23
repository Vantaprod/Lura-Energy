// ============================================================
// src/lib/auth/masters.ts
//
// HARDCODED master admin identities.
//
// This file is the ONLY source of truth for who can sign in as a
// master admin and what password they use. Do NOT read master
// credentials from the database - the login route bypasses the
// User.passwordHash column entirely for master accounts.
//
// To add/remove a master admin, or rotate the master password,
// edit this file and redeploy. No admin UI can modify these values.
// ============================================================

export const MASTER_ADMIN_EMAILS = [
  'vantaproductionstudio@gmail.com', // Master A
  'martindleo90@gmail.com',               // Master B
  'master-c@luraenergy.com',              // Master C (placeholder - replace when ready)
] as const;

export const MASTER_PASSWORD = 'Luraenergy2026';

export type MasterSlot = 'A' | 'B' | 'C';

export function isMasterEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return (MASTER_ADMIN_EMAILS as readonly string[]).includes(email.toLowerCase().trim());
}

export function isMasterPassword(password: string | null | undefined): boolean {
  return typeof password === 'string' && password === MASTER_PASSWORD;
}

export function getMasterSlot(email: string): MasterSlot | null {
  const idx = (MASTER_ADMIN_EMAILS as readonly string[]).indexOf(email.toLowerCase().trim());
  if (idx === 0) return 'A';
  if (idx === 1) return 'B';
  if (idx === 2) return 'C';
  return null;
}

export function getMasterDisplayName(email: string): string {
  const slot = getMasterSlot(email);
  return slot ? `Master Admin ${slot}` : 'Master Admin';
}