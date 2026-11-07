# @yolo-rs/yolo-backend

Aphrody Universal Backend Monorepo consolidating **Resend Engine**, **Cloudflare Mail**, **OVH Webmail (Zumba)**, **Hostinger Mail**, and the complete **Better-Auth Suite** with **Google Workspace** & **Cloudflare** best practices and style guides.

Compiled natively with **Bun Ahead-of-Time (AoT)** and **Rust Fat Link-Time Optimization (LTO)**.

---

## 1. Monorepo Architecture

```
yolo-backend/
├── crates/
│   └── yolo-backend-core/       # Rust 2024 / Fat LTO systems engine (Axum 0.8, Tokio)
├── packages/
│   ├── resend-engine/           # Resend-compatible transactional mail API, batching, webhooks
│   ├── cloudflare-mail/         # Cloudflare Email Routing, sending, and edge worker with D1
│   ├── hostinger-mail/          # Hostinger Mail API & KVM 8 instance integration
│   ├── webmail-zumba/           # Modern OVH/Zimbra-style Webmail client & server (Zumba)
│   ├── better-auth-full/        # Complete Better-Auth fork with 10 plugins & OAuth2/OIDC server
│   ├── google-workspace/        # Gmail API, Service Account JWT bridge, and MIME builder
│   └── mail-templates/          # 2026 Responsive email templates & multi-provider dispatcher
├── scripts/
│   ├── compile-aot.ts           # Bun AoT compilation script (produces standalone binary)
│   └── build-rust.ts            # Cargo release build with Fat LTO
├── src/
│   └── index.ts                 # Unified application entrypoint & discovery API
├── test/
│   └── unified-backend.test.ts  # End-to-end integration test suite
├── Cargo.toml                   # Root Rust workspace (lto = "fat", panic = "abort")
├── package.json                 # Bun monorepo workspace ("sideEffects": false)
└── tsconfig.json                # Google OSS TypeScript Style Guide
```

---

## 2. Quickstart & Commands

```bash
# Install dependencies
bun install

# Run complete test suite
bun test

# Compile standalone native binary via Bun Ahead-of-Time (AoT)
bun run compile:aot

# Build Rust systems core with Fat LTO
bun run build:rust

# Start development server
bun run src/index.ts
```

---

## 3. Subsystem Overview

### 3.1 Resend Engine (`@yolo-rs/resend-engine`)

- Drop-in replacement for `@resend/node` and Resend REST API.
- Implements `emails.send()`, `emails.batch.send()`, `emails.get()`.
- Built-in Svix-compatible webhook signature verifier (`svix-signature`, `svix-timestamp`).

### 3.2 Cloudflare Mail (`@yolo-rs/cloudflare-mail`)

- Manages Cloudflare Email Routing on zone `aphrody.app` (`f4dab237b9811435da6fee0b5b3438d4`).
- Cloudflare Edge Email Worker factory logging to Cloudflare D1 `aphrody-app`.
- DNS MX, SPF, DKIM, and DMARC verification.

### 3.3 Hostinger Mail (`@yolo-rs/hostinger-mail`)

- Manages Hostinger Mail API and mailboxes.
- Integrates with Hostinger KVM 8 bare-metal instance `2116886` (`72.60.186.43` / Arch Linux).

### 3.4 Zumba Webmail (`@yolo-rs/webmail-zumba`)

- High-performance, modern Webmail client replacing legacy OVH Roundcube and Zimbra.
- Interactive Single-Page App in TSX with folder trees (Inbox, Sent, Drafts, Archive, Trash).
- Message reader with DKIM/SPF verification badges and rich compose modal.

### 3.5 Better-Auth Full Suite (`@yolo-rs/better-auth-full`)

- Complete Better-Auth integration with 10 plugins (`magicLink`, `twoFactor`, `organization`, `admin`, `bearer`, `emailOTP`, `captcha` Turnstile, `jwt`, `openAPI`, `username`).
- Autonomous OAuth 2.0 / OpenID Connect (OIDC) Server with discovery (`/.well-known/openid-configuration`), JWKS, and PKCE (`S256`).
- Pre-configured provider templates for Google Workspace, GitHub, Cloudflare Access, Apple ID, Microsoft Entra ID, Discord, and Aphrody Mesh Native.
- Zero-dependency Client SDK & Hono/Bun middleware (`AphrodyAuthClient`).

### 3.6 Google Workspace (`@yolo-rs/google-workspace`)

- Service Account JWT generation for Google Cloud Platform.
- RFC 5322 MIME message formatting and Gmail API client.

---

## 4. Performance & Quality Gates

- **Bun Ahead-of-Time (AoT)**: Binary compiles in under 700ms with SSA IR optimizations and Cranelift backend.
- **Rust Fat LTO**: Release profile compiles with `lto = "fat"`, `codegen-units = 1`, and `panic = "abort"` for minimal binary size and peak throughput.
- **Google OSS TypeScript Style Guide**: Strict type-checking, zero implicit any, exact types, zero unhandled promises.
- **Zero Node.js / npm**: 100% pure Bun v1.4.4+ and native Rust.
