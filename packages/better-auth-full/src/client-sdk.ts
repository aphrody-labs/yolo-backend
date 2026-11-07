/**
 * Aphrody Universal Auth Client SDK & Middleware (2026 Edition)
 * Zero npm dependencies / 100% Web Standards (Request, Response, Web Crypto).
 * Designed for ANY Aphrody backend (Hono, Bun.serve, Elysia, Express, Axum).
 */

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: string;
  plan: string;
  orgId?: string;
  scope?: string;
  rawPayload: Record<string, any>;
}

export interface ClientSdkOptions {
  issuerUrl?: string; // default: https://auth.aphrody.app
  jwtSecret?: string;
  requiredRole?: string[];
  cacheTtlMs?: number;
}

export class AphrodyAuthClient {
  private issuerUrl: string;
  private jwtSecret: string;
  private cache = new Map<string, { user: AuthenticatedUser; exp: number }>();
  private cacheTtlMs: number;

  constructor(options?: ClientSdkOptions) {
    this.issuerUrl = options?.issuerUrl || process.env.OAUTH_ISSUER || "https://auth.aphrody.app";
    this.jwtSecret =
      options?.jwtSecret ||
      process.env.BETTER_AUTH_SECRET ||
      "aphrody-production-secret-auth-key-2026-canary-mesh-token";
    this.cacheTtlMs = options?.cacheTtlMs || 60000; // 1 minute
  }

  /**
   * Extracts and validates Bearer token from standard Request or Authorization header
   */
  async authenticate(reqOrHeader: Request | string | null | undefined): Promise<AuthenticatedUser | null> {
    let authHeader = "";
    if (typeof reqOrHeader === "string") {
      authHeader = reqOrHeader;
    } else if (reqOrHeader && typeof reqOrHeader.headers?.get === "function") {
      authHeader = reqOrHeader.headers.get("authorization") || "";
    }

    if (!authHeader.startsWith("Bearer ")) {
      return null;
    }

    const token = authHeader.substring(7).trim();
    if (!token) return null;

    // Check memory cache
    const cached = this.cache.get(token);
    if (cached && Date.now() < cached.exp) {
      return cached.user;
    }

    // Validate JWT
    const payload = await this.verifyJwtHs256(token);
    if (!payload) return null;

    const user: AuthenticatedUser = {
      id: payload.sub || "unknown",
      email: payload.email || `${payload.sub}@aphrody.app`,
      role: payload.role || "user",
      plan: payload.plan || "starter",
      orgId: payload.orgId,
      scope: payload.scope,
      rawPayload: payload,
    };

    // Cache valid user session
    this.cache.set(token, {
      user,
      exp: Math.min(Date.now() + this.cacheTtlMs, (payload.exp || 0) * 1000),
    });

    return user;
  }

  /**
   * Hono Middleware wrapper
   */
  honoMiddleware(requiredRoles?: string[]) {
    return async (c: any, next: () => Promise<void>) => {
      const user = await this.authenticate(c.req.raw);
      if (!user) {
        return c.json({ error: "Unauthorized: Missing or invalid Bearer token" }, 401);
      }

      if (requiredRoles && requiredRoles.length > 0) {
        if (!requiredRoles.includes(user.role) && user.role !== "superadmin") {
          return c.json({ error: "Forbidden: Insufficient privileges" }, 403);
        }
      }

      // Attach user to context
      c.set("user", user);
      await next();
    };
  }

  /**
   * Native Bun.serve guard helper
   */
  async protect(
    req: Request,
    requiredRoles?: string[]
  ): Promise<{ authorized: true; user: AuthenticatedUser } | { authorized: false; response: Response }> {
    const user = await this.authenticate(req);
    if (!user) {
      return {
        authorized: false,
        response: Response.json({ error: "Unauthorized" }, { status: 401 }),
      };
    }

    if (requiredRoles && requiredRoles.length > 0) {
      if (!requiredRoles.includes(user.role) && user.role !== "superadmin") {
        return {
          authorized: false,
          response: Response.json({ error: "Forbidden" }, { status: 403 }),
        };
      }
    }

    return { authorized: true, user };
  }

  private async verifyJwtHs256(token: string): Promise<Record<string, any> | null> {
    try {
      const parts = token.split(".");
      if (parts.length !== 3) return null;

      const message = `${parts[0]}.${parts[1]}`;
      const signature = parts[2];

      const key = await crypto.subtle.importKey(
        "raw",
        new TextEncoder().encode(this.jwtSecret),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["verify"]
      );

      const isValid = await crypto.subtle.verify(
        "HMAC",
        key,
        Buffer.from(signature, "base64url"),
        new TextEncoder().encode(message)
      );

      if (!isValid) return null;

      const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"));
      if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
        return null;
      }

      return payload;
    } catch {
      return null;
    }
  }
}
