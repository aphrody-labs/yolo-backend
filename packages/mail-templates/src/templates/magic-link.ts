import { renderEmailBase } from "./base.js";

export interface MagicLinkTemplateProps {
  email: string;
  url: string;
  token?: string;
  expiresInMinutes?: number;
  ipAddress?: string;
}

export function renderMagicLinkEmail(props: MagicLinkTemplateProps): { html: string; text: string; subject: string } {
  const subject = "Sign in to Aphrody (Magic Link)";
  const ttl = props.expiresInMinutes || 15;

  const contentHtml = `
    <p style="margin-top: 0; font-size: 16px;">
      A passwordless sign-in request was initiated for <strong>${props.email}</strong>.
    </p>
    <p>
      Click the button below to authenticate securely without entering a password. This link is single-use and expires in <strong>${ttl} minutes</strong>.
    </p>

    <div style="background-color: #F8FAFC; border: 1px dashed #CBD5E1; border-radius: 10px; padding: 14px 18px; margin: 20px 0; font-size: 13px; color: #64748B;">
      <div>&bull; Security Protocol: <strong>Cloudflare Turnstile Verified</strong></div>
      ${props.ipAddress ? `<div>&bull; Requested from IP: <code>${props.ipAddress}</code></div>` : ""}
    </div>

    <p style="font-size: 13px; color: #94A3B8; margin-top: 24px;">
      If you did not request this sign-in link, you can safely ignore this email. No changes will be made to your account.
    </p>
  `;

  const html = renderEmailBase({
    previewText: `Your Aphrody sign-in link (expires in ${ttl} min). Click to enter.`,
    title: "Sign in to Aphrody",
    badge: { text: "Passwordless Auth", variant: "purple" },
    contentHtml,
    cta: {
      label: "Sign In Securely",
      url: props.url,
      variant: "primary",
    },
    secondaryLinks: [
      { label: "Need help?", url: "mailto:support@aphrody.app" },
      { label: "Security Hub", url: "https://aphrody.app/account/security" },
    ],
    recipientEmail: props.email,
  });

  const text = `Sign in to Aphrody

Click the link below to authenticate securely without a password (valid for ${ttl} minutes):
${props.url}

If you did not request this link, ignore this email.
Aphrody Labs SAS - contact@aphrody.app`;

  return { html, text, subject };
}
