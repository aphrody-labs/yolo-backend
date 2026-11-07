/**
 * Aphrody Auth & Mail D1 / SQLite / rqlite Schema Definitions (2026 Edition)
 */

export const AUTH_AND_MAIL_SCHEMA_SQL = `
-- 1. Users Table
CREATE TABLE IF NOT EXISTS user (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  emailVerified INTEGER NOT NULL DEFAULT 0,
  image TEXT,
  role TEXT NOT NULL DEFAULT 'user',
  plan TEXT NOT NULL DEFAULT 'starter',
  createdAt INTEGER NOT NULL,
  updatedAt INTEGER NOT NULL
);

-- 2. Sessions Table
CREATE TABLE IF NOT EXISTS session (
  id TEXT PRIMARY KEY,
  expiresAt INTEGER NOT NULL,
  token TEXT NOT NULL UNIQUE,
  createdAt INTEGER NOT NULL,
  updatedAt INTEGER NOT NULL,
  ipAddress TEXT,
  userAgent TEXT,
  userId TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  activeOrganizationId TEXT
);

-- 3. Accounts Table (OAuth & Passwords)
CREATE TABLE IF NOT EXISTS account (
  id TEXT PRIMARY KEY,
  accountId TEXT NOT NULL,
  providerId TEXT NOT NULL,
  userId TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  accessToken TEXT,
  refreshToken TEXT,
  idToken TEXT,
  accessTokenExpiresAt INTEGER,
  refreshTokenExpiresAt INTEGER,
  scope TEXT,
  password TEXT,
  createdAt INTEGER NOT NULL,
  updatedAt INTEGER NOT NULL
);

-- 4. Verifications Table (Magic Links, Email OTPs)
CREATE TABLE IF NOT EXISTS verification (
  id TEXT PRIMARY KEY,
  identifier TEXT NOT NULL,
  value TEXT NOT NULL,
  expiresAt INTEGER NOT NULL,
  createdAt INTEGER NOT NULL,
  updatedAt INTEGER NOT NULL
);

-- 5. Two-Factor Authentication Table
CREATE TABLE IF NOT EXISTS twoFactor (
  id TEXT PRIMARY KEY,
  secret TEXT NOT NULL,
  backupCodes TEXT NOT NULL,
  userId TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE
);

-- 6. Organizations & Multi-Tenancy
CREATE TABLE IF NOT EXISTS organization (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  logo TEXT,
  createdAt INTEGER NOT NULL,
  metadata TEXT
);

CREATE TABLE IF NOT EXISTS member (
  id TEXT PRIMARY KEY,
  organizationId TEXT NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  userId TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member',
  createdAt INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS invitation (
  id TEXT PRIMARY KEY,
  organizationId TEXT NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT,
  status TEXT NOT NULL,
  expiresAt INTEGER NOT NULL,
  inviterId TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE
);

-- 7. JWKS Keys Table
CREATE TABLE IF NOT EXISTS jwks (
  id TEXT PRIMARY KEY,
  publicKey TEXT NOT NULL,
  privateKey TEXT NOT NULL,
  createdAt INTEGER NOT NULL
);

-- 8. Inbound Emails Table (Cloudflare Email Worker & Webhooks)
CREATE TABLE IF NOT EXISTS inbound_emails (
  id TEXT PRIMARY KEY,
  messageId TEXT,
  fromAddress TEXT NOT NULL,
  toAddress TEXT NOT NULL,
  subject TEXT,
  spfStatus TEXT,
  dkimStatus TEXT,
  rawHeaders TEXT,
  bodySnippet TEXT,
  receivedAt INTEGER NOT NULL
);

-- 9. Outbound Emails Table (Delivery Receipts & Audits)
CREATE TABLE IF NOT EXISTS outbound_emails (
  id TEXT PRIMARY KEY,
  messageId TEXT NOT NULL,
  provider TEXT NOT NULL,
  recipient TEXT NOT NULL,
  subject TEXT NOT NULL,
  status TEXT NOT NULL,
  latencyMs INTEGER NOT NULL,
  attemptsJson TEXT,
  sentAt INTEGER NOT NULL
);
`;

export async function applySchema(db: any): Promise<void> {
  // If Cloudflare D1
  if (typeof db.batch === "function") {
    const statements = AUTH_AND_MAIL_SCHEMA_SQL.split(";")
      .map((s) => s.trim())
      .filter((s) => s.length > 0)
      .map((s) => db.prepare(s));
    await db.batch(statements);
    return;
  }

  // If bun:sqlite Database
  if (typeof db.run === "function") {
    db.run(AUTH_AND_MAIL_SCHEMA_SQL);
    return;
  }

  throw new Error("Unsupported database instance passed to applySchema");
}
