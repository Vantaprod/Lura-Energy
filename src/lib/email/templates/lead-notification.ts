import { escapeHtml, formatDateTime, shortId } from '@/lib/email/utils';
import type { LeadForEmail } from '@/lib/email/types';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://luraenergy.com';

const INTENT_LABEL: Record<LeadForEmail['intent'], string> = {
  install: 'Installation',
  purchase: 'Purchase only',
  both: 'Purchase + Installation',
};

const INTEREST_LABEL: Record<string, string> = {
  product: 'Product enquiry',
  partnership: 'Partnership / distribution',
  support: 'Technical support',
  visit: 'Request a site visit',
  other: 'Other',
};

function interestText(lead: LeadForEmail): string | null {
  if (!lead.interest) return null;
  return INTEREST_LABEL[lead.interest] ?? lead.interest;
}

export function leadNotificationHtml(lead: LeadForEmail): string {
  const items = lead.quoteItems
    .map(
      (item) => `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid #E4E7EC;font-size:14px;color:#0B0F17;">
        <strong>${escapeHtml(item.productName)}</strong>
        <span style="color:#6B7686;font-size:12px;"> &middot; ${escapeHtml(item.categoryName)}</span>
        <div style="color:#6B7686;font-size:12px;margin-top:2px;">Qty ${item.quantity}${
          item.notes ? ' &middot; ' + escapeHtml(item.notes) : ''
        }</div>
      </td>
    </tr>`,
    )
    .join('');

  const interest = interestText(lead);

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F7F8FA;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#F7F8FA;padding:24px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width:600px;width:100%;background:#FFFFFF;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(5,14,31,0.06);">
          <tr>
            <td style="background:#0A1550;padding:24px 32px;color:#FFFFFF;">
              <div style="font-size:11px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:#F58220;">Lura Energy</div>
              <div style="font-size:22px;font-weight:800;margin-top:6px;">New quote request</div>
              <div style="font-size:13px;color:rgba(255,255,255,0.7);margin-top:4px;">Reference #${shortId(lead.id)} &middot; ${escapeHtml(formatDateTime(lead.createdAt))}</div>
            </td>
          </tr>

          <tr><td style="padding:28px 32px 8px;">
            <div style="font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#6B7686;margin-bottom:12px;">Customer</div>
            <table width="100%" cellspacing="0" cellpadding="0">
              <tr><td style="padding:6px 0;font-size:13px;color:#6B7686;width:90px;">Name</td><td style="padding:6px 0;font-size:14px;color:#0B0F17;font-weight:600;">${escapeHtml(lead.name)}</td></tr>
              <tr><td style="padding:6px 0;font-size:13px;color:#6B7686;">Email</td><td style="padding:6px 0;font-size:14px;"><a href="mailto:${escapeHtml(lead.email)}" style="color:#2547CC;text-decoration:none;">${escapeHtml(lead.email)}</a></td></tr>
              <tr><td style="padding:6px 0;font-size:13px;color:#6B7686;">Phone</td><td style="padding:6px 0;font-size:14px;"><a href="tel:${escapeHtml(lead.phone)}" style="color:#2547CC;text-decoration:none;">${escapeHtml(lead.phone)}</a></td></tr>
              ${lead.location ? `<tr><td style="padding:6px 0;font-size:13px;color:#6B7686;">Location</td><td style="padding:6px 0;font-size:14px;color:#0B0F17;">${escapeHtml(lead.location)}</td></tr>` : ''}
              ${interest ? `<tr><td style="padding:6px 0;font-size:13px;color:#6B7686;">Interest</td><td style="padding:6px 0;font-size:14px;color:#0B0F17;">${escapeHtml(interest)}</td></tr>` : ''}
              <tr><td style="padding:6px 0;font-size:13px;color:#6B7686;">Intent</td><td style="padding:6px 0;font-size:14px;color:#0B0F17;">${INTENT_LABEL[lead.intent]}</td></tr>
            </table>
          </td></tr>

          ${
            lead.message
              ? `<tr><td style="padding:20px 32px 0;">
                  <div style="font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#6B7686;margin-bottom:10px;">Message</div>
                  <div style="background:#F7F8FA;border-left:3px solid #F58220;padding:14px 16px;border-radius:6px;font-size:14px;line-height:1.6;color:#0B0F17;white-space:pre-wrap;">${escapeHtml(lead.message)}</div>
                </td></tr>`
              : ''
          }

          ${
            lead.quoteItems.length
              ? `<tr><td style="padding:24px 32px 0;">
                  <div style="font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#6B7686;margin-bottom:10px;">Requested products</div>
                  <table width="100%" cellspacing="0" cellpadding="0">${items}</table>
                </td></tr>`
              : ''
          }

          <tr><td style="padding:28px 32px 32px;">
            <a href="${SITE_URL}/admin/leads" style="display:inline-block;background:#F58220;color:#FFFFFF;text-decoration:none;font-weight:700;font-size:14px;padding:12px 24px;border-radius:6px;">View in admin &rarr;</a>
          </td></tr>

          <tr><td style="background:#F7F8FA;padding:16px 32px;font-size:11.5px;color:#6B7686;text-align:center;">
            Automated notification from luraenergy.com
          </td></tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function leadNotificationText(lead: LeadForEmail): string {
  const lines: string[] = [
    'New quote request',
    `Reference: #${shortId(lead.id)}`,
    `Received: ${formatDateTime(lead.createdAt)}`,
    '',
    '--- Customer ---',
    `Name:     ${lead.name}`,
    `Email:    ${lead.email}`,
    `Phone:    ${lead.phone}`,
  ];
  if (lead.location) lines.push(`Location: ${lead.location}`);
  const interest = interestText(lead);
  if (interest) lines.push(`Interest: ${interest}`);
  lines.push(`Intent:   ${INTENT_LABEL[lead.intent]}`);

  if (lead.message) {
    lines.push('', '--- Message ---', lead.message);
  }

  if (lead.quoteItems.length) {
    lines.push('', '--- Requested products ---');
    for (const item of lead.quoteItems) {
      lines.push(
        `- ${item.productName} (${item.categoryName}) x${item.quantity}${
          item.notes ? ' — ' + item.notes : ''
        }`,
      );
    }
  }

  lines.push('', `View: ${SITE_URL}/admin/leads`);
  return lines.join('\n');
}

export function leadNotificationSubject(lead: LeadForEmail): string {
  const parts = [lead.name];
  if (lead.location) parts.push(lead.location);
  if (lead.quoteItems.length) {
    parts.push(`${lead.quoteItems.length} item${lead.quoteItems.length > 1 ? 's' : ''}`);
  }
  return `New quote request — ${parts.join(' · ')}`;
}