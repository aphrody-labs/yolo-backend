/**
 * Aphrody Unified Multi-Provider Mail Dispatcher (2026 Edition)
 * Autonomous Failover Chain: Resend -> Gmail SMTP -> Self-Hosted VPS Relay (WireGuard Mesh 10.200.77.0/24)
 * Pure Bun v1.4.4+ / Zero npm dependencies.
 */

import { renderTemplate, type EmailTemplateName } from "./templates/index.js";

export type MailProvider = "resend" | "gmail" | "vps-mesh" | "auto";

export interface SendMailOptions {
  to: string | string[];
  from?: {
    email: string;
    name?: string;
  };
  replyTo?: string;
  subject?: string;
  html?: string;
  text?: string;
  template?: EmailTemplateName;
  templateData?: any;
  provider?: MailProvider;
  metadata?: Record<string, any>;
}

export interface SendMailReceipt {
  success: boolean;
  messageId: string;
  provider: MailProvider;
  recipient: string[];
  subject: string;
  timestamp: string;
  latencyMs: number;
  attempts: Array<{
    provider: MailProvider;
    success: boolean;
    error?: string;
    latencyMs: number;
  }>;
}

export class MailDispatcher {
  private resendApiKey?: string;
  private gmailUser?: string;
  private gmailAppPassword?: string;
  private vpsMeshEndpoint: string;
  private vpsMeshAuthToken?: string;
  private defaultFromEmail: string;
  private defaultFromName: string;

  constructor(config?: {
    resendApiKey?: string;
    gmailUser?: string;
    gmailAppPassword?: string;
    vpsMeshEndpoint?: string;
    vpsMeshAuthToken?: string;
    defaultFromEmail?: string;
    defaultFromName?: string;
  }) {
    this.resendApiKey = config?.resendApiKey || process.env.RESEND_API_KEY;
    this.gmailUser =
      config?.gmailUser || process.env.GMAIL_USER || "contact@aphrody.com";
    this.gmailAppPassword =
      config?.gmailAppPassword || process.env.GMAIL_APP_PASSWORD;
    this.vpsMeshEndpoint =
      config?.vpsMeshEndpoint ||
      process.env.VPS_MESH_ENDPOINT ||
      "http://10.200.77.5:17080/api/mail/send";
    this.vpsMeshAuthToken =
      config?.vpsMeshAuthToken ||
      process.env.VPS_MESH_TOKEN ||
      "aphrody-mesh-auth-2026";
    this.defaultFromEmail =
      config?.defaultFromEmail || "notifications@aphrody.app";
    this.defaultFromName = config?.defaultFromName || "Aphrody Cloud OS";
  }

  async send(options: SendMailOptions): Promise<SendMailReceipt> {
    const startTime = performance.now();
    const recipients = Array.isArray(options.to) ? options.to : [options.to];

    let subject = options.subject;
    let html = options.html;
    let text = options.text;

    // Render template if specified
    if (options.template) {
      const rendered = renderTemplate({
        template: options.template,
        data: {
          ...options.templateData,
          email: recipients[0],
        },
      });
      subject = subject || rendered.subject;
      html = html || rendered.html;
      text = text || rendered.text;
    }

    if (!subject) throw new Error("Email subject is required");
    if (!html && !text)
      throw new Error("Email content (html or text) is required");
    if (!html) html = `<pre style="font-family: sans-serif;">${text}</pre>`;
    if (!text) text = html.replace(/<[^>]+>/g, " ").trim();

    const fromEmail = options.from?.email || this.defaultFromEmail;
    const fromName = options.from?.name || this.defaultFromName;
    const fromFormatted = `${fromName} <${fromEmail}>`;

    const preferredProvider = options.provider || "auto";
    const attempts: SendMailReceipt["attempts"] = [];

    // Provider 1: Resend
    if (preferredProvider === "resend" || preferredProvider === "auto") {
      const resendStart = performance.now();
      try {
        if (!this.resendApiKey) {
          throw new Error("RESEND_API_KEY is not configured");
        }
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.resendApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: fromFormatted,
            to: recipients,
            subject,
            html,
            text,
            reply_to: options.replyTo,
          }),
        });

        const resLatency = Math.round(performance.now() - resendStart);
        if (res.ok) {
          const data = (await res.json()) as { id: string };
          attempts.push({
            provider: "resend",
            success: true,
            latencyMs: resLatency,
          });
          return {
            success: true,
            messageId: data.id || `resend_${Date.now()}`,
            provider: "resend",
            recipient: recipients,
            subject,
            timestamp: new Date().toISOString(),
            latencyMs: Math.round(performance.now() - startTime),
            attempts,
          };
        } else {
          const errText = await res.text();
          attempts.push({
            provider: "resend",
            success: false,
            error: `HTTP ${res.status}: ${errText}`,
            latencyMs: resLatency,
          });
        }
      } catch (err: any) {
        attempts.push({
          provider: "resend",
          success: false,
          error: err.message,
          latencyMs: Math.round(performance.now() - resendStart),
        });
      }
    }

    // Provider 2: Gmail SMTP Direct or API
    if (
      preferredProvider === "gmail" ||
      (preferredProvider === "auto" && attempts.length > 0)
    ) {
      const gmailStart = performance.now();
      try {
        if (!this.gmailAppPassword) {
          throw new Error("GMAIL_APP_PASSWORD is not configured");
        }
        // Direct RFC 5321 SMTP connection to smtp.gmail.com:465 via Bun native TLS socket
        const res = await this.sendViaGmailSmtp({
          from: fromEmail,
          fromName,
          recipients,
          subject,
          html,
          text,
        });

        const gmailLatency = Math.round(performance.now() - gmailStart);
        attempts.push({
          provider: "gmail",
          success: true,
          latencyMs: gmailLatency,
        });
        return {
          success: true,
          messageId: res.messageId,
          provider: "gmail",
          recipient: recipients,
          subject,
          timestamp: new Date().toISOString(),
          latencyMs: Math.round(performance.now() - startTime),
          attempts,
        };
      } catch (err: any) {
        attempts.push({
          provider: "gmail",
          success: false,
          error: err.message,
          latencyMs: Math.round(performance.now() - gmailStart),
        });
      }
    }

    // Provider 3: Self-Hosted VPS Mesh Mail Gateway (WireGuard mesh 10.200.77.5:17080)
    // Rate-limit resilient, zero cloud dependency, 100% self-hosted fallback.
    const vpsStart = performance.now();
    try {
      const vpsRes = await fetch(this.vpsMeshEndpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.vpsMeshAuthToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: fromEmail,
          fromName,
          to: recipients,
          subject,
          html,
          text,
          metadata: options.metadata,
        }),
      });

      const vpsLatency = Math.round(performance.now() - vpsStart);
      if (vpsRes.ok) {
        const vpsData = (await vpsRes.json()) as { messageId: string };
        attempts.push({
          provider: "vps-mesh",
          success: true,
          latencyMs: vpsLatency,
        });
        return {
          success: true,
          messageId: vpsData.messageId || `vps_${Date.now()}`,
          provider: "vps-mesh",
          recipient: recipients,
          subject,
          timestamp: new Date().toISOString(),
          latencyMs: Math.round(performance.now() - startTime),
          attempts,
        };
      } else {
        const vpsErr = await vpsRes.text();
        attempts.push({
          provider: "vps-mesh",
          success: false,
          error: `HTTP ${vpsRes.status}: ${vpsErr}`,
          latencyMs: vpsLatency,
        });
      }
    } catch (err: any) {
      attempts.push({
        provider: "vps-mesh",
        success: false,
        error: err.message,
        latencyMs: Math.round(performance.now() - vpsStart),
      });
    }

    // If all providers failed, throw exhaustive error with receipt
    throw new Error(
      `All email providers failed to dispatch email to [${recipients.join(", ")}]:\n` +
        attempts
          .map(
            (a) =>
              ` - [${a.provider}] (${a.latencyMs}ms): ${a.error || "Unknown error"}`,
          )
          .join("\n"),
    );
  }

  /**
   * Minimal native SMTP client using Bun.connect with TLS for smtp.gmail.com:465
   */
  private async sendViaGmailSmtp(params: {
    from: string;
    fromName: string;
    recipients: string[];
    subject: string;
    html: string;
    text: string;
  }): Promise<{ messageId: string }> {
    const gmailPassword = this.gmailAppPassword;
    return new Promise((resolve, reject) => {
      const boundary = `----=_Part_${Date.now()}_${Math.random().toString(36).substring(2)}`;
      const messageId = `<${Date.now()}.${Math.random().toString(36).substring(2)}@aphrody.app>`;

      const rawMime = [
        `From: ${params.fromName} <${params.from}>`,
        `To: ${params.recipients.join(", ")}`,
        `Subject: ${params.subject}`,
        `Message-ID: ${messageId}`,
        `MIME-Version: 1.0`,
        `Content-Type: multipart/alternative; boundary="${boundary}"`,
        ``,
        `--${boundary}`,
        `Content-Type: text/plain; charset=utf-8`,
        `Content-Transfer-Encoding: 7bit`,
        ``,
        params.text,
        ``,
        `--${boundary}`,
        `Content-Type: text/html; charset=utf-8`,
        `Content-Transfer-Encoding: 7bit`,
        ``,
        params.html,
        ``,
        `--${boundary}--`,
        `.`,
      ].join("\r\n");

      let step = 0;
      let buffer = "";

      const socket = Bun.connect({
        hostname: "smtp.gmail.com",
        port: 465,
        tls: true,
        socket: {
          data(sock, data) {
            buffer += new TextDecoder().decode(data);
            const lines = buffer.split("\r\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
              const code = parseInt(line.substring(0, 3), 10);
              if (isNaN(code)) continue;

              if (step === 0 && code === 220) {
                sock.write("EHLO aphrody.app\r\n");
                step = 1;
              } else if (step === 1 && code === 250) {
                if (line.includes("AUTH")) {
                  sock.write("AUTH LOGIN\r\n");
                  step = 2;
                }
              } else if (step === 2 && code === 334) {
                const userBase64 = Buffer.from(params.from).toString("base64");
                sock.write(`${userBase64}\r\n`);
                step = 3;
              } else if (step === 3 && code === 334) {
                const passBase64 = Buffer.from(gmailPassword || "").toString(
                  "base64",
                );
                sock.write(`${passBase64}\r\n`);
                step = 4;
              } else if (step === 4 && code === 235) {
                sock.write(`MAIL FROM:<${params.from}>\r\n`);
                step = 5;
              } else if (step === 5 && code === 250) {
                sock.write(`RCPT TO:<${params.recipients[0]}>\r\n`);
                step = 6;
              } else if (step === 6 && code === 250) {
                sock.write("DATA\r\n");
                step = 7;
              } else if (step === 7 && code === 354) {
                sock.write(`${rawMime}\r\n`);
                step = 8;
              } else if (step === 8 && code === 250) {
                sock.write("QUIT\r\n");
                sock.end();
                resolve({ messageId });
              } else if (code >= 400) {
                sock.end();
                reject(new Error(`SMTP Error (${code}): ${line}`));
              }
            }
          },
          error(sock, err) {
            reject(err);
          },
          close() {
            if (step < 8)
              reject(
                new Error(
                  "SMTP connection closed unexpectedly before completion",
                ),
              );
          },
        },
      });
    });
  }
}
