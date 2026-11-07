import { renderEmailBase } from "./base.js";

export interface NoreplyNotificationProps {
  email: string;
  senderDomain?: "aphrody.com" | "aphrody.app";
  category: "DEPLOYMENT" | "SYSTEM_SYNC" | "BACKUP" | "BILLING_SUMMARY" | "SECURITY_DIGEST";
  title: string;
  summary: string;
  details: Array<{ label: string; value: string }>;
  actionUrl?: string;
  actionLabel?: string;
}

export function renderNoreplyNotification(props: NoreplyNotificationProps): {
  html: string;
  text: string;
  subject: string;
  from: string;
} {
  const domain = props.senderDomain || "aphrody.app";
  const from = `Aphrody System <noreply@${domain}>`;
  const subject = `[${props.category}] ${props.title}`;

  const detailsRows = props.details
    .map(
      (d) => `
    <tr>
      <td style="padding: 6px 0; color: #64748B; width: 140px; font-size: 13px;">&bull; <strong>${d.label}:</strong></td>
      <td style="padding: 6px 0; color: #0F172A; font-size: 13px; font-family: monospace;">${d.value}</td>
    </tr>
  `
    )
    .join("");

  const contentHtml = `
    <p style="margin-top: 0; font-size: 15px;">
      ${props.summary}
    </p>

    <div style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; padding: 18px 22px; margin: 24px 0;">
      <h3 style="margin-top: 0; margin-bottom: 12px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.06em; color: #475569;">
        Telemetry &amp; Execution Receipt
      </h3>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
        ${detailsRows}
      </table>
    </div>

    <p style="font-size: 12px; color: #94A3B8;">
      This is an automated system dispatch from <strong>noreply@${domain}</strong>. Replies to this email address are not monitored.
    </p>
  `;

  const html = renderEmailBase({
    previewText: `[${props.category}] ${props.title}`,
    title: props.title,
    badge: { text: props.category, variant: "default" },
    contentHtml,
    cta: props.actionUrl
      ? {
          label: props.actionLabel || "View Dashboard",
          url: props.actionUrl,
          variant: "primary",
        }
      : undefined,
    recipientEmail: props.email,
  });

  const text = `[${props.category}] ${props.title}

${props.summary}

Details:
${props.details.map((d) => `- ${d.label}: ${d.value}`).join("\n")}

This is an automated system dispatch from noreply@${domain}.
Aphrody Labs SAS - Paris, France`;

  return { html, text, subject, from };
}
