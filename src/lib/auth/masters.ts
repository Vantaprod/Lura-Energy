/**
 * Master administrator whitelist.
 *
 * Only emails in this list are recognized as master administrators.
 * Master admins:
 *   - See the access request approval queue
 *   - See presence tracking
 *   - Can manage other administrators
 *
 * Add a new master by appending their email to this array.
 * The associated account must also have role: OWNER in the database.
 */
export const MASTER_EMAILS: string[] = [
  'josephchimaobi28@gmail.com',
  // Add Martin's email here when available:
  // 'martin@luraenergy.com',
  // Add Mr Lee's email here when available:
  // 'lee@luraenergy.com',
];

export function isMasterEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return MASTER_EMAILS.includes(email.toLowerCase());
}