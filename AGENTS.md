# YOLO-Backend Agent Governance & Architecture Directives

## 0. Doctrine Fondatrice : No Human In The Loop (NHITL)
- **Zero Human In The Loop** : execution de bout en bout sans interruption, sans validation intermediaire, sans questions triviales.
- **Grind Continu & Auto-Goal** : identification autonome des objectifs, resolution des bugs, auto-tests et commits automatiques.
- **Purete Technique** : 100% Upstream Bun v1.4.4+ et Rust 2024. Bannissement strict de Node.js, npm, yarn, pnpm et des wrappers externes.
- **Zero Emoji** : aucun emoji dans les reponses, fichiers, messages de commit ou logs.

## 1. Architecture du Monorepo
1. **Bun AoT Host Engine** :
   - Entrypoint : `src/index.ts`.
   - Build AoT : `bun run scripts/compile-aot.ts` produisant `dist/yolo-backend.exe` (148.91 MB) via le compilateur Cranelift natif.
2. **Rust Core Systems Engine** :
   - Crate : `crates/yolo-backend-core` (Axum 0.8, Tokio, Serde).
   - Profil Release : `lto = "fat"`, `codegen-units = 1`, `panic = "abort"`.
   - Build script : `bun run scripts/build-rust.ts` produisant `dist/yolo-backend-core.exe` (713.5 KB).
   - Port dynamique via variable d'environnement `PORT` (defaut 8796).
3. **Modules Consolidés** :
   - `packages/resend-engine` : API Resend + verificateur HMAC Svix.
   - `packages/cloudflare-mail` : Client Email Routing REST + factory Cloudflare Workers.
   - `packages/hostinger-mail` : Integration VPS KVM 8 (`72.60.186.43`, VM `2116886`) + relay fallback WireGuard `10.200.77.5:17400`.
   - `packages/webmail-zumba` : Client/serveur HTML/TSX reactif haute performance sans dependance.
   - `packages/better-auth-full` : Better-Auth v1.7.18 avec 10 plugins (`magicLink`, `twoFactor`, `organization`, `admin`, `bearer`, `emailOTP`, `captcha`, `jwt`, `openAPI`, `username`), serveur OAuth2/OIDC RFC 8414, Client SDK middleware, bridge Firebase Auth RS256.
   - `packages/google-workspace` : Client Gmail API + echange JWT compte de service Google.
   - `packages/mail-templates` : 8 templates responsive 2026, marque Aphrody (SIREN 918 827 892, SVG vectoriel).

## 2. Main-Only Workflow
- Tout commit s'effectue directement sur `main`.
- Les hooks `pre-push` et `post-commit` installes via `bun scripts/main-only.ts` verrouillent les branches et poussent en temps reel.
- Toujours executer `bun test` et `cargo check` avant de conclure.
