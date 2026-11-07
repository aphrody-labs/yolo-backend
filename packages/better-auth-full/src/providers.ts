/**
 * Aphrody Universal OAuth Provider Templates (2026 Edition)
 * Production configurations for Google, GitHub, Cloudflare, Apple, Microsoft, Discord, and Aphrody Mesh.
 */

export interface OAuthProviderConfig {
  id: string;
  name: string;
  clientId: string;
  clientSecret: string;
  authorizationUrl: string;
  tokenUrl: string;
  userInfoUrl: string;
  scopes: string[];
  redirectUri?: string;
  extraParams?: Record<string, string>;
}

export function getProviderTemplates(
  env = process.env,
): Record<string, OAuthProviderConfig> {
  const authDomain = env.BETTER_AUTH_URL || "https://auth.aphrody.app";

  return {
    // 1. Google Cloud / Google Workspace
    google: {
      id: "google",
      name: "Google Cloud & Workspace",
      clientId:
        env.GOOGLE_CLIENT_ID ||
        "aphrody-google-client-id.apps.googleusercontent.com",
      clientSecret: env.GOOGLE_CLIENT_SECRET || "",
      authorizationUrl: "https://accounts.google.com/o/oauth2/v2/auth",
      tokenUrl: "https://oauth2.googleapis.com/token",
      userInfoUrl: "https://openidconnect.googleapis.com/v1/userinfo",
      scopes: ["openid", "email", "profile"],
      redirectUri: `${authDomain}/api/auth/callback/google`,
      extraParams: {
        access_type: "offline",
        prompt: "consent",
      },
    },

    // 2. GitHub
    github: {
      id: "github",
      name: "GitHub",
      clientId: env.GITHUB_CLIENT_ID || "",
      clientSecret: env.GITHUB_CLIENT_SECRET || "",
      authorizationUrl: "https://github.com/login/oauth/authorize",
      tokenUrl: "https://github.com/login/oauth/access_token",
      userInfoUrl: "https://api.github.com/user",
      scopes: ["read:user", "user:email"],
      redirectUri: `${authDomain}/api/auth/callback/github`,
    },

    // 3. Cloudflare Access & OAuth
    cloudflare: {
      id: "cloudflare",
      name: "Cloudflare Access",
      clientId:
        env.CLOUDFLARE_OAUTH_CLIENT_ID || "ca22c1a51a145f919b54afa18d936516",
      clientSecret: env.CLOUDFLARE_OAUTH_CLIENT_SECRET || "",
      authorizationUrl: "https://dash.cloudflare.com/oauth2/auth",
      tokenUrl: "https://dash.cloudflare.com/oauth2/token",
      userInfoUrl: "https://api.cloudflare.com/client/v4/user",
      scopes: ["user:read", "workers:write", "d1:write"],
      redirectUri: `${authDomain}/api/auth/callback/cloudflare`,
    },

    // 4. Apple Sign In
    apple: {
      id: "apple",
      name: "Apple ID",
      clientId: env.APPLE_CLIENT_ID || "com.aphrody.webos",
      clientSecret: env.APPLE_CLIENT_SECRET || "",
      authorizationUrl: "https://appleid.apple.com/auth/authorize",
      tokenUrl: "https://appleid.apple.com/auth/token",
      userInfoUrl: "https://appleid.apple.com/auth/userinfo",
      scopes: ["name", "email"],
      redirectUri: `${authDomain}/api/auth/callback/apple`,
      extraParams: {
        response_mode: "form_post",
      },
    },

    // 5. Microsoft Entra ID
    microsoft: {
      id: "microsoft",
      name: "Microsoft Entra ID",
      clientId: env.MICROSOFT_CLIENT_ID || "",
      clientSecret: env.MICROSOFT_CLIENT_SECRET || "",
      authorizationUrl:
        "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
      tokenUrl: "https://login.microsoftonline.com/common/oauth2/v2.0/token",
      userInfoUrl: "https://graph.microsoft.com/v1.0/me",
      scopes: ["openid", "profile", "email", "User.Read"],
      redirectUri: `${authDomain}/api/auth/callback/microsoft`,
    },

    // 6. Discord OAuth
    discord: {
      id: "discord",
      name: "Discord",
      clientId: env.DISCORD_CLIENT_ID || "",
      clientSecret: env.DISCORD_CLIENT_SECRET || "",
      authorizationUrl: "https://discord.com/api/oauth2/authorize",
      tokenUrl: "https://discord.com/api/oauth2/token",
      userInfoUrl: "https://discord.com/api/users/@me",
      scopes: ["identify", "email"],
      redirectUri: `${authDomain}/api/auth/callback/discord`,
    },

    // 7. Aphrody Native OAuth (Self-Hosted on Mesh)
    aphrody: {
      id: "aphrody",
      name: "Aphrody Cloud OS Native Auth",
      clientId: "aphrody-webos-client",
      clientSecret: env.APHRODY_CLIENT_SECRET || "aphrody-native-secret-2026",
      authorizationUrl: `${authDomain}/oauth/authorize`,
      tokenUrl: `${authDomain}/oauth/token`,
      userInfoUrl: `${authDomain}/oauth/userinfo`,
      scopes: ["openid", "profile", "email", "mesh:control"],
      redirectUri: `${authDomain}/api/auth/callback/aphrody`,
    },
  };
}

export function buildAuthorizationUrl(
  provider: OAuthProviderConfig,
  state: string,
  codeChallenge?: string,
): string {
  const url = new URL(provider.authorizationUrl);
  url.searchParams.set("client_id", provider.clientId);
  url.searchParams.set("redirect_uri", provider.redirectUri || "");
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", provider.scopes.join(" "));
  url.searchParams.set("state", state);

  if (codeChallenge) {
    url.searchParams.set("code_challenge", codeChallenge);
    url.searchParams.set("code_challenge_method", "S256");
  }

  if (provider.extraParams) {
    for (const [k, v] of Object.entries(provider.extraParams)) {
      url.searchParams.set(k, v);
    }
  }

  return url.toString();
}
