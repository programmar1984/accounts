import { writeFile, mkdir } from "fs/promises";
import path from "path";
import crypto from "crypto";
import PDFDocument from "pdfkit";
import { UPLOAD_DIR } from "@/lib/files";
import type { TaxRateBucket } from "@shime/shared";

type InvoicePdfInput = {
  number: string;
  issueDate: Date;
  dueDate: Date;
  customerName: string;
  customerAddress?: string | null;
  notes?: string | null;
  companyName?: string | null;
  companyAddress?: string | null;
  registrationNumber?: string | null;
  taxable?: boolean;
  lines: {
    description: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
    taxRate?: number;
  }[];
  subtotalExTax: number;
  totalTax: number;
  totalAmount: number;
  taxBuckets?: TaxRateBucket[];
};

export async function generateInvoicePdf(
  input: InvoicePdfInput
): Promise<{ storedName: string; size: number }> {
  await mkdir(UPLOAD_DIR, { recursive: true });
  const storedName = `invoice-${crypto.randomUUID()}.pdf`;
  const filePath = path.join(UPLOAD_DIR, storedName);

  const doc = new PDFDocument({ margin: 50 });
  const chunks: Buffer[] = [];
  doc.on("data", (chunk: Buffer) => chunks.push(chunk));

  const done = new Promise<Buffer>((resolve, reject) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });

  if (input.companyName) {
    doc.fontSize(14).text(input.companyName);
    if (input.companyAddress) doc.fontSize(10).text(input.companyAddress);
    if (input.registrationNumber) {
      doc.fontSize(9).text(`登録番号: ${input.registrationNumber}`);
    }
    doc.moveDown();
  }

  doc.fontSize(20).text("INVOICE", { align: "right" });
  doc.moveDown();
  doc.fontSize(10).text(`Invoice #: ${input.number}`);
  doc.text(`Issue date: ${input.issueDate.toISOString().slice(0, 10)}`);
  doc.text(`Due date: ${input.dueDate.toISOString().slice(0, 10)}`);
  doc.moveDown();
  doc.fontSize(12).text("Bill to:");
  doc.fontSize(10).text(input.customerName);
  if (input.customerAddress) doc.text(input.customerAddress);
  doc.moveDown();

  const tableTop = doc.y;
  doc.fontSize(10).text("Description", 50, tableTop, { width: 220 });
  doc.text("Qty", 280, tableTop);
  doc.text("Unit", 320, tableTop);
  if (input.taxable) doc.text("Rate", 380, tableTop);
  doc.text("Total", 420, tableTop, { align: "right", width: 80 });
  doc.moveDown(0.5);
  doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
  doc.moveDown(0.5);

  for (const line of input.lines) {
    const y = doc.y;
    doc.text(line.description, 50, y, { width: 220 });
    doc.text(String(line.quantity), 280, y);
    doc.text(`¥${line.unitPrice.toLocaleString()}`, 320, y);
    if (input.taxable) {
      doc.text(`${line.taxRate ?? 10}%`, 380, y);
    }
    doc.text(`¥${line.lineTotal.toLocaleString()}`, 420, y, {
      align: "right",
      width: 80,
    });
    doc.moveDown();
  }

  doc.moveDown();
  if (input.taxable && input.taxBuckets && input.taxBuckets.length > 0) {
    doc.fontSize(10);
    for (const bucket of input.taxBuckets) {
      if (bucket.exTaxSubtotal === 0) continue;
      doc.text(
        `${bucket.rate}% 税抜小計: ¥${bucket.exTaxSubtotal.toLocaleString()}  消費税: ¥${bucket.taxAmount.toLocaleString()}`,
        { align: "right" }
      );
    }
    doc.text(`税抜合計: ¥${input.subtotalExTax.toLocaleString()}`, { align: "right" });
    doc.text(`消費税合計: ¥${input.totalTax.toLocaleString()}`, { align: "right" });
  }
  doc.fontSize(12).text(`税込合計: ¥${input.totalAmount.toLocaleString()}`, {
    align: "right",
  });

  if (input.notes) {
    doc.moveDown();
    doc.fontSize(10).text(`Notes: ${input.notes}`);
  }

  doc.end();
  const buffer = await done;
  await writeFile(filePath, buffer);
  return { storedName, size: buffer.length };
}
