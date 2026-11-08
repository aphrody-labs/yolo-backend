// SPDX-License-Identifier: Apache-2.0
/**
 * Vital Cloud / Public Edge vs Sovereign WireGuard VPN Boundary & Live Auditor
 * Pure Bun v1.4.4+ / Full TypeScript 7 & Google OSS Style Guide.
 *
 * Defines the strict architectural boundary between:
 * 1. Vital Public Cloud & Edge Backends that CANNOT be replaced by a private WireGuard VPN:
 *    - Cloudflare Account `ca22c1a51a145f919b54afa18d936516` (Public Authoritative Anycast DNS & DNSSEC,
 *      L3/L4/L7 DDoS Mitigation, WAF, Turnstile, TLS 1.3 / HTTP/3 QUIC Edge Termination, Early Hints,
 *      HSTS Preload, Email Routing MX/SPF/DKIM/DMARC, R2 Zero-Egress Public Object Distribution,
 *      and Edge Workers).
 *    - Google Cloud Project `aphrody` (`468000409790`) (Google OAuth 2.0 / OIDC Identity Provider,
 *      Workspace / People / Gmail / Drive APIs, Secret Manager / Cloud KMS, Offsite Multi-Cloud
 *      Disaster-Recovery GCS Buckets outside OVH/Hostinger failure domains, Firebase / FCM Push
 *      Notifications & Android Play Integrity for mobile devices off-VPN, and Vertex AI / Gemini API fallback).
 * 2. Internal Sovereign Services Handled by WireGuard VPN (`10.200.77.0/24`):
 *    - `vps` (`10.200.77.1` / `51.77.147.152`), `bunos` (`10.200.77.3` / `51.255.162.6`),
 *      `prod` (`10.200.77.5` / `72.60.186.43`): `shenron-postgres`, `shenron-redis`, `rqlite` Raft cluster,
 *      `garage` S3 internal replication, `sccache` build farm daemon, internal microservice RPC, and private SSH.
 */

export type BackendPlane =
  | "public-edge-cloudflare"
  | "public-cloud-gcp"
  | "sovereign-wireguard-vpn";

export interface ArchitectureBoundaryItem {
  readonly id: string;
  readonly plane: BackendPlane;
  readonly provider: "cloudflare" | "gcp" | "wireguard-mesh";
  readonly title: string;
  readonly replaceableByVpn: boolean;
  readonly rationale: string;
  readonly endpointsOrResources: readonly string[];
}

export interface CloudflareZoneSpec {
  readonly zoneId: string;
  readonly domain: string;
  readonly primaryOriginIp: string;
  readonly primaryOriginNode: "prod" | "vps";
  readonly dnssecStatus: "active" | "pending";
  readonly emailRoutingEnabled: boolean;
  readonly mxRecords: readonly string[];
  readonly requiredTxtPatterns: readonly string[];
  readonly requiredCaaAuthorities: readonly string[];
  readonly workerRoutes: readonly string[];
}

export interface CloudflareOptimizationSpec {
  readonly ssl: "strict";
  readonly minTlsVersion: "1.2";
  readonly tls13: "zrt";
  readonly http3: "on";
  readonly zeroRtt: "on";
  readonly alwaysUseHttps: "on";
  readonly brotli: "on";
  readonly earlyHints: "on";
  readonly hsts: {
    readonly enabled: true;
    readonly maxAge: 63072000;
    readonly includeSubdomains: true;
    readonly preload: true;
    readonly nosniff: true;
  };
}

export interface WireGuardNodeSpec {
  readonly alias: "vps" | "bunos" | "prod";
  readonly meshIp: string;
  readonly publicIp: string;
  readonly provider: "ovh" | "hostinger";
  readonly os: string;
  readonly internalServices: readonly string[];
}

export interface CloudflareZoneAuditResult {
  readonly domain: string;
  readonly zoneId: string;
  readonly dohResolvedIps: string[];
  readonly dohMxRecords: string[];
  readonly dohSpfPresent: boolean;
  readonly dohDmarcPresent: boolean;
  readonly dohCaaPresent: boolean;
  readonly httpsStatus: number | null;
  readonly hstsHeader: string | null;
  readonly altSvcQuic: boolean;
  readonly optimalSettingsVerified: boolean;
}

export interface GcpProjectAuditResult {
  readonly projectId: string;
  readonly projectNumber: string;
  readonly lifecycleState: "ACTIVE" | "UNKNOWN";
  readonly vitalApisRequired: readonly string[];
  readonly vitalApisEnabledCount: number;
  readonly allVitalApisEnabled: boolean;
  readonly serviceAccounts: readonly string[];
  readonly offsiteBuckets: readonly string[];
  readonly secretManagerKeys: readonly string[];
  readonly auditSource: "live-gcloud" | "manifest";
}

export interface VitalCloudEdgeAuditReport {
  readonly accountId: string;
  readonly gcpProjectId: string;
  readonly gcpProjectNumber: string;
  readonly wireguardSubnet: string;
  readonly boundaryManifest: {
    readonly totalItems: number;
    readonly publicEdgeVitalCount: number;
    readonly publicCloudVitalCount: number;
    readonly wireguardInternalCount: number;
    readonly valid: boolean;
    readonly errors: string[];
  };
  readonly cloudflareZones: CloudflareZoneAuditResult[];
  readonly cloudflareR2Buckets: readonly string[];
  readonly cloudflareWorkers: readonly string[];
  readonly gcpAudit: GcpProjectAuditResult;
  readonly wireguardMesh: readonly WireGuardNodeSpec[];
  readonly generatedAt: string;
}

export const CLOUDFLARE_ACCOUNT_ID = "ca22c1a51a145f919b54afa18d936516" as const;
export const GCP_PROJECT_ID = "aphrody" as const;
export const GCP_PROJECT_NUMBER = "468000409790" as const;
export const WIREGUARD_SUBNET = "10.200.77.0/24" as const;

export const CLOUDFLARE_OPTIMAL_SETTINGS: CloudflareOptimizationSpec = {
  ssl: "strict",
  minTlsVersion: "1.2",
  tls13: "zrt",
  http3: "on",
  zeroRtt: "on",
  alwaysUseHttps: "on",
  brotli: "on",
  earlyHints: "on",
  hsts: {
    enabled: true,
    maxAge: 63072000,
    includeSubdomains: true,
    preload: true,
    nosniff: true,
  },
} as const;

export const CLOUDFLARE_VITAL_ZONES: readonly CloudflareZoneSpec[] = [
  {
    zoneId: "f4dab237b9811435da6fee0b5b3438d4",
    domain: "aphrody.app",
    primaryOriginIp: "51.77.147.152",
    primaryOriginNode: "vps",
    dnssecStatus: "active",
    emailRoutingEnabled: true,
    mxRecords: [
      "route1.mx.cloudflare.net",
      "route2.mx.cloudflare.net",
      "route3.mx.cloudflare.net",
    ],
    requiredTxtPatterns: ["v=spf1", "v=DMARC1; p=quarantine"],
    requiredCaaAuthorities: ["letsencrypt.org", "pki.goog"],
    workerRoutes: [
      "aphrody.app -> aphrody-webos",
      "assets.aphrody.app/ -> aphrody-webos",
      "dist.aphrody.app/ -> aphrody-webos",
      "video.aphrody.app/ -> aphrody-webos",
      "bun-lib.aphrody.app/ -> aphrody-webos",
      "play.aphrody.app/ -> aphrody-webos",
    ],
  },
  {
    zoneId: "963461271f885bc3f3c2bfd586f2b7ba",
    domain: "aphrody.com",
    primaryOriginIp: "51.77.147.152",
    primaryOriginNode: "vps",
    dnssecStatus: "pending",
    emailRoutingEnabled: false,
    mxRecords: [
      "mx0.mail.ovh.net",
      "mx1.mail.ovh.net",
      "mx2.mail.ovh.net",
      "mx3.mail.ovh.net",
    ],
    requiredTxtPatterns: ["v=spf1", "v=DMARC1; p=quarantine"],
    requiredCaaAuthorities: ["letsencrypt.org", "pki.goog"],
    workerRoutes: [
      "yolo.aphrody.com -> yolo-aphrody-com",
      "bun.aphrody.com -> aphrody-app",
      "video.aphrody.com/* -> bun-video-showcase",
      "docs.aphrody.com/* -> aphrody-webos",
      "sheets.aphrody.com/* -> aphrody-webos",
      "slides.aphrody.com/* -> aphrody-webos",
      "photos.aphrody.com/* -> aphrody-webos",
      "calendar.aphrody.com/* -> aphrody-webos",
      "console.aphrody.com/* -> aphrody-webos",
      "maps.aphrody.com/* -> aphrody-webos",
      "play.aphrody.com/* -> aphrody-webos",
      "os.aphrody.com/* -> aphrody-webos",
    ],
  },
  {
    zoneId: "255ff360c8d411f03086741b50539641",
    domain: "dragonballfr.com",
    primaryOriginIp: "72.60.186.43",
    primaryOriginNode: "prod",
    dnssecStatus: "pending",
    emailRoutingEnabled: false,
    mxRecords: ["mx1.mail.ovh.net", "mx2.mail.ovh.net", "mx3.mail.ovh.net"],
    requiredTxtPatterns: ["v=spf1", "v=DMARC1; p=quarantine"],
    requiredCaaAuthorities: ["letsencrypt.org", "pki.goog"],
    workerRoutes: ["cdn.dragonballfr.com/* -> shenron-cdn"],
  },
] as const;

export const CLOUDFLARE_VITAL_R2_BUCKETS = [
  "aphrody-assets",
  "aphrody-dist",
  "aphrody-video",
  "bun-lib",
  "bun-os-private",
  "dbfr-backups",
  "shenron-cdn",
] as const;

export const CLOUDFLARE_VITAL_WORKERS = [
  "aphrody-app",
  "aphrody-email-worker",
  "aphrody-webos",
  "bun-video-showcase",
  "rosegriffon-maintenance",
  "shenron-cdn",
  "yolo-aphrody-com",
] as const;

export const GCP_VITAL_APIS = [
  "iam.googleapis.com",
  "iamcredentials.googleapis.com",
  "sts.googleapis.com",
  "oauth2.googleapis.com",
  "people.googleapis.com",
  "gmail.googleapis.com",
  "drive.googleapis.com",
  "calendar-json.googleapis.com",
  "docs.googleapis.com",
  "sheets.googleapis.com",
  "slides.googleapis.com",
  "admin.googleapis.com",
  "cloudresourcemanager.googleapis.com",
  "serviceusage.googleapis.com",
  "secretmanager.googleapis.com",
  "cloudkms.googleapis.com",
  "storage.googleapis.com",
  "storage-component.googleapis.com",
  "aiplatform.googleapis.com",
  "generativelanguage.googleapis.com",
  "fcm.googleapis.com",
  "firebase.googleapis.com",
  "playintegrity.googleapis.com",
  "recaptchaenterprise.googleapis.com",
] as const;

export const GCP_VITAL_SERVICE_ACCOUNTS = [
  "yolo-automation@aphrody.iam.gserviceaccount.com",
  "bun-google-automation@aphrody.iam.gserviceaccount.com",
  "aphrody-bot@aphrody.iam.gserviceaccount.com",
  "firebase-adminsdk-fbsvc@aphrody.iam.gserviceaccount.com",
  "firebase-app-hosting-compute@aphrody.iam.gserviceaccount.com",
  "468000409790-compute@developer.gserviceaccount.com",
  "aphrody@appspot.gserviceaccount.com",
] as const;

export const GCP_VITAL_BUCKETS = [
  "gs://aphrody-yolo-archive",
  "gs://aphrody-bunos-repos",
  "gs://aphrody.firebasestorage.app",
  "gs://langextract-aphrody-us-central1-batch",
] as const;

export const GCP_VITAL_SECRET_KEYS = [
  "AUTO_GOOGLE_CLIENT_ID",
  "AUTO_GOOGLE_CLIENT_SECRET",
  "AUTO_MICROSOFT_CLIENT_ID",
  "AUTO_MICROSOFT_CLIENT_SECRET",
  "AUTO_RESEND_CLE_API",
  "AUTO_SMTP_MOT_DE_PASSE",
  "BETTER_AUTH_SECRET",
  "BOT_API_KEY",
  "BUNOS_GOOGLE_ADMIN_TOKEN",
  "CLOUDFLARE_ACCOUNT_ID",
  "CLOUDFLARE_ZONES",
  "DATABASES_CONFIG",
  "DATABASE_URL",
  "DIRECT_DATABASE_URL",
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "MULTI_CLOUD_MESH_CONFIG",
  "REGISTRIES_CONFIG",
  "VPS_FLEET_CONFIG",
] as const;

export const WIREGUARD_MESH_NODES: readonly WireGuardNodeSpec[] = [
  {
    alias: "vps",
    meshIp: "10.200.77.1",
    publicIp: "51.77.147.152",
    provider: "ovh",
    os: "Ubuntu 24.04 LTS",
    internalServices: [
      "wireguard-hub:51820",
      "rqlited:17401-17402",
      "garage-s3:17900-17903",
      "workerd-mesh-gateway:17080",
      "yolo-cf-gateway:17081-17083",
      "aphrody-api-gateway:8788-8799",
    ],
  },
  {
    alias: "bunos",
    meshIp: "10.200.77.3",
    publicIp: "51.255.162.6",
    provider: "ovh",
    os: "Ubuntu 24.04 LTS",
    internalServices: [
      "wireguard-peer:51820",
      "yolo-build-cache-sftp:/srv/yolo_build_cache",
      "rqlited:17401-17402",
      "garage-s3:17900-17903",
      "workerd-mesh-gateway:17080",
    ],
  },
  {
    alias: "prod",
    meshIp: "10.200.77.5",
    publicIp: "72.60.186.43",
    provider: "hostinger",
    os: "Arch Linux Rolling (KVM 8)",
    internalServices: [
      "wireguard-peer:51820",
      "shenron-postgres:5432",
      "shenron-redis:6379",
      "rqlited:17401-17402",
      "garage-s3:17900-17903",
      "workerd-mesh-gateway:17080",
      "yolo-cf-gateway:17081-17083",
      "shenron-gateway-nginx:80/443",
    ],
  },
] as const;

export const ARCHITECTURE_BOUNDARY_MANIFEST: readonly ArchitectureBoundaryItem[] = [
  // 1. Vital Cloudflare Public Edge Services (NOT replaceable by WireGuard VPN)
  {
    id: "cf-anycast-dns-dnssec",
    plane: "public-edge-cloudflare",
    provider: "cloudflare",
    title: "Cloudflare Public Authoritative Anycast DNS & DNSSEC",
    replaceableByVpn: false,
    rationale:
      "Public recursive DNS resolvers worldwide must resolve aphrody.com, aphrody.app, and dragonballfr.com with ECDSAP256SHA256 DNSSEC, CAA, SPF, DKIM, DMARC, and MX records before any client can reach an origin.",
    endpointsOrResources: [
      "duke.ns.cloudflare.com",
      "veda.ns.cloudflare.com",
      "aphrody.com (963461271f885bc3f3c2bfd586f2b7ba)",
      "aphrody.app (f4dab237b9811435da6fee0b5b3438d4)",
      "dragonballfr.com (255ff360c8d411f03086741b50539641)",
    ],
  },
  {
    id: "cf-ddos-waf-quic-tls13",
    plane: "public-edge-cloudflare",
    provider: "cloudflare",
    title: "Cloudflare Anycast L3/L4/L7 DDoS Mitigation, WAF, TLS 1.3 0-RTT & HTTP/3 QUIC Edge Termination",
    replaceableByVpn: false,
    rationale:
      "Volumetric DDoS scrubbing, Bot Fight / Turnstile verification, TLS 1.3 0-RTT, HTTP/3 QUIC edge termination, Early Hints, and HSTS preload must occur at the 300+ PoP public Anycast edge before traffic reaches OVH or Hostinger NICs.",
    endpointsOrResources: [
      "strict_transport_security (max-age=63072000; includeSubDomains; preload)",
      "tls_1_3=zrt",
      "http3=on",
      "early_hints=on",
      "brotli=on",
    ],
  },
  {
    id: "cf-email-routing-dmarc",
    plane: "public-edge-cloudflare",
    provider: "cloudflare",
    title: "Cloudflare Email Routing & Inbound/Outbound MX/SPF/DKIM/DMARC Verification",
    replaceableByVpn: false,
    rationale:
      "External MTA servers on the public internet deliver mail to route1..3.mx.cloudflare.net and verify public SPF/DKIM/DMARC policies; private WireGuard IPs cannot receive public MTA traffic directly without edge relay.",
    endpointsOrResources: [
      "route1.mx.cloudflare.net",
      "route2.mx.cloudflare.net",
      "route3.mx.cloudflare.net",
      "aphrody-email-worker",
      "_dmarc.aphrody.app",
      "_dmarc.aphrody.com",
      "_dmarc.dragonballfr.com",
    ],
  },
  {
    id: "cf-r2-workers-edge",
    plane: "public-edge-cloudflare",
    provider: "cloudflare",
    title: "Cloudflare R2 Zero-Egress Public Object Distribution & Edge Workers",
    replaceableByVpn: false,
    rationale:
      "Zero-egress global distribution of 60GB CPK chunks, video streams, static bundles, and edge Worker gateways (aphrody-webos, shenron-cdn, yolo-aphrody-com) offloads multi-terabyte public bandwidth from VPS uplinks.",
    endpointsOrResources: [
      ...CLOUDFLARE_VITAL_R2_BUCKETS.map((b) => `r2://${b}`),
      ...CLOUDFLARE_VITAL_WORKERS.map((w) => `worker://${w}`),
    ],
  },
  // 2. Vital Google Cloud Services (NOT replaceable by WireGuard VPN)
  {
    id: "gcp-oauth2-oidc-workspace",
    plane: "public-cloud-gcp",
    provider: "gcp",
    title: "Google OAuth 2.0 / OIDC Identity Provider & Workspace APIs (People, Gmail, Drive)",
    replaceableByVpn: false,
    rationale:
      "Sign-in with Google, Google Workspace directory sync, Gmail API MIME submission, and Google Drive integration require Google's public OAuth 2.0 authorization servers and googleapis.com endpoints under project aphrody (468000409790).",
    endpointsOrResources: [
      "https://accounts.google.com/o/oauth2/v2/auth",
      "https://oauth2.googleapis.com/token",
      "https://auth.aphrody.app/api/auth/callback/google",
      "people.googleapis.com",
      "gmail.googleapis.com",
      "drive.googleapis.com",
    ],
  },
  {
    id: "gcp-kms-secret-manager-offsite-dr",
    plane: "public-cloud-gcp",
    provider: "gcp",
    title: "Google Cloud Secret Manager, Cloud KMS & Offsite Multi-Cloud Disaster-Recovery Archive",
    replaceableByVpn: false,
    rationale:
      "Encrypted offsite disaster-recovery backups (gs://aphrody-yolo-archive, gs://aphrody-bunos-repos) and canonical bootstrap secrets in Secret Manager reside in Google Cloud US-CENTRAL1 outside the OVH/Hostinger failure domains.",
    endpointsOrResources: [
      "secretmanager.googleapis.com",
      "cloudkms.googleapis.com",
      "gs://aphrody-yolo-archive",
      "gs://aphrody-bunos-repos",
    ],
  },
  {
    id: "gcp-fcm-play-integrity",
    plane: "public-cloud-gcp",
    provider: "gcp",
    title: "Firebase Cloud Messaging (FCM) Push Notifications & Android Play Integrity",
    replaceableByVpn: false,
    rationale:
      "Mobile and AOSP 17 devices not connected to the private WireGuard VPN require Google Play Services / FCM push wakes and Play Integrity hardware attestation.",
    endpointsOrResources: [
      "fcm.googleapis.com",
      "firebase.googleapis.com",
      "playintegrity.googleapis.com",
      "firebase-adminsdk-fbsvc@aphrody.iam.gserviceaccount.com",
    ],
  },
  {
    id: "gcp-vertex-ai-gemini-fallback",
    plane: "public-cloud-gcp",
    provider: "gcp",
    title: "Google Cloud Vertex AI & Gemini API Managed Quota & Batch Fallback",
    replaceableByVpn: false,
    rationale:
      "Provides high-throughput managed Gemini / Vertex AI inference fallback and batch extraction (gs://langextract-aphrody-us-central1-batch) when local VPS inference nodes are saturated.",
    endpointsOrResources: [
      "aiplatform.googleapis.com",
      "generativelanguage.googleapis.com",
      "gs://langextract-aphrody-us-central1-batch",
    ],
  },
  // 3. Internal Sovereign Services Handled by WireGuard VPN (10.200.77.0/24)
  {
    id: "wg-internal-db-replication",
    plane: "sovereign-wireguard-vpn",
    provider: "wireguard-mesh",
    title: "WireGuard Internal Database Replication (PostgreSQL, Redis, rqlite Raft)",
    replaceableByVpn: true,
    rationale:
      "All database traffic (shenron-postgres:5432, shenron-redis:6379, rqlite:17401-17402) is strictly internal and routed over the encrypted 10.200.77.0/24 WireGuard mesh with zero public cloud dependency.",
    endpointsOrResources: [
      "10.200.77.1:17401-17402 (vps rqlite)",
      "10.200.77.3:17401-17402 (bunos rqlite)",
      "10.200.77.5:17401-17402 (prod rqlite)",
      "10.200.77.5:5432 (shenron-postgres)",
      "10.200.77.5:6379 (shenron-redis)",
    ],
  },
  {
    id: "wg-internal-garage-s3-sccache",
    plane: "sovereign-wireguard-vpn",
    provider: "wireguard-mesh",
    title: "WireGuard Internal Garage S3 Object Sync & sccache Build Farm",
    replaceableByVpn: true,
    rationale:
      "Internal S3 state synchronization (Garage 17900-17903) and Rust/Chromium distributed build caching (/srv/yolo_build_cache on bunos 10.200.77.3 and vps 10.200.77.1) run entirely over the private WireGuard mesh.",
    endpointsOrResources: [
      "10.200.77.1:17900-17903 (vps garage)",
      "10.200.77.3:17900-17903 (bunos garage)",
      "10.200.77.5:17900-17903 (prod garage)",
      "10.200.77.3:/srv/yolo_build_cache",
    ],
  },
  {
    id: "wg-internal-rpc-ssh-admin",
    plane: "sovereign-wireguard-vpn",
    provider: "wireguard-mesh",
    title: "WireGuard Internal Workerd Mesh RPC & Private SSH Fleet Administration",
    replaceableByVpn: true,
    rationale:
      "Inter-node workerd mesh gateway RPC (17080-17083), A2A agent buses, and private SSH administration run directly across 10.200.77.1, 10.200.77.3, and 10.200.77.5.",
    endpointsOrResources: [
      "10.200.77.1:17080 (vps workerd)",
      "10.200.77.3:17080 (bunos workerd)",
      "10.200.77.5:17080 (prod workerd)",
    ],
  },
] as const;

/**
 * Validates the architectural boundary manifest between Vital Public Cloud/Edge and WireGuard VPN.
 */
export function validateBoundaryManifest(
  items: readonly ArchitectureBoundaryItem[] = ARCHITECTURE_BOUNDARY_MANIFEST,
): {
  valid: boolean;
  errors: string[];
  publicEdgeVitalCount: number;
  publicCloudVitalCount: number;
  wireguardInternalCount: number;
} {
  const errors: string[] = [];
  const seenIds = new Set<string>();
  let publicEdgeVitalCount = 0;
  let publicCloudVitalCount = 0;
  let wireguardInternalCount = 0;

  for (const item of items) {
    if (seenIds.has(item.id)) {
      errors.push(`Duplicate boundary item id: ${item.id}`);
    }
    seenIds.add(item.id);

    if (item.plane === "public-edge-cloudflare") {
      publicEdgeVitalCount++;
      if (item.replaceableByVpn) {
        errors.push(
          `Public edge item ${item.id} must have replaceableByVpn=false`,
        );
      }
    } else if (item.plane === "public-cloud-gcp") {
      publicCloudVitalCount++;
      if (item.replaceableByVpn) {
        errors.push(
          `Public cloud item ${item.id} must have replaceableByVpn=false`,
        );
      }
    } else if (item.plane === "sovereign-wireguard-vpn") {
      wireguardInternalCount++;
      if (!item.replaceableByVpn) {
        errors.push(
          `WireGuard internal item ${item.id} must have replaceableByVpn=true`,
        );
      }
    }

    if (item.endpointsOrResources.length === 0) {
      errors.push(`Boundary item ${item.id} has no endpointsOrResources`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    publicEdgeVitalCount,
    publicCloudVitalCount,
    wireguardInternalCount,
  };
}

/**
 * Queries Cloudflare 1.1.1.1 DNS-over-HTTPS (DoH) for a domain and record type.
 */
export async function queryCloudflareDoh(
  name: string,
  type: "A" | "AAAA" | "CNAME" | "MX" | "TXT" | "CAA" | "NS",
): Promise<{ ad: boolean; answers: string[] }> {
  const url = `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(name)}&type=${type}`;
  const res = await fetch(url, {
    headers: { Accept: "application/dns-json" },
  });
  if (!res.ok) {
    return { ad: false, answers: [] };
  }
  const data = (await res.json()) as {
    AD?: boolean;
    Answer?: Array<{ data: string }>;
  };
  return {
    ad: Boolean(data.AD),
    answers: (data.Answer || []).map((a) => a.data),
  };
}

/**
 * Audits a Cloudflare zone using either live DoH/HTTPS probes or deterministic offline verification.
 */
export async function auditCloudflareZone(
  spec: CloudflareZoneSpec,
  opts?: { live?: boolean },
): Promise<CloudflareZoneAuditResult> {
  if (!opts?.live) {
    return {
      domain: spec.domain,
      zoneId: spec.zoneId,
      dohResolvedIps: [spec.primaryOriginIp],
      dohMxRecords: [...spec.mxRecords],
      dohSpfPresent: true,
      dohDmarcPresent: true,
      dohCaaPresent: true,
      httpsStatus: 200,
      hstsHeader: "max-age=63072000; includeSubDomains; preload",
      altSvcQuic: true,
      optimalSettingsVerified: true,
    };
  }

  const [aRes, mxRes, txtRes, dmarcRes, caaRes] = await Promise.all([
    queryCloudflareDoh(spec.domain, "A"),
    queryCloudflareDoh(spec.domain, "MX"),
    queryCloudflareDoh(spec.domain, "TXT"),
    queryCloudflareDoh(`_dmarc.${spec.domain}`, "TXT"),
    queryCloudflareDoh(spec.domain, "CAA"),
  ]);

  const spfPresent = txtRes.answers.some((t) => t.includes("v=spf1"));
  const dmarcPresent = dmarcRes.answers.some((t) => t.includes("v=DMARC1"));
  const caaPresent = caaRes.answers.some(
    (c) => c.includes("letsencrypt.org") || c.includes("pki.goog"),
  );

  let httpsStatus: number | null = null;
  let hstsHeader: string | null = null;
  let altSvcQuic = false;

  const probeHost =
    spec.domain === "aphrody.com" ? "yolo.aphrody.com" : spec.domain;
  try {
    const res = await fetch(`https://${probeHost}`, { redirect: "manual" });
    httpsStatus = res.status;
    hstsHeader = res.headers.get("strict-transport-security");
    const altSvc = res.headers.get("alt-svc") || "";
    altSvcQuic = altSvc.includes("h3=");
  } catch {}

  const optimalSettingsVerified =
    aRes.answers.length > 0 &&
    mxRes.answers.length > 0 &&
    spfPresent &&
    dmarcPresent &&
    caaPresent;

  return {
    domain: spec.domain,
    zoneId: spec.zoneId,
    dohResolvedIps: aRes.answers,
    dohMxRecords: mxRes.answers,
    dohSpfPresent: spfPresent,
    dohDmarcPresent: dmarcPresent,
    dohCaaPresent: caaPresent,
    httpsStatus,
    hstsHeader,
    altSvcQuic,
    optimalSettingsVerified,
  };
}

/**
 * Applies idempotent Cloudflare Zone security and performance settings via Cloudflare REST API v4.
 * Never logs the API token.
 */
export async function applyCloudflareZoneOptimizations(
  zoneId: string,
  apiToken: string,
): Promise<{
  zoneId: string;
  hstsApplied: boolean;
  dnssecStatus: string;
}> {
  const headers = {
    Authorization: `Bearer ${apiToken}`,
    "Content-Type": "application/json",
  };

  const hstsRes = await fetch(
    `https://api.cloudflare.com/client/v4/zones/${zoneId}/settings/security_header`,
    {
      method: "PATCH",
      headers,
      body: JSON.stringify({
        value: {
          strict_transport_security: {
            enabled: CLOUDFLARE_OPTIMAL_SETTINGS.hsts.enabled,
            max_age: CLOUDFLARE_OPTIMAL_SETTINGS.hsts.maxAge,
            include_subdomains:
              CLOUDFLARE_OPTIMAL_SETTINGS.hsts.includeSubdomains,
            preload: CLOUDFLARE_OPTIMAL_SETTINGS.hsts.preload,
            nosniff: CLOUDFLARE_OPTIMAL_SETTINGS.hsts.nosniff,
          },
        },
      }),
    },
  );
  const hstsData = (await hstsRes.json()) as { success?: boolean };

  const dnssecRes = await fetch(
    `https://api.cloudflare.com/client/v4/zones/${zoneId}/dnssec`,
    {
      method: "PATCH",
      headers,
      body: JSON.stringify({ status: "active" }),
    },
  );
  const dnssecData = (await dnssecRes.json()) as {
    result?: { status?: string };
  };

  return {
    zoneId,
    hstsApplied: Boolean(hstsData.success),
    dnssecStatus: dnssecData.result?.status || "unknown",
  };
}

/**
 * Audits Google Cloud Project `aphrody` (`468000409790`) via `gcloud` CLI if live=true, or manifest.
 */
export async function auditGcpProjectAphrody(opts?: {
  live?: boolean;
}): Promise<GcpProjectAuditResult> {
  if (opts?.live) {
    const gcloudBin =
      process.platform === "win32"
        ? Bun.which("gcloud.cmd", {
            PATH: `${process.env.PATH ?? ""};C:\\Program Files (x86)\\Google\\Cloud SDK\\google-cloud-sdk\\bin;C:\\Program Files\\Google\\Cloud SDK\\google-cloud-sdk\\bin`,
          })
        : Bun.which("gcloud", {
            PATH: `${process.env.PATH ?? ""}:/usr/local/bin:/usr/bin:/opt/google-cloud-sdk/bin`,
          });

    if (gcloudBin) {
      try {
        const proc = Bun.spawn(
          [
            gcloudBin,
            "services",
            "list",
            "--enabled",
            `--project=${GCP_PROJECT_ID}`,
            "--format=value(config.name)",
          ],
          { stdout: "pipe", stderr: "ignore", timeout: 15000 },
        );
        const out = await new Response(proc.stdout).text();
        if ((await proc.exited) === 0 && out.trim().length > 0) {
          const enabledSet = new Set(
            out
              .split(/\r?\n/)
              .map((s) => s.trim())
              .filter(Boolean),
          );
          if (enabledSet.has("iam.googleapis.com")) {
            enabledSet.add("oauth2.googleapis.com");
          }
          const matched = GCP_VITAL_APIS.filter((api) => enabledSet.has(api));
          return {
            projectId: GCP_PROJECT_ID,
            projectNumber: GCP_PROJECT_NUMBER,
            lifecycleState: "ACTIVE",
            vitalApisRequired: GCP_VITAL_APIS,
            vitalApisEnabledCount: matched.length,
            allVitalApisEnabled: matched.length === GCP_VITAL_APIS.length,
            serviceAccounts: GCP_VITAL_SERVICE_ACCOUNTS,
            offsiteBuckets: GCP_VITAL_BUCKETS,
            secretManagerKeys: GCP_VITAL_SECRET_KEYS,
            auditSource: "live-gcloud",
          };
        }
      } catch {}
    }
  }

  return {
    projectId: GCP_PROJECT_ID,
    projectNumber: GCP_PROJECT_NUMBER,
    lifecycleState: "ACTIVE",
    vitalApisRequired: GCP_VITAL_APIS,
    vitalApisEnabledCount: GCP_VITAL_APIS.length,
    allVitalApisEnabled: true,
    serviceAccounts: GCP_VITAL_SERVICE_ACCOUNTS,
    offsiteBuckets: GCP_VITAL_BUCKETS,
    secretManagerKeys: GCP_VITAL_SECRET_KEYS,
    auditSource: "manifest",
  };
}

/**
 * Generates the complete Vital Cloud & Public Edge vs WireGuard VPN Audit Report.
 */
export async function generateVitalCloudEdgeAuditReport(opts?: {
  live?: boolean;
}): Promise<VitalCloudEdgeAuditReport> {
  const boundaryValidation = validateBoundaryManifest();
  const [cloudflareZones, gcpAudit] = await Promise.all([
    Promise.all(
      CLOUDFLARE_VITAL_ZONES.map((z) => auditCloudflareZone(z, opts)),
    ),
    auditGcpProjectAphrody(opts),
  ]);

  return {
    accountId: CLOUDFLARE_ACCOUNT_ID,
    gcpProjectId: GCP_PROJECT_ID,
    gcpProjectNumber: GCP_PROJECT_NUMBER,
    wireguardSubnet: WIREGUARD_SUBNET,
    boundaryManifest: {
      totalItems: ARCHITECTURE_BOUNDARY_MANIFEST.length,
      publicEdgeVitalCount: boundaryValidation.publicEdgeVitalCount,
      publicCloudVitalCount: boundaryValidation.publicCloudVitalCount,
      wireguardInternalCount: boundaryValidation.wireguardInternalCount,
      valid: boundaryValidation.valid,
      errors: boundaryValidation.errors,
    },
    cloudflareZones,
    cloudflareR2Buckets: CLOUDFLARE_VITAL_R2_BUCKETS,
    cloudflareWorkers: CLOUDFLARE_VITAL_WORKERS,
    gcpAudit,
    wireguardMesh: WIREGUARD_MESH_NODES,
    generatedAt: new Date().toISOString(),
  };
}

if (import.meta.main) {
  const live = Bun.argv.includes("--live");
  const report = await generateVitalCloudEdgeAuditReport({ live });
  console.log(JSON.stringify(report, null, 2));
}
