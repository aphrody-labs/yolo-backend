export * from "./base.js";
export * from "./welcome.js";
export * from "./magic-link.js";
export * from "./two-factor-code.js";
export * from "./security-alert.js";
export * from "./invoice.js";
export * from "./system-alert.js";
export * from "./password-reset.js";
export * from "./noreply.js";

import { renderWelcomeEmail, type WelcomeTemplateProps } from "./welcome.js";
import { renderMagicLinkEmail, type MagicLinkTemplateProps } from "./magic-link.js";
import { renderTwoFactorEmail, type TwoFactorTemplateProps } from "./two-factor-code.js";
import { renderSecurityAlertEmail, type SecurityAlertTemplateProps } from "./security-alert.js";
import { renderInvoiceEmail, type InvoiceTemplateProps } from "./invoice.js";
import { renderSystemAlertEmail, type SystemAlertTemplateProps } from "./system-alert.js";
import { renderPasswordResetEmail, type PasswordResetTemplateProps } from "./password-reset.js";
import { renderNoreplyNotification, type NoreplyNotificationProps } from "./noreply.js";

export type EmailTemplateName =
  | "welcome"
  | "magic-link"
  | "two-factor-code"
  | "security-alert"
  | "invoice"
  | "system-alert"
  | "password-reset"
  | "noreply";

export interface RenderTemplateOptions {
  template: EmailTemplateName;
  data: any;
}

export function renderTemplate(options: RenderTemplateOptions): { html: string; text: string; subject: string; from?: string } {
  switch (options.template) {
    case "welcome":
      return renderWelcomeEmail(options.data as WelcomeTemplateProps);
    case "magic-link":
      return renderMagicLinkEmail(options.data as MagicLinkTemplateProps);
    case "two-factor-code":
      return renderTwoFactorEmail(options.data as TwoFactorTemplateProps);
    case "security-alert":
      return renderSecurityAlertEmail(options.data as SecurityAlertTemplateProps);
    case "invoice":
      return renderInvoiceEmail(options.data as InvoiceTemplateProps);
    case "system-alert":
      return renderSystemAlertEmail(options.data as SystemAlertTemplateProps);
    case "password-reset":
      return renderPasswordResetEmail(options.data as PasswordResetTemplateProps);
    case "noreply":
      return renderNoreplyNotification(options.data as NoreplyNotificationProps);
    default:
      throw new Error(`Unknown email template: ${options.template}`);
  }
}
