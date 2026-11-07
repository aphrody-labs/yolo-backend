/**
 * Aphrody YOLO Backend Universal Monorepo Entrypoint (2026 Edition)
 * Pure Bun v1.4.4+ / Full TypeScript 7 & Google OSS Style Guide.
 * Consolidates Resend, Cloudflare Mail, OVH Webmail (Zumba), Hostinger Mail, and Better-Auth.
 */

export * from "../packages/resend-engine/src/index.js";
export * from "../packages/cloudflare-mail/src/index.js";
export * from "../packages/hostinger-mail/src/index.js";
export * from "../packages/webmail-zumba/src/index.js";
export * from "../packages/better-auth-full/src/index.js";
export * from "../packages/google-workspace/src/index.js";
export * from "../packages/mail-templates/src/index.js";

import { Hono } from "hono";
import { ResendEngine } from "../packages/resend-engine/src/index.js";
import { CloudflareMailClient } from "../packages/cloudflare-mail/src/index.js";
import { HostingerMailClient } from "../packages/hostinger-mail/src/index.js";
import { ZumbaWebmailEngine } from "../packages/webmail-zumba/src/index.js";
import { AphrodyOAuthServer } from "../packages/better-auth-full/src/oauth-server.js";
import { AphrodyAuthClient } from "../packages/better-auth-full/src/client-sdk.js";
import { GoogleWorkspaceClient } from "../packages/google-workspace/src/index.js";
import { MailDispatcher } from "../packages/mail-templates/src/dispatcher.js";

export function createUnifiedBackendApp() {
  const app = new Hono();
  const oauthServer = new AphrodyOAuthServer();
  const authClient = new AphrodyAuthClient();
  const resend = new ResendEngine();
  const zumba = new ZumbaWebmailEngine();
  const dispatcher = new MailDispatcher();
  const hostinger = new HostingerMailClient();
  const google = new GoogleWorkspaceClient();

  // Root Status & Capability Discovery
  app.get("/", (c) => {
    return c.json({
      service: "@yolo-rs/yolo-backend",
      version: "1.0.0-canary.20261107",
      runtime: "bun-1.4.4-canary",
      status: "operational",
      architecture: "Bun AoT + Rust LTO",
      subsystems: {
        resend_engine: "ready",
        cloudflare_mail: "ready",
        ovh_webmail_zumba: "ready",
        hostinger_mail_kvm8: "ready",
        better_auth_suite: "ready",
        google_workspace: "ready",
        mail_templates: "ready",
      },
      time: new Date().toISOString(),
    });
  });

  // Health Probe
  app.get("/health", (c) => {
    return c.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
    });
  });

  // OIDC Discovery
  app.get("/.well-known/openid-configuration", (c) => {
    return c.json(oauthServer.getOpenIdConfiguration());
  });

  // JWKS
  app.get("/.well-known/jwks.json", (c) => {
    return c.json(oauthServer.getJwks());
  });

  // Mail Dispatcher API
  app.post("/api/mail/send", async (c) => {
    try {
      const body = await c.req.json();
      const receipt = await dispatcher.send(body);
      return c.json(receipt);
    } catch (err: any) {
      return c.json({ error: err.message }, 500);
    }
  });

  // Hostinger KVM 8 Node Details
  app.get("/api/vps/hostinger", async (c) => {
    const details = await hostinger.getKvmVpsDetails();
    return c.json(details);
  });

  // Zumba Webmail API
  app.get("/api/webmail/messages", (c) => {
    const folder = c.req.query("folder") || "inbox";
    return c.json({
      folder,
      messages: zumba.getFolderMessages(folder as any),
    });
  });

  return app;
}

if (import.meta.main) {
  const app = createUnifiedBackendApp();
  const port = parseInt(process.env.PORT || "8795", 10);
  Bun.serve({
    port,
    fetch: app.fetch,
  });
  console.log(`Aphrody YOLO Unified Backend Server listening on http://localhost:${port}`);
}
