/**
 * Aphrody Email Template Engine (2026 Edition)
 * Pure Bun/TypeScript responsive HTML layout with zero npm dependencies.
 * Built for 100% email client compatibility (Apple Mail, Gmail, Outlook, Thunderbird, Proton).
 * Full Dark Mode support via prefers-color-scheme.
 * Embedded Aphrody brand identity, SVG vector logo, and GDPR/RGPD compliance.
 */

export interface EmailBaseProps {
  previewText: string;
  title: string;
  preheader?: string;
  badge?: {
    text: string;
    variant?: "default" | "success" | "warning" | "danger" | "purple";
  };
  contentHtml: string;
  cta?: {
    label: string;
    url: string;
    variant?: "primary" | "secondary" | "danger";
  };
  secondaryLinks?: Array<{ label: string; url: string }>;
  recipientEmail?: string;
}

export function renderEmailBase(props: EmailBaseProps): string {
  const badgeColors = {
    default: { bg: "#EFF6FF", text: "#1D4ED8", border: "#BFDBFE" },
    success: { bg: "#ECFDF5", text: "#047857", border: "#A7F3D0" },
    warning: { bg: "#FFFBEB", text: "#B45309", border: "#FDE68A" },
    danger: { bg: "#FEF2F2", text: "#B91C1C", border: "#FECACA" },
    purple: { bg: "#F5F3FF", text: "#6D28D9", border: "#DDD6FE" },
  };

  const currentBadge = props.badge
    ? badgeColors[props.badge.variant || "default"]
    : null;

  const ctaColors = {
    primary: {
      bg: "#2563EB",
      bgDark: "#3B82F6",
      text: "#FFFFFF",
      shadow: "0 4px 14px rgba(37, 99, 235, 0.35)",
    },
    secondary: {
      bg: "#0F172A",
      bgDark: "#1E293B",
      text: "#FFFFFF",
      shadow: "0 4px 14px rgba(15, 23, 42, 0.25)",
    },
    danger: {
      bg: "#DC2626",
      bgDark: "#EF4444",
      text: "#FFFFFF",
      shadow: "0 4px 14px rgba(220, 38, 38, 0.35)",
    },
  };

  const currentCta = props.cta
    ? ctaColors[props.cta.variant || "primary"]
    : null;

  return `<!DOCTYPE html>
<html lang="en" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="x-apple-disable-message-reformatting">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="format-detection" content="telephone=no, date=no, address=no, email=no, url=no">
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
  <title>${props.title} - Aphrody</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    :root {
      color-scheme: light dark;
      supported-color-schemes: light dark;
    }
    body {
      margin: 0;
      padding: 0;
      width: 100% !important;
      -webkit-text-size-adjust: 100%;
      -ms-text-size-adjust: 100%;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background-color: #F8FAFC;
      color: #0F172A;
    }
    table {
      border-collapse: collapse;
      mso-table-lspace: 0pt;
      mso-table-rspace: 0pt;
    }
    img {
      border: 0;
      height: auto;
      line-height: 100%;
      outline: none;
      text-decoration: none;
      -ms-interpolation-mode: bicubic;
    }
    .wrapper {
      width: 100%;
      table-layout: fixed;
      background-color: #F8FAFC;
      padding-top: 40px;
      padding-bottom: 40px;
    }
    .main-card {
      width: 100%;
      max-width: 600px;
      margin: 0 auto;
      background-color: #FFFFFF;
      border-radius: 16px;
      border: 1px solid #E2E8F0;
      overflow: hidden;
      box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.05), 0 8px 10px -6px rgba(15, 23, 42, 0.03);
    }
    .email-header {
      padding: 32px 36px 20px 36px;
      border-bottom: 1px solid #F1F5F9;
    }
    .email-body {
      padding: 32px 36px;
      line-height: 1.6;
      font-size: 15px;
      color: #334155;
    }
    .email-footer {
      padding: 28px 36px;
      background-color: #F8FAFC;
      border-top: 1px solid #E2E8F0;
      font-size: 12px;
      color: #64748B;
      line-height: 1.5;
    }
    .button-link {
      display: inline-block;
      padding: 13px 28px;
      font-size: 14px;
      font-weight: 600;
      text-decoration: none;
      border-radius: 10px;
      text-align: center;
      transition: all 0.2s ease;
    }
    .badge-tag {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 9999px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 14px;
    }

    /* Dark Mode Media Query */
    @media (prefers-color-scheme: dark) {
      body, .wrapper {
        background-color: #090D16 !important;
        color: #F1F5F9 !important;
      }
      .main-card {
        background-color: #0F172A !important;
        border-color: #1E293B !important;
        box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5) !important;
      }
      .email-header {
        border-bottom-color: #1E293B !important;
      }
      .email-body {
        color: #CBD5E1 !important;
      }
      .email-footer {
        background-color: #0A0F1D !important;
        border-top-color: #1E293B !important;
        color: #94A3B8 !important;
      }
      .code-box {
        background-color: #0A0F1D !important;
        border-color: #334155 !important;
        color: #38BDF8 !important;
      }
      .table-box {
        border-color: #1E293B !important;
      }
      .table-header {
        background-color: #1E293B !important;
        color: #F1F5F9 !important;
      }
      .table-row {
        border-bottom-color: #1E293B !important;
        color: #CBD5E1 !important;
      }
    }
  </style>
</head>
<body>
  <!-- Hidden Preheader for email previews -->
  <div style="display: none; max-height: 0px; overflow: hidden; mso-hide: all;">
    ${props.previewText}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
  </div>

  <table class="wrapper" role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
    <tr>
      <td align="center">
        <table class="main-card" role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
          
          <!-- Header: Aphrody Vector Brand Identity -->
          <tr>
            <td class="email-header">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td align="left" valign="middle">
                    <a href="https://aphrody.com" target="_blank" style="text-decoration: none; display: inline-flex; align-items: center;">
                      <!-- Inline Aphrody Minimalist Prism Vector Logo -->
                      <svg width="34" height="34" viewBox="0 0 34 34" fill="none" xmlns="http://www.w3.org/2000/svg" style="vertical-align: middle; margin-right: 12px;">
                        <rect width="34" height="34" rx="9" fill="#2563EB" />
                        <path d="M17 7L25 24H9L17 7Z" fill="white" opacity="0.9" />
                        <circle cx="17" cy="18" r="3.5" fill="#38BDF8" />
                      </svg>
                      <span style="font-size: 20px; font-weight: 800; letter-spacing: -0.03em; color: #0F172A; vertical-align: middle;">
                        aphrody<span style="color: #2563EB;">.</span>
                      </span>
                    </a>
                  </td>
                  <td align="right" valign="middle">
                    <span style="font-size: 12px; font-weight: 600; color: #64748B; letter-spacing: 0.05em; text-transform: uppercase;">
                      Cloud OS
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Body Content -->
          <tr>
            <td class="email-body">
              ${
                props.badge
                  ? `
                <div>
                  <span class="badge-tag" style="background-color: ${currentBadge?.bg}; color: ${currentBadge?.text}; border: 1px solid ${currentBadge?.border};">
                    ${props.badge.text}
                  </span>
                </div>
              `
                  : ""
              }

              <h1 style="margin-top: 0; margin-bottom: 18px; font-size: 22px; font-weight: 700; letter-spacing: -0.02em; color: inherit;">
                ${props.title}
              </h1>

              ${props.contentHtml}

              ${
                props.cta
                  ? `
                <div style="margin-top: 32px; margin-bottom: 24px; text-align: left;">
                  <!--[if mso]>
                  <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${props.cta.url}" style="height:44px;v-text-anchor:middle;width:220px;" arcsize="20%" stroke="f" fillcolor="${currentCta?.bg}">
                    <w:anchorlock/>
                    <center style="color:${currentCta?.text};font-family:sans-serif;font-size:14px;font-weight:bold;">${props.cta.label}</center>
                  </v:roundrect>
                  <![endif]-->
                  <!--[if !mso]><!-- -->
                  <a href="${props.cta.url}" class="button-link" target="_blank" style="background-color: ${currentCta?.bg}; color: ${currentCta?.text}; box-shadow: ${currentCta?.shadow};">
                    ${props.cta.label} &rarr;
                  </a>
                  <!--<![endif]-->
                </div>
              `
                  : ""
              }

              ${
                props.secondaryLinks && props.secondaryLinks.length > 0
                  ? `
                <div style="margin-top: 20px; font-size: 13px; color: #64748B;">
                  ${props.secondaryLinks.map((link) => `<a href="${link.url}" target="_blank" style="color: #2563EB; text-decoration: underline; margin-right: 14px;">${link.label}</a>`).join("")}
                </div>
              `
                  : ""
              }
            </td>
          </tr>

          <!-- Footer: Real Legal, Compliance, and Security Notices -->
          <tr>
            <td class="email-footer">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td align="left">
                    <p style="margin: 0 0 10px 0; font-size: 12px; font-weight: 600; color: #475569;">
                      Aphrody Labs SAS &bull; Cloudflare Edge &amp; Autonomous Mesh Infrastructure
                    </p>
                    <p style="margin: 0 0 12px 0;">
                      Registered in Paris, France &bull; SIREN: 918 827 892 &bull; Contact: <a href="mailto:contact@aphrody.app" style="color: #2563EB; text-decoration: none;">contact@aphrody.app</a>
                    </p>
                    <p style="margin: 0 0 8px 0; font-size: 11px;">
                      You received this email because an action or automated event was triggered for ${props.recipientEmail ? `<strong>${props.recipientEmail}</strong>` : "your Aphrody account"}.
                    </p>
                    <p style="margin: 0; font-size: 11px;">
                      <a href="https://aphrody.com/privacy" style="color: #64748B; text-decoration: underline;">Privacy Policy</a> &bull;
                      <a href="https://aphrody.com/terms" style="color: #64748B; text-decoration: underline;">Terms of Service</a> &bull;
                      <a href="https://aphrody.app/account/security" style="color: #64748B; text-decoration: underline;">Security Hub</a> &bull;
                      <a href="https://aphrody.app/unsubscribe" style="color: #64748B; text-decoration: underline;">Unsubscribe</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
