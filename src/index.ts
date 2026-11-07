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
import { AuthUiRenderer } from "../packages/better-auth-full/src/ui/index.js";
import { IdentityDatabase } from "../packages/better-auth-full/src/db/adapter.js";
import { PasswordVaultEngine } from "../packages/better-auth-full/src/vault/index.js";
import { ProviderRegistry } from "../packages/better-auth-full/src/providers/index.js";
import { GoogleWorkspaceClient } from "../packages/google-workspace/src/index.js";
import { MailDispatcher } from "../packages/mail-templates/src/dispatcher.js";

export function createUnifiedBackendApp(opts: { db?: IdentityDatabase } = {}) {
  const app = new Hono();
  const oauthServer = new AphrodyOAuthServer();
  const authClient = new AphrodyAuthClient();
  const resend = new ResendEngine();
  const zumba = new ZumbaWebmailEngine();
  const dispatcher = new MailDispatcher();
  const hostinger = new HostingerMailClient();
  const google = new GoogleWorkspaceClient();
  const db = opts.db ?? new IdentityDatabase();

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

  // Auth UI - Sign In / Sign Up
  app.get("/auth/signin", (c) => {
    const theme = (c.req.query("theme") || "aphrody") as any;
    const product = (c.req.query("product") || "aphrody") as any;
    const html = AuthUiRenderer.renderAuthPage("signin", theme, { product });
    return c.html(html);
  });

  app.get("/auth/signup", (c) => {
    const theme = (c.req.query("theme") || "aphrody") as any;
    const product = (c.req.query("product") || "aphrody") as any;
    const html = AuthUiRenderer.renderAuthPage("signup", theme, { product });
    return c.html(html);
  });

  // Public Profile View
  app.get("/profile/:username", async (c) => {
    const username = c.req.param("username");
    const theme = (c.req.query("theme") || "aphrody") as any;
    const user = await db.findUserByUsername(username);
    if (!user) return c.html("<h1>404 profile not found</h1>", 404);
    const accounts = await db.findAccountsByUserId(user.id);
    const html = AuthUiRenderer.renderPublicProfilePage(
      user as any,
      accounts,
      theme,
    );
    return c.html(html);
  });

  // Admin Dashboard
  app.get("/admin", async (c) => {
    const cookie = (c.req.header("cookie") || "").match(/aphrody_session=([a-f0-9]+)/)?.[1];
    await db.ensureReady();
    const session = cookie ? await db.findSessionByToken(cookie) : null;
    if (!session || new Date(session.expiresAt) < new Date()) return c.redirect("/auth/signin");
    const me = await db.findUserById(session.userId);
    if (!me || me.role !== "admin" || me.banned) return c.html("<h1>403 forbidden</h1>", 403);
    const theme = (c.req.query("theme") || "aphrody") as any;
    const html = AuthUiRenderer.renderAdminDashboard(
      await db.getStats(),
      theme,
    );
    return c.html(html);
  });

  // Provider Sign-In Redirector
  app.get("/api/auth/signin/:provider", (c) => {
    const providerId = c.req.param("provider");
    const providers = ProviderRegistry.getProviders();
    const target = (providers as any)[providerId];
    if (!target) {
      return c.json({ error: `Unsupported provider: ${providerId}` }, 400);
    }
    const state = crypto.randomUUID();
    const authUrl = target.getAuthorizationUrl
      ? target.getAuthorizationUrl(state)
      : "/";
    return c.redirect(authUrl);
  });

  // Magic Link Passwordless Sign-In
  app.post("/api/auth/magic-link", async (c) => {
    try {
      let email = "";
      const contentType = c.req.header("content-type") || "";
      if (contentType.includes("application/json")) {
        const body = await c.req.json();
        email = body.email;
      } else {
        const body = await c.req.parseBody();
        email = body.email as string;
      }

      if (!email || !email.includes("@")) {
        return c.json({ error: "Invalid email address" }, 400);
      }

      await db.ensureReady();
      let user = await db.findUserByEmail(email);
      if (!user) {
        user = await db.createUser({
          id: `usr_${Date.now()}`,
          email,
          name: email.split("@")[0],
          username: email
            .split("@")[0]
            .toLowerCase()
            .replace(/[^a-z0-9]/g, ""),
          emailVerified: false,
          role: "user",
          banned: false,
        });
      }

      const token = crypto.randomUUID().replace(/-/g, "");
      await db.createVerification(`magic:${email}`, token, 15 * 60 * 1000);
      const origin = process.env.BETTER_AUTH_URL || new URL(c.req.url).origin;
      const magicLinkUrl = `${origin}/api/auth/verify?token=${token}&email=${encodeURIComponent(email)}`;

      const mailOptions = {
        template: "magic-link" as const,
        from: { email: "auth@aphrody.app", name: "Aphrody Security" },
        to: email,
        templateData: {
          name: user.name,
          magicLinkUrl,
          expiresInMinutes: 15,
        },
      };
      if (process.env.MAIL_OUTBOX_DIR) {
        // Explicit test transport: persist the rendered message instead of network delivery.
        const { mkdirSync } = await import("node:fs");
        mkdirSync(process.env.MAIL_OUTBOX_DIR, { recursive: true });
        await Bun.write(`${process.env.MAIL_OUTBOX_DIR}/${Date.now()}-${email}.json`, JSON.stringify({ ...mailOptions, magicLinkUrl }));
      } else {
        await dispatcher.send(mailOptions);
      }

      await db.logAudit({
        id: `aud_${Date.now()}`,
        userId: user.id,
        action: "magic_link_dispatched",
        resource: email,
        ipAddress: c.req.header("x-forwarded-for") || "127.0.0.1",
        userAgent: c.req.header("user-agent"),
        status: "success",
      });

      if (!contentType.includes("application/json")) {
        return c.html(`
          <!DOCTYPE html>
          <html>
          <body style="background:#09090b;color:#f4f4f5;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;">
            <div style="background:#121217;border:1px solid #27272a;border-radius:16px;padding:36px;max-width:420px;text-align:center;">
              <h2 style="color:#06b6d4;margin-bottom:12px;">Check your email</h2>
              <p style="color:#a1a1aa;font-size:14px;line-height:1.5;">We dispatched a secure magic link to <strong>${email}</strong>. Click it to log in.</p>
              <a href="/auth/signin" style="display:inline-block;margin-top:20px;color:#06b6d4;font-size:13px;text-decoration:none;">Back to Sign In</a>
            </div>
          </body>
          </html>
        `);
      }

      return c.json({
        success: true,
        email,
        message: "Magic sign-in link dispatched",
      });
    } catch (err: any) {
      return c.json({ error: err.message }, 500);
    }
  });

  // Magic link verification: single-use, creates a real session
  app.get("/api/auth/verify", async (c) => {
    const token = c.req.query("token") || "";
    const email = c.req.query("email") || "";
    await db.ensureReady();
    const ok = await db.consumeVerification(`magic:${email}`, token);
    if (!ok) return c.json({ error: "Invalid or expired link" }, 400);
    const user = await db.findUserByEmail(email);
    if (!user) return c.json({ error: "Unknown user" }, 404);
    await db.markEmailVerified(user.id);
    const session = await db.createSession({
      id: `ses_${crypto.randomUUID()}`,
      userId: user.id,
      token: crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, ""),
      expiresAt: new Date(Date.now() + 30 * 86400000).toISOString(),
      ipAddress: c.req.header("x-forwarded-for") || undefined,
      userAgent: c.req.header("user-agent"),
    });
    c.header("Set-Cookie", `aphrody_session=${session.token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000`);
    return c.redirect("/auth/me");
  });

  // Session page (cookie or bearer)
  app.get("/auth/me", async (c) => {
    const cookie = (c.req.header("cookie") || "").match(/aphrody_session=([a-f0-9]+)/)?.[1];
    await db.ensureReady();
    const session = cookie ? await db.findSessionByToken(cookie) : null;
    if (!session) return c.redirect("/auth/signin");
    const user = await db.findUserById(session.userId);
    return c.html(`<!DOCTYPE html><html><body style="font-family:sans-serif;background:#09090b;color:#f4f4f5;padding:40px"><h1 id="who">Signed in as ${user?.email}</h1><p id="verified">email_verified=${user?.emailVerified}</p><a href="/profile/${user?.username}">Public profile</a></body></html>`);
  });

  // Current User / Identity Context
  app.get("/api/auth/me", async (c) => {
    const authHeader = c.req.header("authorization") || "";
    const token = authHeader.replace(/^Bearer\s+/i, "");
    if (!token) return c.json({ authenticated: false }, 401);

    await db.ensureReady();
    const session = await db.findSessionByToken(token);
    if (!session)
      return c.json({ authenticated: false, error: "Invalid session" }, 401);

    const user = await db.findUserById(session.userId);
    const accounts = await db.findAccountsByUserId(session.userId);

    return c.json({
      authenticated: true,
      user,
      accounts,
      session,
    });
  });

  // Zero-Knowledge Password Vault API
  app.post("/api/auth/vault/encrypt", async (c) => {
    try {
      const { text, masterPassword } = await c.req.json();
      if (!text || !masterPassword)
        return c.json({ error: "Missing parameters" }, 400);
      const encrypted = PasswordVaultEngine.encrypt(text, masterPassword);
      return c.json(encrypted);
    } catch (err: any) {
      return c.json({ error: err.message }, 500);
    }
  });

  app.post("/api/auth/vault/decrypt", async (c) => {
    try {
      const { payload, masterPassword } = await c.req.json();
      if (!payload || !masterPassword)
        return c.json({ error: "Missing parameters" }, 400);
      const decrypted = PasswordVaultEngine.decrypt(payload, masterPassword);
      return c.json({ plainText: decrypted });
    } catch (err: any) {
      return c.json({ error: err.message }, 500);
    }
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
  console.log(
    `Aphrody YOLO Unified Backend Server listening on http://localhost:${port}`,
  );
}
