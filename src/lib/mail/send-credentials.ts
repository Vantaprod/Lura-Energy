// ============================================================
// src/lib/mail/send-credentials.ts
// Sends the initial password to a newly-approved admin.
// The password is NEVER returned to the caller.
// ============================================================
import { sendMail } from './send';

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export type SendCredentialsArgs = {
  to: string;
  fullName: string;
  password: string;
};

export async function sendCredentialsEmail(
  args: SendCredentialsArgs,
): Promise<{ ok: boolean; error?: string }> {
  const loginUrl = `${process.env.APP_URL ?? 'https://www.luraenergy.com'}/admin/login`;

  const text = [
    `Hello ${args.fullName},`,
    '',
    'Your Lura Energy administrator access has been approved.',
    '',
    'Sign in with:',
    `  Email:    ${args.to}`,
    `  Password: ${args.password}`,
    '',
    `Sign in here: ${loginUrl}`,
    '',
    'Keep this password private. Do not share it with anyone.',
    'You can change it from your account page.',
    '',
    '— Lura Energy',
  ].join('\n');

  const html = `<!DOCTYPE html>
<html><body style="font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #0A1550; max-width: 560px; margin: 0 auto; padding: 24px;">
  <div style="border-bottom: 3px solid #F58220; padding-bottom: 16px; margin-bottom: 24px;">
    <h1 style="font-size: 22px; margin: 0; color: #1428A0;">Lura Energy</h1>
    <p style="margin: 4px 0 0; color: #6B7280; font-size: 13px;">Administrator access</p>
  </div>

  <p>Hello <strong>${escapeHtml(args.fullName)}</strong>,</p>

  <p>Your request for Lura Energy administrator access has been approved. Sign in with the credentials below.</p>

  <table style="background: #F5F7FA; border-radius: 8px; padding: 16px; width: 100%; margin: 20px 0; border-collapse: separate; border-spacing: 0;">
    <tr>
      <td style="padding: 6px 12px 6px 0; color: #6B7280; font-size: 13px; width: 100px;">Email</td>
      <td style="padding: 6px 0; font-family: 'SF Mono', Consolas, monospace; font-size: 14px;"><strong>${escapeHtml(args.to)}</strong></td>
    </tr>
    <tr>
      <td style="padding: 6px 12px 6px 0; color: #6B7280; font-size: 13px;">Password</td>
      <td style="padding: 6px 0; font-family: 'SF Mono', Consolas, monospace; font-size: 14px;"><strong>${escapeHtml(args.password)}</strong></td>
    </tr>
  </table>

  <p style="margin: 24px 0;">
    <a href="${loginUrl}" style="display: inline-block; background: #F58220; color: #FFFFFF; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 700;">Sign in to Lura</a>
  </p>

  <div style="background: #FFF7ED; border-left: 4px solid #F58220; padding: 12px 16px; border-radius: 4px; font-size: 13px; color: #92400E;">
    <strong>Keep this password safe.</strong> Do not share it with anyone. You can change it later from your account page.
  </div>

  <p style="color: #6B7280; font-size: 12px; margin-top: 32px; border-top: 1px solid #E5E7EB; padding-top: 16px;">
    If you did not request this, contact us immediately at <a href="mailto:info@luraenergy.com" style="color: #1428A0;">info@luraenergy.com</a>.
  </p>
</body></html>`;

  return sendMail({
    to: args.to,
    subject: 'Your Lura Energy admin access',
    html,
    text,
  });
}