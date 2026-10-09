import {
  getTransport,
  getLeadRecipient,
  getLeadSender,
  getSubjectPrefix,
} from '@/lib/email/transport';
import {
  leadNotificationHtml,
  leadNotificationText,
  leadNotificationSubject,
} from '@/lib/email/templates/lead-notification';
import {
  leadConfirmationHtml,
  leadConfirmationText,
  leadConfirmationSubject,
} from '@/lib/email/templates/lead-confirmation';
import type { LeadForEmail } from '@/lib/email/types';

/**
 * Fire-and-forget email dispatch. Never throws.
 * Safe to call when SMTP is unconfigured — silently no-ops.
 */
export async function sendLeadEmails(lead: LeadForEmail): Promise<void> {
  const transport = getTransport();
  if (!transport) {
    console.info('[email] SMTP not configured — skipping lead notification.');
    return;
  }

  const from = getLeadSender();
  const to = getLeadRecipient();

  const jobs: Promise<unknown>[] = [];

  // --- Admin notification ---
  if (to) {
    jobs.push(
      transport
        .sendMail({
          from,
          to,
          replyTo: lead.email,
          subject: `${getSubjectPrefix()} ${leadNotificationSubject(lead)}`,
          text: leadNotificationText(lead),
          html: leadNotificationHtml(lead),
        })
        .catch((err) => {
          console.error('[email] Lead notification failed:', err);
        }),
    );
  } else {
    console.warn('[email] LEAD_NOTIFY_TO is not set — skipping admin notification.');
  }

  // --- Customer auto-reply ---
  jobs.push(
    transport
      .sendMail({
        from,
        to: lead.email,
        replyTo: to ?? from,
        subject: leadConfirmationSubject(lead),
        text: leadConfirmationText(lead),
        html: leadConfirmationHtml(lead),
      })
      .catch((err) => {
        console.error('[email] Customer confirmation failed:', err);
      }),
  );

  await Promise.all(jobs);
}