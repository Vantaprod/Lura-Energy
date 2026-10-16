import { escapeHtml, shortId } from '@/lib/email/utils';
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

export function leadConfirmationHtml(lead: LeadForEmail): string {
  const items = lead.quoteItems
    .map(
      (item) => `
    <tr>
      <td style="padding:8px 0;border-bottom:1px solid #E4E7EC;font-size:13.5px;color:#0B0F17;">
        ${escapeHtml(item.productName)}
        <span style="color:#6B7686;font-size:12px;"> &middot; Qty ${item.quantity}</span>
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
              <div style="font-size:22px;font-weight:800;margin-top:6px;">We&rsquo;ve received your request</div>
            </td>
          </tr>

          <tr><td style="padding:28px 32px 8px;">
            <p style="font-size:14.5px;line-height:1.65;color:#0B0F17;margin:0 0 14px;">Hi ${escapeHtml(lead.name)},</p>
            <p style="font-size:14.5px;line-height:1.65;color:#0B0F17;margin:0 0 14px;">Thank you for contacting Lura Energy. A representative will review your request and reach out within <strong>1 business day</strong>.</p>
            <p style="font-size:13px;color:#6B7686;margin:14px 0 0;">Your reference: <strong style="color:#0A1550;">#${shortId(lead.id)}</strong></p>
          </td></tr>

          <tr><td style="padding:20px 32px 0;">
            <div style="font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#6B7686;margin-bottom:10px;">Your request</div>
            <table width="100%" cellspacing="0" cellpadding="0">
              ${interest ? `<tr><td style="padding:6px 0;font-size:13px;color:#6B7686;width:90px;">Interest</td><td style="padding:6px 0;font-size:14px;color:#0B0F17;">${escapeHtml(interest)}</td></tr>` : ''}
              <tr><td style="padding:6px 0;font-size:13px;color:#6B7686;width:90px;">Intent</td><td style="padding:6px 0;font-size:14px;color:#0B0F17;">${INTENT_LABEL[lead.intent]}</td></tr>
              ${lead.location ? `<tr><td style="padding:6px 0;font-size:13px;color:#6B7686;">Location</td><td style="padding:6px 0;font-size:14px;color:#0B0F17;">${escapeHtml(lead.location)}</td></tr>` : ''}
            </table>
          </td></tr>

          ${
            lead.quoteItems.length
              ? `<tr><td style="padding:20px 32px 0;">
                  <div style="font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#6B7686;margin-bottom:10px;">Products you selected</div>
                  <table width="100%" cellspacing="0" cellpadding="0">${items}</table>
                </td></tr>`
              : ''
          }

          <tr><td style="padding:28px 32px 32px;">
            <a href="${SITE_URL}" style="display:inline-block;background:#1428A0;color:#FFFFFF;text-decoration:none;font-weight:700;font-size:14px;padding:12px 24px;border-radius:6px;">Visit luraenergy.com</a>
          </td></tr>

          <tr><td style="background:#F7F8FA;padding:16px 32px;font-size:11.5px;color:#6B7686;text-align:center;line-height:1.6;">
            Lura Energy &middot; Home of Premium Solar<br>
            This is an automated reply to your quote request.
          </td></tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function leadConfirmationText(lead: LeadForEmail): string {
  const lines: string[] = [
    `Hi ${lead.name},`,
    '',
    'Thank you for contacting Lura Energy. A representative will review your request and reach out within 1 business day.',
    '',
    `Your reference: #${shortId(lead.id)}`,
  ];
  const interest = interestText(lead);
  if (interest) lines.push(`Interest: ${interest}`);
  lines.push(`Intent: ${INTENT_LABEL[lead.intent]}`);
  if (lead.location) lines.push(`Location: ${lead.location}`);
  if (lead.quoteItems.length) {
    lines.push('', 'Products you selected:');
    for (const item of lead.quoteItems) {
      lines.push(`- ${item.productName} x${item.quantity}`);
    }
  }
  lines.push('', 'Lura Energy · Home of Premium Solar');
  return lines.join('\n');
}

export function leadConfirmationSubject(lead: LeadForEmail): string {
  return `We received your Lura Energy request (#${shortId(lead.id)})`;
}