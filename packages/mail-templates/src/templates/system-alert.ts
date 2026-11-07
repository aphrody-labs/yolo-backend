import { renderEmailBase } from "./base.js";

export interface SystemAlertTemplateProps {
  email: string;
  clusterEvent: string;
  nodeName: string;
  meshIp: string;
  status: "RESOLVED" | "CRITICAL" | "DEGRADED" | "FAILOVER_ACTIVATED";
  metrics?: {
    latencyMs?: number;
    rqliteRaftOk?: boolean;
    activeFallbacks?: string[];
  };
  details: string;
}

export function renderSystemAlertEmail(props: SystemAlertTemplateProps): {
  html: string;
  text: string;
  subject: string;
} {
  const isOk = props.status === "RESOLVED";
  const badgeVariant = isOk
    ? "success"
    : props.status === "CRITICAL"
      ? "danger"
      : "warning";
  const subject = `[${props.status}] Aphrody Mesh Gateway: ${props.clusterEvent}`;

  const contentHtml = `
    <p style="margin-top: 0; font-size: 16px;">
      An automated mesh convergence event was triggered on your autonomous infrastructure.
    </p>

    <div style="background-color: ${isOk ? "#ECFDF5" : "#FFFBEB"}; border: 1px solid ${isOk ? "#A7F3D0" : "#FDE68A"}; border-radius: 12px; padding: 18px 22px; margin: 24px 0;">
      <h3 style="margin-top: 0; margin-bottom: 12px; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em; color: ${isOk ? "#065F46" : "#92400E"};">
        Event Diagnostics
      </h3>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="font-size: 13px;">
        <tr>
          <td style="padding: 4px 0; color: #475569; width: 120px;">&bull; <strong>Node:</strong></td>
          <td style="padding: 4px 0; color: #0F172A; font-family: monospace;">${props.nodeName} (${props.meshIp})</td>
        </tr>
        <tr>
          <td style="padding: 4px 0; color: #475569;">&bull; <strong>Status:</strong></td>
          <td style="padding: 4px 0; font-weight: 700; color: ${isOk ? "#16A34A" : "#DC2626"};">${props.status}</td>
        </tr>
        ${
          props.metrics?.latencyMs !== undefined
            ? `
        <tr>
          <td style="padding: 4px 0; color: #475569;">&bull; <strong>Probe Latency:</strong></td>
          <td style="padding: 4px 0; color: #0F172A;">${props.metrics.latencyMs} ms</td>
        </tr>
        `
            : ""
        }
        ${
          props.metrics?.rqliteRaftOk !== undefined
            ? `
        <tr>
          <td style="padding: 4px 0; color: #475569;">&bull; <strong>Raft Consensus:</strong></td>
          <td style="padding: 4px 0; color: ${props.metrics.rqliteRaftOk ? "#16A34A" : "#DC2626"}; font-weight: 600;">
            ${props.metrics.rqliteRaftOk ? "SYNCHRONIZED" : "DESYNCHRONIZED"}
          </td>
        </tr>
        `
            : ""
        }
      </table>
    </div>

    <div style="font-size: 14px; line-height: 1.6; margin-bottom: 20px;">
      <strong>Details:</strong><br>
      ${props.details}
    </div>

    <p style="font-size: 12px; color: #64748B;">
      Failover mechanism automatically executed across WireGuard mesh (10.200.77.0/24) via workerd on port 17080. Zero human intervention was required.
    </p>
  `;

  const html = renderEmailBase({
    previewText: `[${props.status}] ${props.nodeName}: ${props.clusterEvent}`,
    title: props.clusterEvent,
    badge: { text: props.status, variant: badgeVariant },
    contentHtml,
    cta: {
      label: "Inspect Fleet Telemetry",
      url: "https://aphrody.app/fleet/telemetry",
      variant: isOk ? "primary" : "secondary",
    },
    secondaryLinks: [
      { label: "Mesh Status", url: "http://10.200.77.3:17080/_mesh/health" },
      { label: "Cloudflare D1 Metrics", url: "https://dash.cloudflare.com" },
    ],
    recipientEmail: props.email,
  });

  const text = `[${props.status}] Aphrody Mesh Gateway: ${props.clusterEvent}

Node: ${props.nodeName} (${props.meshIp})
Status: ${props.status}
Details: ${props.details}

Failover mechanism automatically executed across WireGuard mesh (10.200.77.0/24).
Aphrody Fleet Ops - ops@aphrody.app`;

  return { html, text, subject };
}
