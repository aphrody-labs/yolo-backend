/**
 * Aphrody Mail Studio Server (2026 Edition)
 * Native Bun HTTP Server serving the live Mail Studio GUI & Dispatcher API.
 * Runs on http://127.0.0.1:8799
 */

import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { renderTemplate, type EmailTemplateName } from "./templates/index.js";
import { MailDispatcher, type MailProvider } from "./dispatcher.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const htmlIndex = readFileSync(resolve(__dirname, "index.html"), "utf8");

const dispatcher = new MailDispatcher();

const sampleData: Record<EmailTemplateName, any> = {
  welcome: {
    name: "Alexandre",
    email: "contact@aphrody.com",
    dashboardUrl: "https://aphrody.app/dashboard",
  },
  "magic-link": {
    email: "contact@aphrody.com",
    url: "https://aphrody.app/auth/verify?token=magic_2026_981a7bdf821c45",
    expiresInMinutes: 15,
    ipAddress: "51.77.147.152",
  },
  "two-factor-code": {
    email: "contact@aphrody.com",
    code: "849201",
    expiresInMinutes: 10,
  },
  "security-alert": {
    email: "contact@aphrody.com",
    ipAddress: "72.60.186.43",
    deviceOrAgent: "Firefox 134 / macOS Sonoma (Apple Silicon)",
    location: "Paris, Île-de-France, FR",
    timestamp: new Date().toUTCString(),
    revokeUrl: "https://aphrody.app/account/sessions?action=revoke_all",
  },
  invoice: {
    email: "contact@aphrody.com",
    invoiceId: "INV-2026-0891",
    invoiceDate: "November 7, 2026",
    items: [
      {
        description: "Aphrody WebOS Pro Tier (Annual)",
        period: "2026-11-07 to 2027-11-07",
        amountEur: 120.0,
      },
      {
        description: "Cloudflare D1 & KV Distributed Edge Storage",
        period: "Monthly allocation",
        amountEur: 15.0,
      },
      {
        description: "WireGuard Mesh Failover Gateway (3 VPS Nodes)",
        period: "Dedicated routing",
        amountEur: 25.0,
      },
    ],
    vatRatePercent: 20,
  },
  "system-alert": {
    email: "contact@aphrody.com",
    clusterEvent: "Node Failover Convergence Resolved",
    nodeName: "prod",
    meshIp: "10.200.77.5",
    status: "RESOLVED",
    metrics: {
      latencyMs: 14,
      rqliteRaftOk: true,
      activeFallbacks: ["bunos", "vps"],
    },
    details:
      "All edge workers successfully failed over across WireGuard mesh without packet loss. Raft consensus quorum synchronized across all 3 nodes.",
  },
  "password-reset": {
    email: "contact@aphrody.com",
    resetUrl:
      "https://aphrody.app/auth/reset-password?token=reset_2026_afe88912cd34",
    expiresInMinutes: 30,
    ipAddress: "51.77.147.152",
  },
  noreply: {
    email: "contact@aphrody.com",
    senderDomain: "aphrody.app",
    category: "SYSTEM_SYNC",
    title: "WireGuard Mesh Tunnel Synchronized",
    summary: "Consensus state across edge nodes verified successfully.",
    details: [
      { label: "Mesh IP", value: "10.200.77.5" },
      { label: "Quorum", value: "3/3 Nodes Active" },
    ],
  },
};

export function startMailStudioServer(port = 8799) {
  const server = Bun.serve({
    port,
    async fetch(req) {
      const url = new URL(req.url);

      // CORS
      if (req.method === "OPTIONS") {
        return new Response(null, {
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
          },
        });
      }

      // Root GUI
      if (url.pathname === "/" || url.pathname === "/index.html") {
        return new Response(htmlIndex, {
          headers: { "Content-Type": "text/html; charset=utf-8" },
        });
      }

      // Health
      if (url.pathname === "/health") {
        return Response.json({
          status: "ok",
          studio: "aphrody-mail-studio",
          port,
        });
      }

      // API: Preview
      if (url.pathname === "/api/preview" && req.method === "POST") {
        const body = (await req.json()) as {
          template: EmailTemplateName;
          theme?: "light" | "dark";
          recipient?: string;
        };
        const data = {
          ...sampleData[body.template],
          email: body.recipient || "contact@aphrody.com",
        };
        const rendered = renderTemplate({
          template: body.template,
          data,
        });

        let html = rendered.html;
        // If dark theme preview requested in iframe
        if (body.theme === "dark") {
          html = html.replace(
            "<head>",
            `<head><style>:root { color-scheme: dark !important; } body, .wrapper { background-color: #090D16 !important; color: #F1F5F9 !important; } .main-card { background-color: #0F172A !important; border-color: #1E293B !important; } .email-header { border-bottom-color: #1E293B !important; } .email-body { color: #CBD5E1 !important; } .email-footer { background-color: #0A0F1D !important; border-top-color: #1E293B !important; color: #94A3B8 !important; }</style>`,
          );
        }

        return Response.json({
          subject: rendered.subject,
          text: rendered.text,
          html,
        });
      }

      // API: Send Test Email
      if (url.pathname === "/api/send" && req.method === "POST") {
        try {
          const body = (await req.json()) as {
            template: EmailTemplateName;
            provider?: MailProvider;
            to: string;
            subject?: string;
          };

          const data = {
            ...sampleData[body.template],
            email: body.to,
          };

          const receipt = await dispatcher.send({
            to: body.to,
            template: body.template,
            templateData: data,
            provider: body.provider || "auto",
            subject: body.subject,
          });

          return Response.json(receipt);
        } catch (err: any) {
          return Response.json(
            {
              success: false,
              error: err.message,
            },
            { status: 500 },
          );
        }
      }

      return new Response("Not Found", { status: 404 });
    },
  });

  console.log(
    `Aphrody Mail Studio GUI listening on http://localhost:${server.port}`,
  );
  return server;
}

if (import.meta.main) {
  startMailStudioServer();
}
