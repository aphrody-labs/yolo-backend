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
      ["sign"]
    );
    const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(toSign));
    const validSignature = Buffer.from(sig).toString("base64");

    const valid = await resend.verifyWebhookSignature(
      payload,
      { "svix-signature": validSignature, "svix-timestamp": timestamp },
      secret
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

    const worker = CloudflareMailClient.createWorkerHandler("contact@aphrody.com");
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
  test("Loads default folders and generates responsive UI", () => {
    const zumba = new ZumbaWebmailEngine();
    const inbox = zumba.getFolderMessages("inbox");
    expect(inbox.length).toBeGreaterThan(0);
    expect(inbox[0].from).toContain("notifications@aphrody.app");

    const htmlUi = zumba.getHtmlUi();
    expect(htmlUi).toContain("Zumba Webmail");
    expect(htmlUi).toContain("Hostinger + OVH Synced");
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
    const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
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
    const jwt = await google.generateServiceAccountJwt(["https://www.googleapis.com/auth/gmail.send"]);
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
});
