import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { sendMail } from '@/lib/mail/send';

export const dynamic = 'force-dynamic';

const APP_URL = process.env.APP_URL ?? 'https://lura-energy.vercel.app';

function periodStart(freq: string): Date {
  const now = new Date();
  if (freq === 'weekly') return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  return new Date(now.getTime() - 24 * 60 * 60 * 1000);
}

function buildHtml(name: string, items: { title: string; body: string | null; href: string | null; createdAt: Date }[]): string {
  const rows = items
    .map(
      (n) => `
      <tr>
        <td style="padding:14px 16px;border-bottom:1px solid #EFF1F5;">
          <p style="margin:0 0 4px;font-size:15px;font-weight:700;color:#0A1550;">${n.title}</p>
          ${n.body ? `<p style="margin:0 0 6px;font-size:13px;color:#4A5568;line-height:1.5;">${n.body}</p>` : ''}
          <p style="margin:0;font-size:11px;color:#97A1B2;text-transform:uppercase;letter-spacing:0.04em;">
            ${n.createdAt.toISOString().slice(0, 16).replace('T', ' ')}
          </p>
        </td>
      </tr>
    `,
    )
    .join('');

  return `<!DOCTYPE html>
<html>
  <head><meta charset="utf-8" /><title>Lura Energy Admin</title></head>
  <body style="margin:0;padding:0;background:#F7F9FC;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#F7F9FC;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width:600px;background:#FFFFFF;border-radius:14px;overflow:hidden;box-shadow:0 4px 20px rgba(5,14,31,0.06);">
            <tr>
              <td style="background:#0A1550;padding:28px 32px;">
                <p style="margin:0;font-size:11px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:#F58220;">LURA WORKSPACE</p>
                <p style="margin:6px 0 0;font-size:22px;font-weight:800;color:#FFFFFF;">Administration digest</p>
              </td>
            </tr>
            <tr>
              <td style="padding:28px 32px 8px;">
                <p style="margin:0 0 8px;font-size:15px;color:#0A1550;">Hi ${name},</p>
                <p style="margin:0 0 20px;font-size:14px;color:#4A5568;line-height:1.55;">
                  You have <strong>${items.length}</strong> new notification${items.length === 1 ? '' : 's'} in the last period.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:0 32px 8px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border:1px solid #EFF1F5;border-radius:10px;overflow:hidden;">
                  ${rows}
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 32px 28px;" align="center">
                <a href="${APP_URL}/admin/notifications" style="display:inline-block;padding:11px 22px;border-radius:999px;background:#1428A0;color:#FFFFFF;text-decoration:none;font-size:13px;font-weight:700;">Open notifications</a>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 32px;background:#FAFBFE;border-top:1px solid #EFF1F5;text-align:center;">
                <p style="margin:0;font-size:11px;color:#97A1B2;">
                  Turn digests off from your account settings.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

async function runDigest(req: NextRequest) {
  // Auth: Vercel Cron sends Authorization: Bearer <CRON_SECRET>
  const expected = process.env.CRON_SECRET;
  if (expected) {
    const got = req.headers.get('authorization') ?? '';
    if (got !== `Bearer ${expected}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const [enabledRow, freqRow] = await Promise.all([
    prisma.setting.findUnique({ where: { key: 'digest.enabled' } }),
    prisma.setting.findUnique({ where: { key: 'digest.frequency' } }),
  ]);

  const enabled = enabledRow?.value === true;
  const frequency = typeof freqRow?.value === 'string' ? freqRow.value : 'daily';

  if (!enabled) {
    return NextResponse.json({ ok: true, skipped: 'DISABLED' });
  }

  const since = periodStart(frequency);

  const admins = await prisma.user.findMany({
    where: { active: true },
    select: { id: true, email: true, name: true },
  });

  let sent = 0;
  const failures: string[] = [];

  for (const admin of admins) {
    const unread = await prisma.notification.findMany({
      where: {
        userId: admin.id,
        readAt: null,
        createdAt: { gte: since },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: {
        title: true,
        body: true,
        href: true,
        createdAt: true,
      },
    });

    if (unread.length === 0) continue;

    const result = await sendMail({
      to: admin.email,
      subject: `Lura Admin — ${unread.length} new notification${unread.length === 1 ? '' : 's'}`,
      html: buildHtml(admin.name || admin.email, unread),
    });

    if (result.ok) {
      sent++;
    } else {
      failures.push(`${admin.email}: ${result.error}`);
    }
  }

  await prisma.setting.upsert({
    where: { key: 'digest.lastRunAt' },
    create: { key: 'digest.lastRunAt', value: new Date().toISOString() },
    update: { value: new Date().toISOString() },
  });

  return NextResponse.json({
    ok: true,
    sent,
    skipped: admins.length - sent,
    failures,
    frequency,
  });
}

export async function GET(req: NextRequest) {
  return runDigest(req);
}

export async function POST(req: NextRequest) {
  return runDigest(req);
}