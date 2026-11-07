/**
 * Zumba Webmail Core Engine (2026 Edition)
 * Replaces Roundcube, Zimbra, and OVH Webmail with a high-performance Bun/TSX server.
 */

import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

export interface MailboxMessage {
  id: string;
  folder: "inbox" | "sent" | "drafts" | "trash" | "spam";
  from: string;
  to: string[];
  subject: string;
  date: string;
  snippet: string;
  html: string;
  text: string;
  unread: boolean;
  starred: boolean;
}

export class ZumbaWebmailEngine {
  private messages: MailboxMessage[] = [];

  constructor() {
    this.seedDefaultMessages();
  }

  getFolderMessages(folder = "inbox"): MailboxMessage[] {
    return this.messages.filter((m) => m.folder === folder);
  }

  getMessage(id: string): MailboxMessage | undefined {
    return this.messages.find((m) => m.id === id);
  }

  sendMessage(params: {
    from?: string;
    to: string | string[];
    subject: string;
    html?: string;
    text?: string;
    folder?: MailboxMessage["folder"];
  }): MailboxMessage {
    const recipients = Array.isArray(params.to)
      ? params.to
      : params.to
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
    const plain =
      params.text || (params.html ? params.html.replace(/<[^>]+>/g, " ").trim() : "");
    const html =
      params.html || `<p>${plain.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>`;
    const msg: MailboxMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      folder: params.folder || "sent",
      from: params.from || "contact@aphrody.com",
      to: recipients.length ? recipients : ["contact@aphrody.com"],
      subject: params.subject || "(No subject)",
      snippet: plain.slice(0, 120),
      date: new Date().toISOString(),
      html,
      text: plain,
      unread: false,
      starred: false,
    };
    this.messages.unshift(msg);
    return msg;
  }

  getHtmlUi(): string {
    const p = resolve(__dirname, "ui", "index.html");
    return readFileSync(p, "utf8");
  }

  private seedDefaultMessages() {
    this.messages = [
      {
        id: "msg_1",
        folder: "inbox",
        from: "Aphrody Cloud OS <notifications@aphrody.app>",
        to: ["contact@aphrody.com"],
        subject: "Welcome to Aphrody WebOS & Edge Cloud",
        snippet:
          "Your account has been provisioned on our high-performance Cloudflare Edge...",
        date: new Date().toISOString(),
        html: `<h2>Welcome to Aphrody WebOS</h2><p>Your account is active on the WireGuard mesh cluster and Cloudflare edge.</p>`,
        text: "Welcome to Aphrody WebOS. Your account is active on the WireGuard mesh cluster and Cloudflare edge.",
        unread: false,
        starred: true,
      },
      {
        id: "msg_2",
        folder: "inbox",
        from: "Aphrody System <noreply@aphrody.app>",
        to: ["contact@aphrody.com"],
        subject: "[DEPLOYMENT] Mesh Gateway v1.1.0 Released",
        snippet:
          "Deployment verified on Hostinger prod (72.60.186.43) and OVH fleet...",
        date: new Date().toISOString(),
        html: `<h2>Deployment Verified</h2><p>Cluster synchronized across all 3 nodes without errors.</p>`,
        text: "Deployment verified on Hostinger prod (72.60.186.43) and OVH fleet.",
        unread: true,
        starred: false,
      },
    ];
  }
}
