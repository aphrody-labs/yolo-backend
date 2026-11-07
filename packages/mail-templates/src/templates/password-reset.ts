import { renderEmailBase } from "./base.js";

export interface PasswordResetTemplateProps {
  email: string;
  resetUrl: string;
  expiresInMinutes?: number;
  ipAddress?: string;
}

export function renderPasswordResetEmail(props: PasswordResetTemplateProps): { html: string; text: string; subject: string } {
  const subject = "Reset your Aphrody password";
  const ttl = props.expiresInMinutes || 30;

  const contentHtml = `
    <p style="margin-top: 0; font-size: 16px;">
      We received a request to reset the password for your Aphrody account (<strong>${props.email}</strong>).
    </p>
    <p>
      Click the button below to choose a new password. For security, this link is valid for <strong>${ttl} minutes</strong>.
    </p>

    ${
      props.ipAddress
        ? `
      <div style="background-color: #F8FAFC; border: 1px dashed #CBD5E1; border-radius: 10px; padding: 12px 16px; margin: 20px 0; font-size: 13px; color: #64748B;">
        Requested from IP: <code>${props.ipAddress}</code>
      </div>
    `
        : ""
    }

    <p style="font-size: 13px; color: #94A3B8; margin-top: 24px;">
      If you did not make this request, you can safely ignore this email. Your password will remain unchanged and your account is secure.
    </p>
  `;

  const html = renderEmailBase({
    previewText: `Reset your Aphrody password (link valid for ${ttl} min).`,
    title: "Password Reset Request",
    badge: { text: "Account Security", variant: "warning" },
    contentHtml,
    cta: {
      label: "Reset Password",
      url: props.resetUrl,
      variant: "primary",
    },
    secondaryLinks: [
      { label: "Need help?", url: "mailto:support@aphrody.app" },
      { label: "Security Hub", url: "https://aphrody.app/account/security" },
    ],
    recipientEmail: props.email,
  });

  const text = `Reset your Aphrody password

Click the link below to set a new password (valid for ${ttl} minutes):
${props.resetUrl}

If you did not request this, ignore this email.
Aphrody Security Team - security@aphrody.app`;

  return { html, text, subject };
}
