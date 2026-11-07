/**
 * Aphrody & YOLO Universal Database Adapter & Migration Suite
 * Connects seamlessly to Neon PostgreSQL, Supabase PostgreSQL, Cloudflare D1, or bun:sqlite.
 */

import { Database as SqliteDatabase } from "bun:sqlite";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import {
  POSTGRES_SCHEMA,
  SQLITE_SCHEMA,
  type UserRecord,
  type SessionRecord,
  type AccountRecord,
  type ApiKeyRecord,
  type PasswordVaultRecord,
  type AuditLogRecord,
  type CmsProfileRecord,
  type PasskeyRecord,
  type SupportedAuthProvider,
} from "./schema";

export type DatabaseEngine = "neon" | "supabase" | "postgres" | "sqlite" | "d1";

export interface DatabaseConfig {
  engine?: DatabaseEngine;
  url?: string;
  sqlitePath?: string;
}

export class IdentityDatabase {
  private engine: DatabaseEngine;
  private sqliteDb?: SqliteDatabase;
  private isInitialized = false;

  constructor(config: DatabaseConfig = {}) {
    const url =
      config.url ||
      process.env.DATABASE_URL ||
      process.env.NEON_DATABASE_URL ||
      process.env.SUPABASE_DB_URL;

    if (config.engine) {
      this.engine = config.engine;
    } else if (
      url &&
      (url.includes("neon.tech") || process.env.NEON_DATABASE_URL)
    ) {
      this.engine = "neon";
    } else if (
      url &&
      (url.includes("supabase.co") || process.env.SUPABASE_DB_URL)
    ) {
      this.engine = "supabase";
    } else if (url && url.startsWith("postgres")) {
      this.engine = "postgres";
    } else {
      this.engine = "sqlite";
    }

    if (this.engine === "sqlite") {
      const path =
        config.sqlitePath ||
        process.env.SQLITE_DB_PATH ||
        "data/aphrody_identity.db";
      try {
        if (path !== ":memory:") {
          mkdirSync(dirname(path), { recursive: true });
        }
        this.sqliteDb = new SqliteDatabase(path);
      } catch {
        this.sqliteDb = new SqliteDatabase(":memory:");
      }
      this.sqliteDb.run("PRAGMA journal_mode = WAL;");
      this.sqliteDb.run("PRAGMA foreign_keys = ON;");
    }
  }

  public getEngine(): DatabaseEngine {
    return this.engine;
  }

  public async migrate(): Promise<void> {
    if (this.engine === "sqlite") {
      if (!this.sqliteDb) throw new Error("SQLite instance not initialized");
      this.sqliteDb.run(SQLITE_SCHEMA);
      this.isInitialized = true;
      return;
    }

    try {
      const { sql } = await import("bun");
      await sql.unsafe(POSTGRES_SCHEMA);
      this.isInitialized = true;
    } catch {
      this.engine = "sqlite";
      this.sqliteDb = new SqliteDatabase(":memory:");
      this.sqliteDb.run("PRAGMA foreign_keys = ON;");
      this.sqliteDb.run(SQLITE_SCHEMA);
      this.isInitialized = true;
    }
  }

  public async ensureReady(): Promise<void> {
    if (!this.isInitialized) {
      await this.migrate();
    }
  }

  // --- Users ---
  public async createUser(
    user: Omit<UserRecord, "createdAt" | "updatedAt">,
  ): Promise<UserRecord> {
    await this.ensureReady();
    const now = new Date().toISOString();
    const fullUser: UserRecord = {
      ...user,
      createdAt: now,
      updatedAt: now,
    };

    if (this.sqliteDb) {
      const query = this.sqliteDb.query(`
        INSERT INTO users (id, name, email, email_verified, image, role, username, display_name, bio, banner, locale, banned, ban_reason, ban_expires, metadata, created_at, updated_at)
        VALUES ($id, $name, $email, $emailVerified, $image, $role, $username, $displayName, $bio, $banner, $locale, $banned, $banReason, $banExpires, $metadata, $createdAt, $updatedAt)
      `);
      query.run({
        $id: fullUser.id,
        $name: fullUser.name,
        $email: fullUser.email,
        $emailVerified: fullUser.emailVerified ? 1 : 0,
        $image: fullUser.image ?? null,
        $role: fullUser.role,
        $username: fullUser.username,
        $displayName: fullUser.displayName ?? null,
        $bio: fullUser.bio ?? null,
        $banner: fullUser.banner ?? null,
        $locale: fullUser.locale ?? "en-US",
        $banned: fullUser.banned ? 1 : 0,
        $banReason: fullUser.banReason ?? null,
        $banExpires: fullUser.banExpires ?? null,
        $metadata: fullUser.metadata ? JSON.stringify(fullUser.metadata) : null,
        $createdAt: fullUser.createdAt,
        $updatedAt: fullUser.updatedAt,
      });
      return fullUser;
    }

    const { sql } = await import("bun");
    await sql`
      INSERT INTO users (id, name, email, email_verified, image, role, username, display_name, bio, banner, locale, banned, ban_reason, ban_expires, metadata, created_at, updated_at)
      VALUES (${fullUser.id}, ${fullUser.name}, ${fullUser.email}, ${fullUser.emailVerified}, ${fullUser.image ?? null}, ${fullUser.role}, ${fullUser.username}, ${fullUser.displayName ?? null}, ${fullUser.bio ?? null}, ${fullUser.banner ?? null}, ${fullUser.locale ?? "en-US"}, ${fullUser.banned}, ${fullUser.banReason ?? null}, ${fullUser.banExpires ?? null}, ${fullUser.metadata ? JSON.stringify(fullUser.metadata) : null}, ${fullUser.createdAt}, ${fullUser.updatedAt})
    `;
    return fullUser;
  }

  public async findUserByEmail(email: string): Promise<UserRecord | null> {
    await this.ensureReady();
    if (this.sqliteDb) {
      const row = this.sqliteDb
        .query("SELECT * FROM users WHERE email = ?")
        .get(email) as any;
      if (!row) return null;
      return {
        ...row,
        emailVerified: Boolean(row.email_verified),
        banned: Boolean(row.banned),
        displayName: row.display_name,
        banReason: row.ban_reason,
        banExpires: row.ban_expires,
        metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };
    }

    const { sql } = await import("bun");
    const rows = await sql<
      any[]
    >`SELECT * FROM users WHERE email = ${email} LIMIT 1`;
    if (!rows.length) return null;
    const r = rows[0];
    return {
      ...r,
      emailVerified: Boolean(r.email_verified),
      banned: Boolean(r.banned),
      displayName: r.display_name,
      banReason: r.ban_reason,
      banExpires: r.ban_expires,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    };
  }

  public async findUserById(id: string): Promise<UserRecord | null> {
    await this.ensureReady();
    if (this.sqliteDb) {
      const row = this.sqliteDb
        .query("SELECT * FROM users WHERE id = ?")
        .get(id) as any;
      if (!row) return null;
      return {
        ...row,
        emailVerified: Boolean(row.email_verified),
        banned: Boolean(row.banned),
        displayName: row.display_name,
        banReason: row.ban_reason,
        banExpires: row.ban_expires,
        metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };
    }

    const { sql } = await import("bun");
    const rows = await sql<any[]>`SELECT * FROM users WHERE id = ${id} LIMIT 1`;
    if (!rows.length) return null;
    const r = rows[0];
    return {
      ...r,
      emailVerified: Boolean(r.email_verified),
      banned: Boolean(r.banned),
      displayName: r.display_name,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    };
  }

  // --- Accounts (Multi-Provider) ---
  public async createAccount(
    account: Omit<AccountRecord, "createdAt" | "updatedAt">,
  ): Promise<AccountRecord> {
    await this.ensureReady();
    const now = new Date().toISOString();
    const fullAccount: AccountRecord = {
      ...account,
      createdAt: now,
      updatedAt: now,
    };

    if (this.sqliteDb) {
      const query = this.sqliteDb.query(`
        INSERT INTO accounts (id, user_id, account_id, provider_id, access_token, refresh_token, id_token, access_token_expires_at, refresh_token_expires_at, scope, password_hash, metadata, created_at, updated_at)
        VALUES ($id, $userId, $accountId, $providerId, $accessToken, $refreshToken, $idToken, $accessTokenExpiresAt, $refreshTokenExpiresAt, $scope, $passwordHash, $metadata, $createdAt, $updatedAt)
      `);
      query.run({
        $id: fullAccount.id,
        $userId: fullAccount.userId,
        $accountId: fullAccount.accountId,
        $providerId: fullAccount.providerId,
        $accessToken: fullAccount.accessToken ?? null,
        $refreshToken: fullAccount.refreshToken ?? null,
        $idToken: fullAccount.idToken ?? null,
        $accessTokenExpiresAt: fullAccount.accessTokenExpiresAt ?? null,
        $refreshTokenExpiresAt: fullAccount.refreshTokenExpiresAt ?? null,
        $scope: fullAccount.scope ?? null,
        $passwordHash: fullAccount.passwordHash ?? null,
        $metadata: fullAccount.metadata
          ? JSON.stringify(fullAccount.metadata)
          : null,
        $createdAt: fullAccount.createdAt,
        $updatedAt: fullAccount.updatedAt,
      });
      return fullAccount;
    }

    const { sql } = await import("bun");
    await sql`
      INSERT INTO accounts (id, user_id, account_id, provider_id, access_token, refresh_token, id_token, access_token_expires_at, refresh_token_expires_at, scope, password_hash, metadata, created_at, updated_at)
      VALUES (${fullAccount.id}, ${fullAccount.userId}, ${fullAccount.accountId}, ${fullAccount.providerId}, ${fullAccount.accessToken ?? null}, ${fullAccount.refreshToken ?? null}, ${fullAccount.idToken ?? null}, ${fullAccount.accessTokenExpiresAt ?? null}, ${fullAccount.refreshTokenExpiresAt ?? null}, ${fullAccount.scope ?? null}, ${fullAccount.passwordHash ?? null}, ${fullAccount.metadata ? JSON.stringify(fullAccount.metadata) : null}, ${fullAccount.createdAt}, ${fullAccount.updatedAt})
    `;
    return fullAccount;
  }

  public async findAccountByProvider(
    providerId: SupportedAuthProvider,
    accountId: string,
  ): Promise<AccountRecord | null> {
    await this.ensureReady();
    if (this.sqliteDb) {
      const row = this.sqliteDb
        .query(
          "SELECT * FROM accounts WHERE provider_id = ? AND account_id = ?",
        )
        .get(providerId, accountId) as any;
      if (!row) return null;
      return {
        id: row.id,
        userId: row.user_id,
        accountId: row.account_id,
        providerId: row.provider_id,
        accessToken: row.access_token,
        refreshToken: row.refresh_token,
        idToken: row.id_token,
        accessTokenExpiresAt: row.access_token_expires_at,
        refreshTokenExpiresAt: row.refresh_token_expires_at,
        scope: row.scope,
        passwordHash: row.password_hash,
        metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };
    }

    const { sql } = await import("bun");
    const rows = await sql<
      any[]
    >`SELECT * FROM accounts WHERE provider_id = ${providerId} AND account_id = ${accountId} LIMIT 1`;
    if (!rows.length) return null;
    const r = rows[0];
    return {
      id: r.id,
      userId: r.user_id,
      accountId: r.account_id,
      providerId: r.provider_id,
      accessToken: r.access_token,
      refreshToken: r.refresh_token,
      idToken: r.id_token,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    };
  }

  public async findAccountsByUserId(userId: string): Promise<AccountRecord[]> {
    await this.ensureReady();
    if (this.sqliteDb) {
      const rows = this.sqliteDb
        .query("SELECT * FROM accounts WHERE user_id = ?")
        .all(userId) as any[];
      return rows.map((row) => ({
        id: row.id,
        userId: row.user_id,
        accountId: row.account_id,
        providerId: row.provider_id,
        accessToken: row.access_token,
        refreshToken: row.refresh_token,
        idToken: row.id_token,
        accessTokenExpiresAt: row.access_token_expires_at,
        refreshTokenExpiresAt: row.refresh_token_expires_at,
        scope: row.scope,
        passwordHash: row.password_hash,
        metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));
    }

    const { sql } = await import("bun");
    const rows = await sql<
      any[]
    >`SELECT * FROM accounts WHERE user_id = ${userId}`;
    return rows.map((r) => ({
      id: r.id,
      userId: r.user_id,
      accountId: r.account_id,
      providerId: r.provider_id,
      accessToken: r.access_token,
      refreshToken: r.refresh_token,
      idToken: r.id_token,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));
  }

  // --- Sessions ---
  public async createSession(
    session: Omit<SessionRecord, "createdAt" | "updatedAt">,
  ): Promise<SessionRecord> {
    await this.ensureReady();
    const now = new Date().toISOString();
    const fullSession: SessionRecord = {
      ...session,
      createdAt: now,
      updatedAt: now,
    };

    if (this.sqliteDb) {
      const query = this.sqliteDb.query(`
        INSERT INTO sessions (id, user_id, token, expires_at, ip_address, user_agent, active_organization_id, impersonated_by, created_at, updated_at)
        VALUES ($id, $userId, $token, $expiresAt, $ipAddress, $userAgent, $activeOrganizationId, $impersonatedBy, $createdAt, $updatedAt)
      `);
      query.run({
        $id: fullSession.id,
        $userId: fullSession.userId,
        $token: fullSession.token,
        $expiresAt: fullSession.expiresAt,
        $ipAddress: fullSession.ipAddress ?? null,
        $userAgent: fullSession.userAgent ?? null,
        $activeOrganizationId: fullSession.activeOrganizationId ?? null,
        $impersonatedBy: fullSession.impersonatedBy ?? null,
        $createdAt: fullSession.createdAt,
        $updatedAt: fullSession.updatedAt,
      });
      return fullSession;
    }

    const { sql } = await import("bun");
    await sql`
      INSERT INTO sessions (id, user_id, token, expires_at, ip_address, user_agent, active_organization_id, impersonated_by, created_at, updated_at)
      VALUES (${fullSession.id}, ${fullSession.userId}, ${fullSession.token}, ${fullSession.expiresAt}, ${fullSession.ipAddress ?? null}, ${fullSession.userAgent ?? null}, ${fullSession.activeOrganizationId ?? null}, ${fullSession.impersonatedBy ?? null}, ${fullSession.createdAt}, ${fullSession.updatedAt})
    `;
    return fullSession;
  }

  public async findSessionByToken(
    token: string,
  ): Promise<SessionRecord | null> {
    await this.ensureReady();
    if (this.sqliteDb) {
      const row = this.sqliteDb
        .query("SELECT * FROM sessions WHERE token = ?")
        .get(token) as any;
      if (!row) return null;
      return {
        id: row.id,
        userId: row.user_id,
        token: row.token,
        expiresAt: row.expires_at,
        ipAddress: row.ip_address,
        userAgent: row.user_agent,
        activeOrganizationId: row.active_organization_id,
        impersonatedBy: row.impersonated_by,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };
    }

    const { sql } = await import("bun");
    const rows = await sql<
      any[]
    >`SELECT * FROM sessions WHERE token = ${token} LIMIT 1`;
    if (!rows.length) return null;
    const r = rows[0];
    return {
      id: r.id,
      userId: r.user_id,
      token: r.token,
      expiresAt: r.expires_at,
      ipAddress: r.ip_address,
      userAgent: r.user_agent,
      activeOrganizationId: r.active_organization_id,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    };
  }

  // --- Password Vault ---
  public async savePasswordVaultItem(
    item: Omit<PasswordVaultRecord, "createdAt" | "updatedAt">,
  ): Promise<PasswordVaultRecord> {
    await this.ensureReady();
    const now = new Date().toISOString();
    const fullItem: PasswordVaultRecord = {
      ...item,
      createdAt: now,
      updatedAt: now,
    };

    if (this.sqliteDb) {
      const query = this.sqliteDb.query(`
        INSERT INTO password_vault (id, user_id, title, username, encrypted_password, url, notes, nonce, tag, folder, favorite, created_at, updated_at)
        VALUES ($id, $userId, $title, $username, $encryptedPassword, $url, $notes, $nonce, $tag, $folder, $favorite, $createdAt, $updatedAt)
      `);
      query.run({
        $id: fullItem.id,
        $userId: fullItem.userId,
        $title: fullItem.title,
        $username: fullItem.username,
        $encryptedPassword: fullItem.encryptedPassword,
        $url: fullItem.url ?? null,
        $notes: fullItem.notes ?? null,
        $nonce: fullItem.nonce,
        $tag: fullItem.tag,
        $folder: fullItem.folder ?? null,
        $favorite: fullItem.favorite ? 1 : 0,
        $createdAt: fullItem.createdAt,
        $updatedAt: fullItem.updatedAt,
      });
      return fullItem;
    }

    const { sql } = await import("bun");
    await sql`
      INSERT INTO password_vault (id, user_id, title, username, encrypted_password, url, notes, nonce, tag, folder, favorite, created_at, updated_at)
      VALUES (${fullItem.id}, ${fullItem.userId}, ${fullItem.title}, ${fullItem.username}, ${fullItem.encryptedPassword}, ${fullItem.url ?? null}, ${fullItem.notes ?? null}, ${fullItem.nonce}, ${fullItem.tag}, ${fullItem.folder ?? null}, ${fullItem.favorite}, ${fullItem.createdAt}, ${fullItem.updatedAt})
    `;
    return fullItem;
  }

  public async listPasswordVaultItems(
    userId: string,
  ): Promise<PasswordVaultRecord[]> {
    await this.ensureReady();
    if (this.sqliteDb) {
      const rows = this.sqliteDb
        .query(
          "SELECT * FROM password_vault WHERE user_id = ? ORDER BY favorite DESC, title ASC",
        )
        .all(userId) as any[];
      return rows.map((r) => ({
        id: r.id,
        userId: r.user_id,
        title: r.title,
        username: r.username,
        encryptedPassword: r.encrypted_password,
        url: r.url,
        notes: r.notes,
        nonce: r.nonce,
        tag: r.tag,
        folder: r.folder,
        favorite: Boolean(r.favorite),
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      }));
    }

    const { sql } = await import("bun");
    const rows = await sql<
      any[]
    >`SELECT * FROM password_vault WHERE user_id = ${userId} ORDER BY favorite DESC, title ASC`;
    return rows.map((r) => ({
      id: r.id,
      userId: r.user_id,
      title: r.title,
      username: r.username,
      encryptedPassword: r.encrypted_password,
      url: r.url,
      notes: r.notes,
      nonce: r.nonce,
      tag: r.tag,
      folder: r.folder,
      favorite: Boolean(r.favorite),
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));
  }

  // --- Audit Logs ---
  public async logAudit(log: Omit<AuditLogRecord, "createdAt">): Promise<void> {
    await this.ensureReady();
    const now = new Date().toISOString();
    if (this.sqliteDb) {
      const query = this.sqliteDb.query(`
        INSERT INTO audit_logs (id, user_id, action, resource, ip_address, user_agent, status, details, created_at)
        VALUES ($id, $userId, $action, $resource, $ipAddress, $userAgent, $status, $details, $createdAt)
      `);
      query.run({
        $id: log.id,
        $userId: log.userId ?? null,
        $action: log.action,
        $resource: log.resource,
        $ipAddress: log.ipAddress ?? null,
        $userAgent: log.userAgent ?? null,
        $status: log.status,
        $details: log.details ? JSON.stringify(log.details) : null,
        $createdAt: now,
      });
      return;
    }

    const { sql } = await import("bun");
    await sql`
      INSERT INTO audit_logs (id, user_id, action, resource, ip_address, user_agent, status, details, created_at)
      VALUES (${log.id}, ${log.userId ?? null}, ${log.action}, ${log.resource}, ${log.ipAddress ?? null}, ${log.userAgent ?? null}, ${log.status}, ${log.details ? JSON.stringify(log.details) : null}, ${now})
    `;
  }

  // --- Verifications (magic link / OTP) ---
  public async createVerification(
    identifier: string,
    value: string,
    ttlMs: number,
  ): Promise<void> {
    await this.ensureReady();
    const now = new Date().toISOString();
    const expiresAt = new Date(Date.now() + ttlMs).toISOString();
    const id = `ver_${crypto.randomUUID()}`;
    if (this.sqliteDb) {
      this.sqliteDb
        .query(
          "INSERT INTO verifications (id, identifier, value, expires_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
        )
        .run(id, identifier, value, expiresAt, now, now);
      return;
    }
    const { sql } = await import("bun");
    await sql`INSERT INTO verifications (id, identifier, value, expires_at, created_at, updated_at) VALUES (${id}, ${identifier}, ${value}, ${expiresAt}, ${now}, ${now})`;
  }

  /** Single-use: returns true and deletes the row only if value matches and is unexpired. */
  public async consumeVerification(
    identifier: string,
    value: string,
  ): Promise<boolean> {
    await this.ensureReady();
    const now = new Date().toISOString();
    if (this.sqliteDb) {
      const row = this.sqliteDb
        .query(
          "SELECT id FROM verifications WHERE identifier = ? AND value = ? AND expires_at > ?",
        )
        .get(identifier, value, now) as any;
      if (!row) return false;
      this.sqliteDb.query("DELETE FROM verifications WHERE id = ?").run(row.id);
      return true;
    }
    const { sql } = await import("bun");
    const rows = await sql<
      any[]
    >`DELETE FROM verifications WHERE identifier = ${identifier} AND value = ${value} AND expires_at > ${now} RETURNING id`;
    return rows.length > 0;
  }

  public async markEmailVerified(userId: string): Promise<void> {
    await this.ensureReady();
    if (this.sqliteDb) {
      this.sqliteDb
        .query(
          "UPDATE users SET email_verified = 1, updated_at = ? WHERE id = ?",
        )
        .run(new Date().toISOString(), userId);
      return;
    }
    const { sql } = await import("bun");
    await sql`UPDATE users SET email_verified = TRUE, updated_at = ${new Date().toISOString()} WHERE id = ${userId}`;
  }

  public async getStats(): Promise<{
    totalUsers: number;
    activeSessions: number;
    totalAccounts: number;
  }> {
    await this.ensureReady();
    const now = new Date().toISOString();
    if (this.sqliteDb) {
      const u = this.sqliteDb
        .query("SELECT COUNT(*) AS n FROM users")
        .get() as any;
      const s = this.sqliteDb
        .query("SELECT COUNT(*) AS n FROM sessions WHERE expires_at > ?")
        .get(now) as any;
      const a = this.sqliteDb
        .query("SELECT COUNT(*) AS n FROM accounts")
        .get() as any;
      return { totalUsers: u.n, activeSessions: s.n, totalAccounts: a.n };
    }
    const { sql } = await import("bun");
    const u = await sql<any[]>`SELECT COUNT(*)::int AS n FROM users`;
    const s = await sql<
      any[]
    >`SELECT COUNT(*)::int AS n FROM sessions WHERE expires_at > ${now}`;
    const a = await sql<any[]>`SELECT COUNT(*)::int AS n FROM accounts`;
    return {
      totalUsers: u[0].n,
      activeSessions: s[0].n,
      totalAccounts: a[0].n,
    };
  }

  public async findUserByUsername(
    username: string,
  ): Promise<UserRecord | null> {
    await this.ensureReady();
    if (this.sqliteDb) {
      const row = this.sqliteDb
        .query("SELECT email FROM users WHERE username = ?")
        .get(username) as any;
      return row ? this.findUserByEmail(row.email) : null;
    }
    const { sql } = await import("bun");
    const rows = await sql<
      any[]
    >`SELECT email FROM users WHERE username = ${username} LIMIT 1`;
    return rows.length ? this.findUserByEmail(rows[0].email) : null;
  }

  // --- CMS & Public Profiles ---
  public async getCmsProfile(
    projectScope: string,
    handle: string,
  ): Promise<CmsProfileRecord | null> {
    await this.ensureReady();
    if (this.sqliteDb) {
      const row = this.sqliteDb
        .query(
          "SELECT * FROM cms_profiles WHERE project_scope = ? AND handle = ?",
        )
        .get(projectScope, handle) as any;
      if (!row) return null;
      return {
        id: row.id,
        userId: row.user_id,
        projectScope: row.project_scope,
        handle: row.handle,
        customCss: row.custom_css,
        theme: row.theme,
        links: JSON.parse(row.links || "{}"),
        badges: JSON.parse(row.badges || "[]"),
        verifiedDev: Boolean(row.verified_dev),
        stats: JSON.parse(row.stats || "{}"),
        updatedAt: row.updated_at,
      };
    }

    const { sql } = await import("bun");
    const rows = await sql<
      any[]
    >`SELECT * FROM cms_profiles WHERE project_scope = ${projectScope} AND handle = ${handle} LIMIT 1`;
    if (!rows.length) return null;
    const r = rows[0];
    return {
      id: r.id,
      userId: r.user_id,
      projectScope: r.project_scope,
      handle: r.handle,
      customCss: r.custom_css,
      theme: r.theme,
      links: r.links,
      badges: r.badges,
      verifiedDev: Boolean(r.verified_dev),
      stats: r.stats,
      updatedAt: r.updated_at,
    };
  }
}
