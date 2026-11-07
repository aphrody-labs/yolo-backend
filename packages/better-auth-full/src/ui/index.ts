/**
 * Aphrody & YOLO Universal Auth UI, User Journey & Admin Dashboard (2026 Edition)
 * Production SSR HTML/TSX engine with 5 customizable themes:
 * - aphrody (Cyan & Purple Glassmorphism)
 * - yolo (Cyberpunk Terminal Monospace)
 * - shenron (Emerald Dragon Gold)
 * - rosegriffon (Crimson Rose Gold)
 * - m3 (Material 3 Expressive)
 * Zero emoji, high-performance, responsive layout, dark mode native.
 */

export type ThemeName = "aphrody" | "yolo" | "shenron" | "rosegriffon" | "m3";

export interface ThemeColors {
  bg: string;
  cardBg: string;
  text: string;
  textMuted: string;
  primary: string;
  primaryHover: string;
  accent: string;
  border: string;
  badgeBg: string;
}

export const THEMES: Record<ThemeName, ThemeColors> = {
  aphrody: {
    bg: "#09090b",
    cardBg: "#121217",
    text: "#f4f4f5",
    textMuted: "#a1a1aa",
    primary: "#06b6d4",
    primaryHover: "#0891b2",
    accent: "#a855f7",
    border: "#27272a",
    badgeBg: "rgba(6, 182, 212, 0.15)",
  },
  yolo: {
    bg: "#000000",
    cardBg: "#0c0c0c",
    text: "#00ff66",
    textMuted: "#009944",
    primary: "#00ff66",
    primaryHover: "#00cc55",
    accent: "#ff0055",
    border: "#1a1a1a",
    badgeBg: "rgba(0, 255, 102, 0.1)",
  },
  shenron: {
    bg: "#05130b",
    cardBg: "#0a2215",
    text: "#e6f4ea",
    textMuted: "#81c995",
    primary: "#10b981",
    primaryHover: "#059669",
    accent: "#f59e0b",
    border: "#134e2b",
    badgeBg: "rgba(16, 185, 129, 0.15)",
  },
  rosegriffon: {
    bg: "#12070d",
    cardBg: "#1e0e18",
    text: "#fce7f3",
    textMuted: "#f472b6",
    primary: "#e11d48",
    primaryHover: "#be123c",
    accent: "#fbbf24",
    border: "#4c0519",
    badgeBg: "rgba(225, 29, 72, 0.15)",
  },
  m3: {
    bg: "#1a1c1e",
    cardBg: "#212427",
    text: "#e2e2e6",
    textMuted: "#c4c6d0",
    primary: "#a8c7fa",
    primaryHover: "#8ab4f8",
    accent: "#d0bcff",
    border: "#44474e",
    badgeBg: "rgba(168, 199, 250, 0.12)",
  },
};

export class AuthUiRenderer {
  /**
   * Universal Sign In / Sign Up Screen
   */
  public static renderAuthPage(
    mode: "signin" | "signup" = "signin",
    themeName: ThemeName = "aphrody",
    options: {
      product?: "aphrody" | "yolo" | "shenron" | "rosegriffon";
      turnstileSiteKey?: string;
      error?: string;
      redirectUrl?: string;
    } = {},
  ): string {
    const theme = THEMES[themeName] || THEMES.aphrody;
    const title =
      mode === "signin" ? "Sign In to Aphrody" : "Create your Aphrody Account";
    const product = options.product || "aphrody";

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} | ${product.toUpperCase()}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
    body { background-color: ${theme.bg}; color: ${theme.text}; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 24px; }
    .container { width: 100%; max-width: 460px; background-color: ${theme.cardBg}; border: 1px solid ${theme.border}; border-radius: 16px; padding: 36px; box-shadow: 0 20px 40px rgba(0,0,0,0.5); }
    .logo-header { text-align: center; margin-bottom: 28px; }
    .logo-badge { display: inline-block; padding: 6px 14px; border-radius: 20px; font-size: 12px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; background: ${theme.badgeBg}; color: ${theme.primary}; margin-bottom: 12px; border: 1px solid ${theme.primary}; }
    h1 { font-size: 24px; font-weight: 700; margin-bottom: 8px; }
    p.subtitle { color: ${theme.textMuted}; font-size: 14px; line-height: 1.5; }
    .google-btn { display: flex; align-items: center; justify-content: center; gap: 12px; width: 100%; padding: 14px; background-color: #ffffff; color: #1f1f1f; border-radius: 10px; font-weight: 600; font-size: 15px; text-decoration: none; border: none; cursor: pointer; transition: transform 0.15s ease, background 0.15s ease; margin-bottom: 20px; }
    .google-btn:hover { background-color: #f1f1f1; transform: translateY(-1px); }
    .divider { display: flex; align-items: center; text-align: center; margin: 20px 0; color: ${theme.textMuted}; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
    .divider::before, .divider::after { content: ''; flex: 1; border-bottom: 1px solid ${theme.border}; }
    .divider:not(:empty)::before { margin-right: 12px; }
    .divider:not(:empty)::after { margin-left: 12px; }
    .provider-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 24px; }
    .provider-btn { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; padding: 12px 6px; background-color: rgba(255,255,255,0.03); border: 1px solid ${theme.border}; border-radius: 10px; color: ${theme.text}; text-decoration: none; font-size: 11px; font-weight: 600; cursor: pointer; transition: all 0.15s ease; }
    .provider-btn:hover { border-color: ${theme.primary}; background-color: rgba(255,255,255,0.06); transform: translateY(-2px); }
    .form-group { margin-bottom: 16px; }
    label { display: block; font-size: 13px; font-weight: 600; margin-bottom: 6px; color: ${theme.text}; }
    input[type="email"], input[type="text"], input[type="password"] { width: 100%; padding: 12px 14px; border-radius: 8px; border: 1px solid ${theme.border}; background-color: rgba(0,0,0,0.25); color: #ffffff; font-size: 14px; outline: none; transition: border-color 0.2s; }
    input:focus { border-color: ${theme.primary}; }
    .primary-btn { width: 100%; padding: 14px; background: linear-gradient(135deg, ${theme.primary}, ${theme.accent}); color: #ffffff; border: none; border-radius: 8px; font-size: 15px; font-weight: 700; cursor: pointer; transition: opacity 0.2s; margin-top: 8px; }
    .primary-btn:hover { opacity: 0.95; }
    .passkey-btn { width: 100%; padding: 12px; background: transparent; border: 1px dashed ${theme.primary}; color: ${theme.primary}; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; margin-top: 12px; display: flex; align-items: center; justify-content: center; gap: 8px; }
    .footer-links { text-align: center; margin-top: 24px; font-size: 13px; color: ${theme.textMuted}; }
    .footer-links a { color: ${theme.primary}; text-decoration: none; font-weight: 600; }
    .error-banner { background-color: rgba(239, 68, 68, 0.15); border: 1px solid #ef4444; color: #fca5a5; padding: 12px; border-radius: 8px; font-size: 13px; margin-bottom: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo-header">
      <div class="logo-badge">${product} ecosystem</div>
      <h1>${title}</h1>
      <p class="subtitle">Unified identity across Aphrody, YOLO, Shenron & Rosegriffon.</p>
    </div>

    ${options.error ? `<div class="error-banner">${options.error}</div>` : ""}

    <!-- Google First Authentication -->
    <a href="/api/auth/signin/google?redirect=${encodeURIComponent(options.redirectUrl || "/")}" class="google-btn">
      <svg width="20" height="20" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/></svg>
      Continue with Google
    </a>

    <div class="divider">or connect with</div>

    <!-- Provider Grid -->
    <div class="provider-grid">
      <a href="/api/auth/signin/github" class="provider-btn">
        <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
        GitHub
      </a>
      <a href="/api/auth/signin/discord" class="provider-btn">
        <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg>
        Discord
      </a>
      <a href="/api/auth/signin/steam" class="provider-btn">
        <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M12 .002C5.372.002 0 5.374 0 12.002c0 5.385 3.55 9.94 8.448 11.458l3.08-4.48a4.2 4.2 0 0 1-.528-.033l-2.91 1.722a3.003 3.003 0 0 1-4.088-3.327l4.088-2.42a4.49 4.49 0 0 1 3.91-4.42V4.5a1.5 1.5 0 1 1 3 0v6.002a4.5 4.5 0 0 1 4.5 4.5 4.5 4.5 0 0 1-4.5 4.5 4.54 4.54 0 0 1-2.94-1.085l-3.32 4.83a12.01 12.01 0 0 0 3.26.455c6.628 0 12-5.372 12-12C24 5.374 18.628.002 12 .002z"/></svg>
        Steam
      </a>
      <a href="/api/auth/signin/microsoft" class="provider-btn">
        <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M11.4 24H0V12.6h11.4V24zM24 24H12.6V12.6H24V24zM11.4 11.4H0V0h11.4v11.4zm12.6 0H12.6V0H24v11.4z"/></svg>
        Microsoft
      </a>
      <a href="/api/auth/signin/apple" class="provider-btn">
        <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.62-.75 1.04-1.8 0.92-2.85-.9.04-1.99.6-2.63 1.35-.57.65-1.06 1.72-.93 2.74 1 .08 2.02-.49 2.64-1.24z"/></svg>
        Apple
      </a>
      <a href="/api/auth/signin/epic" class="provider-btn">
        <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0L1.5 6v12L12 24l10.5-6V6L12 0zm0 2.4l7.5 4.3v8.6L12 19.6l-7.5-4.3V6.7L12 2.4z"/></svg>
        Epic
      </a>
      <a href="/api/auth/signin/meta" class="provider-btn">
        <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
        Meta
      </a>
      <a href="/api/auth/signin/aphrody" class="provider-btn">
        <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
        Mesh SSO
      </a>
    </div>

    <!-- Passwordless Email Magic Link Form -->
    <form action="/api/auth/magic-link" method="POST">
      <div class="form-group">
        <label for="email">Email address</label>
        <input type="email" id="email" name="email" placeholder="name@example.com" required autocomplete="email">
      </div>
      <button type="submit" class="primary-btn">Send Magic Sign-In Link</button>
    </form>

    <div class="footer-links">
      ${
        mode === "signin"
          ? `Don't have an account? <a href="/auth/signup?product=${product}">Sign Up</a>`
          : `Already have an account? <a href="/auth/signin?product=${product}">Sign In</a>`
      }
    </div>
  </div>

</body>
</html>`;
  }

  /**
   * Public Developer Profile (`/@username`)
   */
  public static renderPublicProfilePage(
    user: {
      name: string;
      username: string;
      image?: string;
      bio?: string;
      role: string;
      createdAt: string;
    },
    accounts: Array<{ providerId: string; accountId: string }>,
    themeName: ThemeName = "aphrody",
  ): string {
    const theme = THEMES[themeName] || THEMES.aphrody;

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${user.name} (@${user.username}) | Aphrody Network</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    body { background-color: ${theme.bg}; color: ${theme.text}; min-height: 100vh; padding: 40px 20px; display: flex; justify-content: center; }
    .profile-card { width: 100%; max-width: 640px; background-color: ${theme.cardBg}; border: 1px solid ${theme.border}; border-radius: 20px; overflow: hidden; }
    .banner { height: 160px; background: linear-gradient(135deg, ${theme.primary}, ${theme.accent}); opacity: 0.8; }
    .content { padding: 0 32px 32px; position: relative; }
    .avatar { width: 100px; height: 100px; border-radius: 50%; border: 4px solid ${theme.cardBg}; margin-top: -50px; background-color: #27272a; object-fit: cover; }
    .name-row { margin-top: 16px; display: flex; align-items: center; justify-content: space-between; }
    h1 { font-size: 26px; font-weight: 800; }
    .username { color: ${theme.textMuted}; font-size: 15px; margin-top: 2px; }
    .role-badge { padding: 4px 12px; border-radius: 12px; font-size: 11px; font-weight: 700; text-transform: uppercase; background: ${theme.badgeBg}; color: ${theme.primary}; border: 1px solid ${theme.primary}; }
    .bio { margin-top: 16px; font-size: 15px; line-height: 1.6; color: ${theme.text}; }
    .section-title { font-size: 13px; text-transform: uppercase; letter-spacing: 1px; color: ${theme.textMuted}; margin: 24px 0 12px; font-weight: 700; }
    .connected-grid { display: flex; flex-wrap: wrap; gap: 8px; }
    .provider-tag { padding: 8px 14px; border-radius: 8px; background: rgba(255,255,255,0.04); border: 1px solid ${theme.border}; font-size: 13px; font-weight: 600; display: flex; align-items: center; gap: 8px; }
    .provider-tag.active { border-color: ${theme.primary}; color: ${theme.primary}; }
  </style>
</head>
<body>
  <div class="profile-card">
    <div class="banner"></div>
    <div class="content">
      <img src="${user.image || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.username}`}" class="avatar" alt="${user.name}">
      <div class="name-row">
        <div>
          <h1>${user.name}</h1>
          <div class="username">@${user.username}</div>
        </div>
        <div class="role-badge">${user.role}</div>
      </div>
      <p class="bio">${user.bio || "Member of the sovereign Aphrody & YOLO computing ecosystem."}</p>
      
      <div class="section-title">Verified Identity Providers</div>
      <div class="connected-grid">
        ${accounts.map((acc) => `<div class="provider-tag active">${acc.providerId.toUpperCase()} Connected</div>`).join("")}
      </div>
    </div>
  </div>
</body>
</html>`;
  }

  /**
   * Admin Operations & Observability Dashboard
   */
  public static renderAdminDashboard(
    stats: {
      totalUsers: number;
      activeSessions: number;
      totalAccounts: number;
    },
    themeName: ThemeName = "aphrody",
  ): string {
    const theme = THEMES[themeName] || THEMES.aphrody;

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Identity Administration Dashboard | Aphrody</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    body { background-color: ${theme.bg}; color: ${theme.text}; min-height: 100vh; padding: 32px; }
    .header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 32px; }
    h1 { font-size: 28px; font-weight: 800; }
    .kpi-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 32px; }
    .kpi-card { background-color: ${theme.cardBg}; border: 1px solid ${theme.border}; border-radius: 14px; padding: 24px; }
    .kpi-title { font-size: 13px; text-transform: uppercase; color: ${theme.textMuted}; font-weight: 700; margin-bottom: 8px; }
    .kpi-value { font-size: 36px; font-weight: 800; color: ${theme.primary}; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Identity Suite Management Console</h1>
    <a href="/settings" style="color: ${theme.primary}; font-weight: 600; text-decoration: none;">Account Settings</a>
  </div>

  <div class="kpi-grid">
    <div class="kpi-card">
      <div class="kpi-title">Total Registered Users</div>
      <div class="kpi-value">${stats.totalUsers}</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-title">Active Mesh Sessions</div>
      <div class="kpi-value">${stats.activeSessions}</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-title">Connected Identity Accounts</div>
      <div class="kpi-value">${stats.totalAccounts}</div>
    </div>
  </div>
</body>
</html>`;
  }
}
