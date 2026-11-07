import { renderEmailBase } from "./base.js";

export interface TwoFactorTemplateProps {
  email: string;
  code: string;
  expiresInMinutes?: number;
}

export function renderTwoFactorEmail(props: TwoFactorTemplateProps): {
  html: string;
  text: string;
  subject: string;
} {
  const subject = `${props.code} is your Aphrody verification code`;
  const ttl = props.expiresInMinutes || 10;

  const contentHtml = `
    <p style="margin-top: 0; font-size: 16px;">
      Use the following single-use verification code to complete your sign-in to Aphrody:
    </p>

    <div style="text-align: center; margin: 32px 0;">
      <div style="display: inline-block; background-color: #F1F5F9; border: 2px solid #CBD5E1; border-radius: 12px; padding: 16px 36px; letter-spacing: 0.25em; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 32px; font-weight: 800; color: #0F172A;">
        ${props.code}
      </div>
      <div style="margin-top: 10px; font-size: 12px; color: #64748B;">
        Expires in <strong>${ttl} minutes</strong> &bull; Do not share this code with anyone
      </div>
    </div>

    <p style="font-size: 13px; color: #94A3B8;">
      If you did not attempt to sign in to your Aphrody account, please change your password immediately or contact our security team.
    </p>
  `;

  const html = renderEmailBase({
    previewText: `${props.code} is your Aphrody verification code. Valid for ${ttl} minutes.`,
    title: "Two-Factor Verification",
    badge: { text: "Security Check", variant: "warning" },
    contentHtml,
    cta: {
      label: "Open Security Settings",
      url: "https://aphrody.app/account/security",
      variant: "secondary",
    },
    recipientEmail: props.email,
  });

  const text = `Aphrody Verification Code: ${props.code}

Enter this code to complete authentication. This code expires in ${ttl} minutes.
Never share your verification code.

Aphrody Labs SAS - contact@aphrody.app`;

  return { html, text, subject };
}
