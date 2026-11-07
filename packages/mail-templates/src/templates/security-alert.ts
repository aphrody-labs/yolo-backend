import { renderEmailBase } from "./base.js";

export interface SecurityAlertTemplateProps {
  email: string;
  ipAddress: string;
  deviceOrAgent: string;
  location?: string;
  timestamp?: string;
  revokeUrl?: string;
}

export function renderSecurityAlertEmail(props: SecurityAlertTemplateProps): {
  html: string;
  text: string;
  subject: string;
} {
  const subject = "Security Alert: New Sign-in to your Aphrody account";
  const revokeUrl =
    props.revokeUrl || "https://aphrody.app/account/sessions?action=revoke_all";
  const time = props.timestamp || new Date().toUTCString();

  const contentHtml = `
    <p style="margin-top: 0; font-size: 16px;">
      A new active session was established for <strong>${props.email}</strong>.
    </p>

    <div style="background-color: #FEF2F2; border: 1px solid #FECACA; border-radius: 12px; padding: 18px 22px; margin: 24px 0;">
      <h3 style="margin-top: 0; margin-bottom: 12px; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em; color: #991B1B;">
        Session Details
      </h3>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="font-size: 13px;">
        <tr>
          <td style="padding: 4px 0; color: #450A0A; width: 110px;">&bull; <strong>IP Address:</strong></td>
          <td style="padding: 4px 0; color: #0F172A; font-family: monospace;">${props.ipAddress}</td>
        </tr>
        <tr>
          <td style="padding: 4px 0; color: #450A0A;">&bull; <strong>Client:</strong></td>
          <td style="padding: 4px 0; color: #0F172A;">${props.deviceOrAgent}</td>
        </tr>
        ${
          props.location
            ? `
        <tr>
          <td style="padding: 4px 0; color: #450A0A;">&bull; <strong>Location:</strong></td>
          <td style="padding: 4px 0; color: #0F172A;">${props.location}</td>
        </tr>
        `
            : ""
        }
        <tr>
          <td style="padding: 4px 0; color: #450A0A;">&bull; <strong>Time:</strong></td>
          <td style="padding: 4px 0; color: #0F172A;">${time}</td>
        </tr>
      </table>
    </div>

    <p style="font-size: 14px;">
      <strong>Was this you?</strong> If so, you can safely disregard this message. If you do not recognize this activity, revoke all active sessions immediately and update your credentials.
    </p>
  `;

  const html = renderEmailBase({
    previewText: `Security Alert: New sign-in detected from ${props.ipAddress}.`,
    title: "New Sign-in Detected",
    badge: { text: "Security Notice", variant: "danger" },
    contentHtml,
    cta: {
      label: "Revoke All Sessions",
      url: revokeUrl,
      variant: "danger",
    },
    secondaryLinks: [
      { label: "Change Password", url: "https://aphrody.app/account/password" },
      {
        label: "Security Activity Log",
        url: "https://aphrody.app/account/audit",
      },
    ],
    recipientEmail: props.email,
  });

  const text = `Security Alert: New Sign-in Detected

Account: ${props.email}
IP Address: ${props.ipAddress}
Client: ${props.deviceOrAgent}
Time: ${time}

If you did not authorize this login, revoke sessions immediately:
${revokeUrl}

Aphrody Security Team - security@aphrody.app`;

  return { html, text, subject };
}
