// SPDX-License-Identifier: Apache-2.0
import { describe, expect, test } from "bun:test";
import {
  ARCHITECTURE_BOUNDARY_MANIFEST,
  CLOUDFLARE_ACCOUNT_ID,
  CLOUDFLARE_OPTIMAL_SETTINGS,
  CLOUDFLARE_VITAL_R2_BUCKETS,
  CLOUDFLARE_VITAL_WORKERS,
  CLOUDFLARE_VITAL_ZONES,
  GCP_PROJECT_ID,
  GCP_PROJECT_NUMBER,
  GCP_VITAL_APIS,
  GCP_VITAL_BUCKETS,
  GCP_VITAL_SECRET_KEYS,
  GCP_VITAL_SERVICE_ACCOUNTS,
  WIREGUARD_MESH_NODES,
  WIREGUARD_SUBNET,
  auditCloudflareZone,
  auditGcpProjectAphrody,
  createUnifiedBackendApp,
  generateVitalCloudEdgeAuditReport,
  validateBoundaryManifest,
} from "../src/index.js";

describe("Vital Cloud & Public Edge vs Sovereign WireGuard VPN Boundary", () => {
  test("validates canonical account IDs, project numbers, and WireGuard mesh topology", () => {
    expect(CLOUDFLARE_ACCOUNT_ID).toBe("ca22c1a51a145f919b54afa18d936516");
    expect(GCP_PROJECT_ID).toBe("aphrody");
    expect(GCP_PROJECT_NUMBER).toBe("468000409790");
    expect(WIREGUARD_SUBNET).toBe("10.200.77.0/24");

    expect(WIREGUARD_MESH_NODES.length).toBe(3);
    const vps = WIREGUARD_MESH_NODES.find((n) => n.alias === "vps");
    const bunos = WIREGUARD_MESH_NODES.find((n) => n.alias === "bunos");
    const prod = WIREGUARD_MESH_NODES.find((n) => n.alias === "prod");

    expect(vps?.meshIp).toBe("10.200.77.1");
    expect(vps?.publicIp).toBe("51.77.147.152");
    expect(bunos?.meshIp).toBe("10.200.77.3");
    expect(bunos?.publicIp).toBe("51.255.162.6");
    expect(prod?.meshIp).toBe("10.200.77.5");
    expect(prod?.publicIp).toBe("72.60.186.43");
  });

  test("enforces strict boundary between non-replaceable public edge/cloud and WireGuard internal services", () => {
    const validation = validateBoundaryManifest();
    expect(validation.valid).toBe(true);
    expect(validation.errors).toEqual([]);
    expect(validation.publicEdgeVitalCount).toBe(4);
    expect(validation.publicCloudVitalCount).toBe(4);
    expect(validation.wireguardInternalCount).toBe(3);

    for (const item of ARCHITECTURE_BOUNDARY_MANIFEST) {
      if (
        item.plane === "public-edge-cloudflare" ||
        item.plane === "public-cloud-gcp"
      ) {
        expect(item.replaceableByVpn).toBe(false);
      } else {
        expect(item.replaceableByVpn).toBe(true);
      }
    }
  });

  test("verifies Cloudflare optimal TLS 1.3, HTTP/3 QUIC, HSTS preload, R2, and Worker inventory", async () => {
    expect(CLOUDFLARE_OPTIMAL_SETTINGS.ssl).toBe("strict");
    expect(CLOUDFLARE_OPTIMAL_SETTINGS.tls13).toBe("zrt");
    expect(CLOUDFLARE_OPTIMAL_SETTINGS.http3).toBe("on");
    expect(CLOUDFLARE_OPTIMAL_SETTINGS.hsts.enabled).toBe(true);
    expect(CLOUDFLARE_OPTIMAL_SETTINGS.hsts.maxAge).toBe(63072000);
    expect(CLOUDFLARE_OPTIMAL_SETTINGS.hsts.includeSubdomains).toBe(true);
    expect(CLOUDFLARE_OPTIMAL_SETTINGS.hsts.preload).toBe(true);

    expect(CLOUDFLARE_VITAL_ZONES.length).toBe(3);
    expect(CLOUDFLARE_VITAL_R2_BUCKETS).toContain("aphrody-assets");
    expect(CLOUDFLARE_VITAL_R2_BUCKETS).toContain("shenron-cdn");
    expect(CLOUDFLARE_VITAL_WORKERS).toContain("aphrody-webos");
    expect(CLOUDFLARE_VITAL_WORKERS).toContain("aphrody-email-worker");

    for (const zone of CLOUDFLARE_VITAL_ZONES) {
      const res = await auditCloudflareZone(zone, { live: false });
      expect(res.optimalSettingsVerified).toBe(true);
      expect(res.dohSpfPresent).toBe(true);
      expect(res.dohDmarcPresent).toBe(true);
      expect(res.dohCaaPresent).toBe(true);
    }
  });

  test("audits Google Cloud project aphrody vital APIs, service accounts, buckets, and secrets", async () => {
    const gcpAudit = await auditGcpProjectAphrody({ live: false });
    expect(gcpAudit.projectId).toBe("aphrody");
    expect(gcpAudit.projectNumber).toBe("468000409790");
    expect(gcpAudit.lifecycleState).toBe("ACTIVE");
    expect(gcpAudit.allVitalApisEnabled).toBe(true);
    expect(gcpAudit.vitalApisEnabledCount).toBe(GCP_VITAL_APIS.length);
    expect(gcpAudit.serviceAccounts).toEqual(GCP_VITAL_SERVICE_ACCOUNTS);
    expect(gcpAudit.offsiteBuckets).toEqual(GCP_VITAL_BUCKETS);
    expect(gcpAudit.secretManagerKeys).toEqual(GCP_VITAL_SECRET_KEYS);
  });

  test("exposes unified report generator and /api/cloud/vital-edge HTTP endpoint", async () => {
    const report = await generateVitalCloudEdgeAuditReport({ live: false });
    expect(report.accountId).toBe("ca22c1a51a145f919b54afa18d936516");
    expect(report.gcpProjectId).toBe("aphrody");
    expect(report.boundaryManifest.valid).toBe(true);
    expect(report.cloudflareZones.length).toBe(3);

    const app = createUnifiedBackendApp();
    const res = await app.request("/api/cloud/vital-edge");
    expect(res.status).toBe(200);
    const body = (await res.json()) as any;
    expect(body.accountId).toBe("ca22c1a51a145f919b54afa18d936516");
    expect(body.gcpProjectId).toBe("aphrody");
    expect(body.wireguardSubnet).toBe("10.200.77.0/24");
  });
});
