import nodemailer, { type Transporter } from 'nodemailer';

let cached: Transporter | null = null;

function getTransport(): Transporter | null {
  if (cached) return cached;

  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT ?? 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    return null;
  }

  cached = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
  return cached;
}

export type SendArgs = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

export async function sendMail(args: SendArgs): Promise<{ ok: boolean; error?: string }> {
  const transport = getTransport();
  if (!transport) {
    return { ok: false, error: 'SMTP_NOT_CONFIGURED' };
  }

  try {
    await transport.sendMail({
      from: process.env.MAIL_FROM ?? 'Lura Energy <no-reply@luraenergy.com>',
      to: args.to,
      subject: args.subject,
      html: args.html,
      text: args.text,
    });
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'SEND_FAILED' };
  }
}