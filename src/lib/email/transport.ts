import nodemailer, { type Transporter } from 'nodemailer';

let cached: Transporter | null | undefined = undefined;

/**
 * Returns a nodemailer Transporter if SMTP is configured, otherwise null.
 * Result is cached so we don't rebuild the transport on every email.
 */
export function getTransport(): Transporter | null {
  if (cached !== undefined) return cached;

  const host = process.env.SMTP_HOST;
  if (!host) {
    cached = null;
    return null;
  }

  try {
    cached = nodemailer.createTransport({
      host,
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: process.env.SMTP_SECURE === 'true',
      auth: process.env.SMTP_USER
        ? {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          }
        : undefined,
    });
    return cached;
  } catch (err) {
    console.error('[email] Failed to create SMTP transport:', err);
    cached = null;
    return null;
  }
}

export function getLeadRecipient(): string | null {
  return process.env.LEAD_NOTIFY_TO ?? null;
}

export function getLeadSender(): string {
  return (
    process.env.LEAD_NOTIFY_FROM ??
    process.env.SMTP_USER ??
    'noreply@luraenergy.com'
  );
}

export function getSubjectPrefix(): string {
  return process.env.LEAD_NOTIFY_SUBJECT_PREFIX ?? '[Lura Lead]';
}