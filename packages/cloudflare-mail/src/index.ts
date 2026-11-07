/**
 * Cloudflare Edge Email & Routing Client (2026 Edition)
 * Pure Bun v1.4.4+ / Full TypeScript 7 support.
 */

export interface CloudflareMailConfig {
  accountId: string;
  apiToken: string;
  zoneId: string;
  domain?: string;
}

export interface InboundEmailRecord {
  id: string;
  messageId: string;
  from: string;
  to: string;
  subject: string;
  spfStatus: string;
  dkimStatus: string;
  receivedAt: number;
}

export class CloudflareMailClient {
  private accountId: string;
  private apiToken: string;
  private zoneId: string;
  private domain: string;

  constructor(config: CloudflareMailConfig) {
    this.accountId = config.accountId;
    this.apiToken = config.apiToken;
    this.zoneId = config.zoneId;
    this.domain = config.domain || "aphrody.app";
  }

  private headers() {
    return {
      Authorization: `Bearer ${this.apiToken}`,
      "Content-Type": "application/json",
    };
  }

  /**
   * Checks Email Routing status
   */
  async getRoutingStatus(): Promise<{ enabled: boolean; status: string }> {
    const res = await fetch(
      `https://api.cloudflare.com/client/v4/zones/${this.zoneId}/email/routing`,
      {
        headers: this.headers(),
      },
    );
    if (!res.ok) return { enabled: false, status: `error_${res.status}` };
    const data = (await res.json()) as any;
    return {
      enabled: !!data.result?.enabled,
      status: data.result?.status || "unknown",
    };
  }

  /**
   * Retrieves required and current DNS records
   */
  async getRequiredDns(): Promise<
    Array<{ type: string; name: string; content: string; priority?: number }>
  > {
    const res = await fetch(
      `https://api.cloudflare.com/client/v4/zones/${this.zoneId}/email/routing/dns`,
      {
        headers: this.headers(),
      },
    );
    if (!res.ok) return [];
    const data = (await res.json()) as any;
    return data.result || [];
  }

  /**
   * Lists active Routing Rules
   */
  async listRoutingRules(): Promise<any[]> {
    const res = await fetch(
      `https://api.cloudflare.com/client/v4/zones/${this.zoneId}/email/routing/rules`,
      {
        headers: this.headers(),
      },
    );
    if (!res.ok) return [];
    const data = (await res.json()) as any;
    return data.result || [];
  }

  /**
   * Edge Email Worker Handler Factory
   */
  static createWorkerHandler(forwardDestination = "contact@aphrody.com") {
    return {
      async email(message: any, env: any): Promise<void> {
        const id = `in_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
        const from = message.from || "unknown";
        const to = message.to || "unknown";
        const subject = message.headers?.get("subject") || "(No Subject)";
        const messageId = message.headers?.get("message-id") || id;

        // Persist to D1 if configured
        if (env.DB) {
          try {
            await env.DB.prepare(
              "INSERT INTO inbound_emails (id, messageId, fromAddress, toAddress, subject, spfStatus, dkimStatus, rawHeaders, bodySnippet, receivedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            )
              .bind(
                id,
                messageId,
                from,
                to,
                subject,
                "pass",
                "pass",
                "",
                "",
                Date.now(),
              )
              .run();
          } catch {}
        }

        // Forward email
        await message.forward(forwardDestination);
      },

      async fetch(): Promise<Response> {
        return Response.json({
          status: "healthy",
          runtime: "cloudflare-worker",
          timestamp: new Date().toISOString(),
        });
      },
    };
  }
}
