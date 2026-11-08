# GEMINI.md — YOLO-Backend Sovereign Data, Auth, Cloud & AI (`C:\src\yolo-backend`)

> **Doctrine**: No Human In The Loop (NHITL) | 100% Upstream Bun v1.4.4+ & Rust 2024 (Axum 0.8 Fat LTO)

## 1. Unified Architecture (`C:\src\yolo-backend`)
- **Database & Storage Layer**: PostgreSQL 18 (`Bun.SQL`), `bun:sqlite` (WAL + FTS5 + mmap), `Bun.redis`, RQLite D1, and Garage S3 R2.
- **Identity & Security**: Better-Auth (10 plugins), OAuth2/OIDC RFC 8414, PKCE `S256`, WebAuthn FIDO2 Passkeys, RFC 6238 TOTP, and WireGuard mesh (`10.200.77.0/24`) attestation.
- **Absorbed AI Pillar (`yolo-backend/ai`)**: Local Gemma 4 / Llama inference (`carbon_ffi`), Keyless Google AI Ultra Subscription Bridge (`aphrody` GCP project `468000409790`), A2A Protocol, OpenAI-compatible `/v1/chat/completions` gateway, and `agy` CLI.

## 2. Operating Directives
- Zero emojis in all code, commits, and logs.
- Never commit plaintext credentials; secrets sync via Secret Manager to `/etc/yolo/gcp-secrets.env` (`0600`).
