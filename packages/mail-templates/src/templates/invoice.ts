import { renderEmailBase } from "./base.js";

export interface InvoiceItem {
  description: string;
  period?: string;
  amountEur: number;
}

export interface InvoiceTemplateProps {
  email: string;
  invoiceId: string;
  invoiceDate: string;
  items: InvoiceItem[];
  vatRatePercent?: number;
  pdfUrl?: string;
}

export function renderInvoiceEmail(props: InvoiceTemplateProps): {
  html: string;
  text: string;
  subject: string;
} {
  const subject = `Invoice ${props.invoiceId} from Aphrody Labs`;
  const vatRate =
    props.vatRatePercent !== undefined ? props.vatRatePercent : 20;

  const subtotal = props.items.reduce((acc, item) => acc + item.amountEur, 0);
  const vatAmount = subtotal * (vatRate / 100);
  const total = subtotal + vatAmount;
  const pdfUrl =
    props.pdfUrl ||
    `https://aphrody.app/billing/invoices/${props.invoiceId}.pdf`;

  const itemsRows = props.items
    .map(
      (item) => `
    <tr class="table-row" style="border-bottom: 1px solid #E2E8F0;">
      <td style="padding: 10px 12px; font-size: 13px;">
        <strong>${item.description}</strong>
        ${item.period ? `<div style="font-size: 11px; color: #64748B;">${item.period}</div>` : ""}
      </td>
      <td style="padding: 10px 12px; font-size: 13px; text-align: right; font-family: monospace;">
        €${item.amountEur.toFixed(2)}
      </td>
    </tr>
  `,
    )
    .join("");

  const contentHtml = `
    <p style="margin-top: 0; font-size: 16px;">
      Thank you for your business. Here is the receipt for your Aphrody subscription and edge infrastructure usage.
    </p>

    <div style="margin: 20px 0; font-size: 13px; color: #475569;">
      <div>&bull; Invoice Number: <strong>${props.invoiceId}</strong></div>
      <div>&bull; Date: <strong>${props.invoiceDate}</strong></div>
      <div>&bull; Payment Status: <strong style="color: #16A34A;">Paid in Full</strong></div>
    </div>

    <div class="table-box" style="border: 1px solid #E2E8F0; border-radius: 10px; overflow: hidden; margin: 24px 0;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
        <tr class="table-header" style="background-color: #F8FAFC; border-bottom: 1px solid #E2E8F0;">
          <th style="padding: 10px 12px; font-size: 12px; text-align: left; text-transform: uppercase; color: #475569;">Description</th>
          <th style="padding: 10px 12px; font-size: 12px; text-align: right; text-transform: uppercase; color: #475569;">Amount</th>
        </tr>
        ${itemsRows}
        <tr style="border-top: 2px solid #CBD5E1;">
          <td style="padding: 8px 12px; font-size: 12px; color: #64748B; text-align: right;">Subtotal (HT):</td>
          <td style="padding: 8px 12px; font-size: 12px; text-align: right; font-family: monospace;">€${subtotal.toFixed(2)}</td>
        </tr>
        <tr>
          <td style="padding: 4px 12px; font-size: 12px; color: #64748B; text-align: right;">VAT (${vatRate}%):</td>
          <td style="padding: 4px 12px; font-size: 12px; text-align: right; font-family: monospace;">€${vatAmount.toFixed(2)}</td>
        </tr>
        <tr style="background-color: #F8FAFC;">
          <td style="padding: 12px; font-size: 14px; font-weight: 700; text-align: right; color: #0F172A;">Total Paid (TTC):</td>
          <td style="padding: 12px; font-size: 15px; font-weight: 800; text-align: right; color: #2563EB; font-family: monospace;">€${total.toFixed(2)}</td>
        </tr>
      </table>
    </div>

    <p style="font-size: 12px; color: #64748B;">
      Aphrody Labs SAS &bull; TVA Intra: FR918827892 &bull; Siret: 918 827 892 00018 &bull; Registered in France.
    </p>
  `;

  const html = renderEmailBase({
    previewText: `Receipt for Aphrody Invoice ${props.invoiceId}: €${total.toFixed(2)} paid.`,
    title: `Invoice ${props.invoiceId}`,
    badge: { text: "Payment Receipt", variant: "success" },
    contentHtml,
    cta: {
      label: "Download PDF Receipt",
      url: pdfUrl,
      variant: "primary",
    },
    secondaryLinks: [
      { label: "Billing Portal", url: "https://aphrody.app/billing" },
      {
        label: "Manage Payment Methods",
        url: "https://aphrody.app/billing/payment-methods",
      },
    ],
    recipientEmail: props.email,
  });

  const text = `Invoice ${props.invoiceId} - Aphrody Labs

Date: ${props.invoiceDate}
Status: Paid in Full
Total: €${total.toFixed(2)} (Subtotal: €${subtotal.toFixed(2)}, VAT: €${vatAmount.toFixed(2)})

Download receipt: ${pdfUrl}
Aphrody Labs SAS - TVA Intra: FR918827892`;

  return { html, text, subject };
}
