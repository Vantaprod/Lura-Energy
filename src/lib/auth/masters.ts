// The master password is hardcoded for security.
// The list of who is a master admin is managed dynamically via the Database (role === 'OWNER').
export const MASTER_PASSWORD = 'Luraenergy2026';

export function isMasterPassword(password: string | null | undefined): boolean {
  return typeof password === 'string' && password === MASTER_PASSWORD;
}

export function getMasterDisplayName(email: string): string {
  return `Master Admin`;
}