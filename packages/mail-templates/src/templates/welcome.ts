import { renderEmailBase } from "./base.js";

export interface WelcomeTemplateProps {
  name?: string;
  email: string;
  dashboardUrl?: string;
  apiKeyPrefix?: string;
}

export function renderWelcomeEmail(props: WelcomeTemplateProps): { html: string; text: string; subject: string } {
  const subject = "Welcome to Aphrody WebOS & Edge Cloud";
  const name = props.name || props.email.split("@")[0];
  const dashboardUrl = props.dashboardUrl || "https://aphrody.app/dashboard";

  const contentHtml = `
    <p style="margin-top: 0; font-size: 16px;">
      Hello <strong>${name}</strong>,
    </p>
    <p>
      Welcome to <strong>Aphrody WebOS</strong>. Your account has been provisioned on our high-performance Cloudflare Edge and WireGuard mesh cluster.
    </p>

    <div style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; padding: 20px; margin: 24px 0;">
      <h3 style="margin-top: 0; margin-bottom: 12px; font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em; color: #475569;">
        Your Provisioned Capabilities
      </h3>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="font-size: 14px;">
        <tr>
          <td style="padding: 6px 0; color: #0F172A;">&bull; <strong>Edge WebOS</strong></td>
          <td style="padding: 6px 0; text-align: right; color: #16A34A; font-weight: 600;">Active (Global CDN)</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #0F172A;">&bull; <strong>Cloudflare D1 &amp; KV Cache</strong></td>
          <td style="padding: 6px 0; text-align: right; color: #16A34A; font-weight: 600;">Connected</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #0F172A;">&bull; <strong>Email Routing (@aphrody.app)</strong></td>
          <td style="padding: 6px 0; text-align: right; color: #16A34A; font-weight: 600;">Configured</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #0F172A;">&bull; <strong>WireGuard Mesh Failover</strong></td>
          <td style="padding: 6px 0; text-align: right; color: #16A34A; font-weight: 600;">3 VPS Nodes</td>
        </tr>
      </table>
    </div>

    <p style="font-size: 14px; color: #64748B;">
      To start deploying workers, configuring AI agents, or accessing the unified WebOS workspace, launch your dashboard below.
    </p>
  `;

  const html = renderEmailBase({
    previewText: "Your Aphrody WebOS account is ready on our global edge network.",
    title: "Welcome to Aphrody",
    badge: { text: "Onboarding Complete", variant: "success" },
    contentHtml,
    cta: {
      label: "Open Aphrody Dashboard",
      url: dashboardUrl,
      variant: "primary",
    },
    secondaryLinks: [
      { label: "Documentation", url: "https://aphrody.com/docs" },
      { label: "API Reference", url: "https://aphrody.com/api" },
      { label: "Community", url: "https://aphrody.com/community" },
    ],
    recipientEmail: props.email,
  });

  const text = `Welcome to Aphrody, ${name}!

Your account has been provisioned on our high-performance Cloudflare Edge and WireGuard mesh cluster.

Capabilities provisioned:
- Edge WebOS: Active (Global CDN)
- Cloudflare D1 & KV: Connected
- Email Routing (@aphrody.app): Configured
- WireGuard Mesh Failover: 3 VPS Nodes

Access your dashboard: ${dashboardUrl}

Aphrody Labs SAS - Paris, France - contact@aphrody.app`;

  return { html, text, subject };
}
