# Guide & Matrice d'Integration Tri-Cloud Souveraine : Docker, Cloudflare & Google Cloud

Ce document synthetise l'architecture et les procedes operationnels combinant les competences **Docker BuildKit**, **Cloudflare Edge / Zero-Trust** et **Google Cloud** pour le monorepo racine `C:\src`.

---

## 1. Topologie des Competences & Outils Actifs

| Domaine | Outils & Skills Workspace (`.agents/skills`) | Hotes Cibles | Roles & Procedes |
|---|---|---|---|
| **Docker & BuildKit** | `docker-official`, `mcp/docker-docs` | `vps`, `cdn`, `prod` | Builds caches via BuildKit (`# syntax=docker/dockerfile:1.7`, `--mount=type=cache`), multi-stage non-root (`10001:10001`), streaming direct `zstd -T0`. |
| **Cloudflare & Edge** | `cloudflare`, `cloudflare-one`, `wrangler`, `cf-cli`, `nextjs-on-cloudflare` | `cdn`, `prod`, Cloudflare Global Edge | Workers ultra-rapides (`workerd` local sur `cdn`), Garage S3 R2, RQLite D1, Tunnels Zero-Trust `cloudflared`, cache immutable 1 an. |
| **Google Cloud** | `gcloud`, `google-cloud-recipe-auth`, `google-cloud-recipe-onboarding` | Local, `vps`, `cdn`, `prod`, GCP | Ingestion telemetry, Google Cloud Storage Coldline pour sauvegardes chiffrees ultimes, BigQuery / Vertex RAG bridges. |

---

## 2. Piliers d'Automatisation de Bout en Bout

### A. Pipeline Docker BuildKit & Deploiement Streaming Zstd
1. **Compilation sur `vps` (`10.200.77.1`)** :
   - Worktree dedie, mise en cache des couches Apt, Bun et Cargo via BuildKit.
2. **Transfert Reseau Zero-Downtime vers `prod` (`10.200.77.5`)** :
   ```bash
   docker save <image> | zstd -T0 -3 | ssh prod "zstd -d -T0 | docker load"
   ```
3. **Activation Ciblee** :
   - Seuls les conteneurs modifies sont relances via `docker compose up -d --no-deps <service>` avec healthchecks directs (sans fork `/bin/sh`).

### B. Cloudflare Edge & Simulation Locale sur `cdn`
1. **Simulation Complète sur `ssh cdn` (`10.200.77.3`)** :
   - `workerd` execute les scripts TypeScript sans modification.
   - `garage` en Rust fournit l'API S3 locale compatible R2.
   - `rqlited` maintient la base D1 repliquee sur la triade.
2. **Production sur `ssh prod` (`10.200.77.5`)** :
   - `shenron-cloudflared` et `shenron-gateway` assurent la terminaison TLS et la protection DDoS.

### C. Sauvegardes Offsite Chiffrees sur Google Cloud Storage
1. **Generation Locale / Prod** :
   - Snapshots PostgreSQL et SQLite crees de maniere consistante.
2. **Archivage GCS Coldline** :
   - Chiffrement AES-256 et export direct via `gsutil cp` / API Google vers bucket de stockage a froid sans cout de calcul.
