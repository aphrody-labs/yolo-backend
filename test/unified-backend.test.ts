import { describe, expect, test } from "bun:test";
import {
  ResendEngine,
  CloudflareMailClient,
  HostingerMailClient,
  ZumbaWebmailEngine,
  AphrodyOAuthServer,
  AphrodyAuthClient,
  GoogleWorkspaceClient,
  renderTemplate,
  createUnifiedBackendApp,
} from "../src/index.js";

describe("Resend-Compatible Engine", () => {
  test("emails.send and batch.send return valid IDs", async () => {
    const resend = new ResendEngine();
    const single = await resend.emails.send({
      from: "notifications@aphrody.app",
      to: "contact@aphrody.com",
      subject: "Test Resend Dispatch",
      html: "<p>Hello</p>",
    });
    expect(single.id).toBeDefined();
    expect(single.from).toBe("notifications@aphrody.app");

    const batch = await resend.emails.batch.send([
      { from: "a@aphrody.app", to: "b@aphrody.com", subject: "S1" },
      { from: "a@aphrody.app", to: "c@aphrody.com", subject: "S2" },
    ]);
    expect(batch.data.length).toBe(2);
  });

  test("verifyWebhookSignature validates svix payload signatures", async () => {
    const resend = new ResendEngine();
    const payload = JSON.stringify({ type: "email.delivered", id: "re_123" });
    const secret = "whsec_test_secret_key_123";
    const timestamp = Math.floor(Date.now() / 1000).toString();

    const toSign = `${timestamp}.${payload}`;
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );
    const sig = await crypto.subtle.sign(
      "HMAC",
      key,
      new TextEncoder().encode(toSign),
    );
    const validSignature = Buffer.from(sig).toString("base64");

    const valid = await resend.verifyWebhookSignature(
      payload,
      { "svix-signature": validSignature, "svix-timestamp": timestamp },
      secret,
    );
    expect(valid).toBe(true);
  });
});

describe("Cloudflare Mail Client", () => {
  test("Initializes with credentials and exposes worker factory", () => {
    const cf = new CloudflareMailClient({
      accountId: "ca22c1a51a145f919b54afa18d936516",
      apiToken: "mock_token",
      zoneId: "f4dab237b9811435da6fee0b5b3438d4",
    });
    expect(cf).toBeDefined();

    const worker = CloudflareMailClient.createWorkerHandler(
      "contact@aphrody.com",
    );
    expect(typeof worker.email).toBe("function");
    expect(typeof worker.fetch).toBe("function");
  });
});

describe("Hostinger Mail & VPS Integration", () => {
  test("Retrieves KVM 8 instance details for prod node 2116886", async () => {
    const hostinger = new HostingerMailClient();
    const vps = await hostinger.getKvmVpsDetails(2116886);
    expect(vps.id).toBe(2116886);
    expect(vps.plan).toBe("KVM 8");
    expect(vps.ip).toBe("72.60.186.43");
    expect(vps.os).toBe("Arch Linux Rolling");
  });
});

describe("Zumba Webmail Engine", () => {
  test("Loads default folders, sends messages, and generates responsive UI", () => {
    const zumba = new ZumbaWebmailEngine();
    const inbox = zumba.getFolderMessages("inbox");
    expect(inbox.length).toBeGreaterThan(0);
    expect(inbox[0].from).toContain("notifications@aphrody.app");

    const sentMsg = zumba.sendMessage({
      to: "ops@aphrody.com",
      subject: "Zumba Compose Test",
      text: "Dispatched from compose dialog",
    });
    expect(sentMsg.folder).toBe("sent");
    expect(
      zumba.getFolderMessages("sent").some((m) => m.id === sentMsg.id),
    ).toBe(true);

    const htmlUi = zumba.getHtmlUi();
    expect(htmlUi).toContain("Zumba Webmail");
    expect(htmlUi).toContain("Hostinger + OVH Synced");
    expect(htmlUi).toContain("compose-modal");
    expect(htmlUi).toContain("skip-link");
  });
});

describe("Universal OAuth2 / OIDC Server & Client SDK", () => {
  test("Executes full PKCE authorization code grant and validates via Client SDK", async () => {
    const server = new AphrodyOAuthServer({
      issuer: "https://auth.aphrody.app",
      jwtSecret: "monorepo-secret-32-chars-long-2026!!",
    });
    const client = new AphrodyAuthClient({
      issuerUrl: "https://auth.aphrody.app",
      jwtSecret: "monorepo-secret-32-chars-long-2026!!",
    });

    const verifier = "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk";
    const hash = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(verifier),
    );
    const challenge = Buffer.from(hash).toString("base64url");

    const authRes = await server.handleAuthorize({
      clientId: "aphrody-client",
      redirectUri: "https://aphrody.app/callback",
      responseType: "code",
      codeChallenge: challenge,
      codeChallengeMethod: "S256",
      userId: "usr_alex_2026",
    });

    const tokenRes = await server.handleToken({
      grantType: "authorization_code",
      code: authRes.code,
      redirectUri: "https://aphrody.app/callback",
      codeVerifier: verifier,
    });

    const user = await client.authenticate(`Bearer ${tokenRes.access_token}`);
    expect(user).not.toBeNull();
    expect(user?.id).toBe("usr_alex_2026");
  });
});

describe("Google Workspace Client", () => {
  test("Generates service account JWT and formats multipart MIME message", async () => {
    const google = new GoogleWorkspaceClient();
    const jwt = await google.generateServiceAccountJwt([
      "https://www.googleapis.com/auth/gmail.send",
    ]);
    expect(jwt.split(".").length).toBe(3);

    const mime = GoogleWorkspaceClient.buildMimeMessage({
      from: "noreply@aphrody.app",
      to: "contact@aphrody.com",
      subject: "Google Workspace Test",
      html: "<p>Google Test Body</p>",
    });
    expect(mime).toContain("Subject: Google Workspace Test");
    expect(mime).toContain("multipart/alternative");
    expect(mime).toContain("<p>Google Test Body</p>");
  });
});

describe("Unified Monorepo App HTTP Endpoints", () => {
  test("Answers root discovery, health probe, and OIDC configuration", async () => {
    const app = createUnifiedBackendApp();

    const rootRes = await app.request("/");
    expect(rootRes.status).toBe(200);
    const rootData = (await rootRes.json()) as any;
    expect(rootData.service).toBe("@yolo-rs/yolo-backend");
    expect(rootData.subsystems.resend_engine).toBe("ready");

    const healthRes = await app.request("/health");
    expect(healthRes.status).toBe(200);

    const oidcRes = await app.request("/.well-known/openid-configuration");
    expect(oidcRes.status).toBe(200);
    const oidc = (await oidcRes.json()) as any;
    expect(oidc.authorization_endpoint).toContain("/oauth/authorize");

    const jwksRes = await app.request("/.well-known/jwks.json");
    expect(jwksRes.status).toBe(200);
  });

  test("Auth UI, DB-backed profile, and admin RBAC", async () => {
    const { IdentityDatabase } =
      await import("../packages/better-auth-full/src/db/adapter.js");
    const db = new IdentityDatabase({
      engine: "sqlite",
      sqlitePath: ":memory:",
    });
    await db.migrate();
    const app = createUnifiedBackendApp({ db });

    const signin = await app.request(
      "/auth/signin?theme=aphrody&product=aphrody",
    );
    expect(signin.status).toBe(200);
    const html = await signin.text();
    expect(html).toContain("Continue with Google");
    expect(html).not.toContain("startPasskeyAuth");

    expect((await app.request("/profile/nobody")).status).toBe(404);
    expect((await app.request("/admin", { redirect: "manual" })).status).toBe(
      302,
    );

    const mk = async (id: string, role: "user" | "admin") => {
      const u = await db.createUser({
        id,
        email: id + "@aphrody.com",
        name: id,
        username: id,
        emailVerified: true,
        role,
        banned: false,
      });
      const token = "a".repeat(32) + id.length.toString(16).padStart(2, "0");
      await db.createSession({
        id: "s_" + id,
        userId: u.id,
        token,
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
      });
      return token;
    };
    const userTok = await mk("plain", "user");
    const adminTok = await mk("boss", "admin");

    expect((await app.request("/profile/plain")).status).toBe(200);
    expect(
      (
        await app.request("/admin", {
          headers: { cookie: "aphrody_session=" + userTok },
        })
      ).status,
    ).toBe(403);
    const ok = await app.request("/admin", {
      headers: { cookie: "aphrody_session=" + adminTok },
    });
    expect(ok.status).toBe(200);
    expect(await ok.text()).toContain('kpi-value">2<');
  });

  test("Password Vault encrypts and decrypts via HTTP API", async () => {
    const app = createUnifiedBackendApp();
    const masterPassword = "super_secure_master_password_2026";
    const text = "aphrody_secret_database_api_key_xyz";

    const encRes = await app.request("/api/auth/vault/encrypt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, masterPassword }),
    });
    expect(encRes.status).toBe(200);
    const payload = (await encRes.json()) as any;
    expect(payload.cipherText).toBeDefined();
    expect(payload.nonce).toBeDefined();
    expect(payload.tag).toBeDefined();

    const decRes = await app.request("/api/auth/vault/decrypt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ payload, masterPassword }),
    });
    expect(decRes.status).toBe(200);
    const decData = (await decRes.json()) as any;
    expect(decData.plainText).toBe(text);
  });
});

describe("Universal Identity Database & Multi-Provider Architecture", () => {
  test("IdentityDatabase runs migrations, creates user and multi-provider accounts", async () => {
    const { IdentityDatabase } =
      await import("../packages/better-auth-full/src/db/adapter.js");
    const db = new IdentityDatabase({
      engine: "sqlite",
      sqlitePath: ":memory:",
    });
    await db.migrate();

    const user = await db.createUser({
      id: "usr_full_test_01",
      email: "test.dev@aphrody.com",
      name: "Test Developer",
      username: "testdev",
      emailVerified: true,
      role: "admin",
      banned: false,
    });
    expect(user.id).toBe("usr_full_test_01");

    const account = await db.createAccount({
      id: "acc_google_01",
      userId: user.id,
      accountId: "goog_987654321",
      providerId: "google",
      scope: "openid email profile",
    });
    expect(account.providerId).toBe("google");

    const foundAcc = await db.findAccountByProvider("google", "goog_987654321");
    expect(foundAcc?.userId).toBe(user.id);

    const userAccounts = await db.findAccountsByUserId(user.id);
    expect(userAccounts.length).toBe(1);
  });

  test("ProviderRegistry builds valid URLs for Google, Steam, Discord, and Epic Games", async () => {
    const { ProviderRegistry } =
      await import("../packages/better-auth-full/src/providers/index.js");
    const providers = ProviderRegistry.getProviders();

    const googleUrl = providers.google.getAuthorizationUrl("state-1");
    expect(googleUrl).toContain("accounts.google.com");
    expect(googleUrl).toContain("openid+email+profile");

    const steamUrl = providers.steam.getAuthorizationUrl();
    expect(steamUrl).toContain("steamcommunity.com/openid/login");

    const discordUrl = providers.discord.getAuthorizationUrl("state-2");
    expect(discordUrl).toContain("discord.com/api/oauth2/authorize");

    const epicUrl = providers.epic.getAuthorizationUrl("state-3");
    expect(epicUrl).toContain("epicgames.com/id/authorize");
  });

  test("PasswordVaultEngine generates high-entropy passwords and exports to CSV", async () => {
    const { PasswordVaultEngine } =
      await import("../packages/better-auth-full/src/vault/index.js");
    const pwd = PasswordVaultEngine.generateStrongPassword(32);
    expect(pwd.length).toBe(32);

    const csv = PasswordVaultEngine.exportToCsv([
      { id: "1", title: "GitHub", username: "aphrody", password: pwd },
    ]);
    expect(csv).toContain("GitHub");
    expect(csv).toContain("aphrody");
  });
});
