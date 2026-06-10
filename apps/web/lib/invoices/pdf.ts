import { writeFile, mkdir } from "fs/promises";
import path from "path";
import crypto from "crypto";
import PDFDocument from "pdfkit";
import { UPLOAD_DIR } from "@/lib/files";

type InvoicePdfInput = {
  number: string;
  issueDate: Date;
  dueDate: Date;
  customerName: string;
  customerAddress?: string | null;
  notes?: string | null;
  lines: { description: string; quantity: number; unitPrice: number; lineTotal: number }[];
  totalAmount: number;
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
  doc.fontSize(10).text("Description", 50, tableTop, { width: 250 });
  doc.text("Qty", 310, tableTop);
  doc.text("Unit", 350, tableTop);
  doc.text("Total", 420, tableTop, { align: "right", width: 80 });
  doc.moveDown(0.5);
  doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
  doc.moveDown(0.5);

  for (const line of input.lines) {
    const y = doc.y;
    doc.text(line.description, 50, y, { width: 250 });
    doc.text(String(line.quantity), 310, y);
    doc.text(`¥${line.unitPrice.toLocaleString()}`, 350, y);
    doc.text(`¥${line.lineTotal.toLocaleString()}`, 420, y, {
      align: "right",
      width: 80,
    });
    doc.moveDown();
  }

  doc.moveDown();
  doc.fontSize(12).text(`Total: ¥${input.totalAmount.toLocaleString()}`, {
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
