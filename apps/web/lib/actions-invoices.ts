"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import {
  customers,
  db,
  invoiceLines,
  invoices,
  nextInvoiceNumber,
} from "@shime/db";
import { computePaymentStatus, createId } from "@shime/shared";
import { requireUser } from "./auth";
import { getCompanySettings } from "./company-settings";
import { generateInvoicePdf } from "./invoices/pdf";
import { deleteUpload } from "./files";
import { parseDocumentLines, summarizeDocumentLines } from "./tax-helpers";

function parseInvoiceDates(formData: FormData) {
  const issueStr = String(formData.get("issueDate") ?? "");
  const dueStr = String(formData.get("dueDate") ?? "");
  const issueDate = new Date(`${issueStr}T00:00:00.000Z`);
  const dueDate = new Date(`${dueStr}T00:00:00.000Z`);
  const valid =
    !Number.isNaN(issueDate.getTime()) && !Number.isNaN(dueDate.getTime());
  return { valid, issueDate, dueDate };
}

export async function createInvoice(formData: FormData) {
  const session = await requireUser();
  const settings = await getCompanySettings();
  const customerId = String(formData.get("customerId") ?? "");
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const { valid: datesOk, issueDate, dueDate } = parseInvoiceDates(formData);
  const lines = parseDocumentLines(formData, settings);

  if (!customerId || !datesOk || lines.length === 0) {
    redirect("/sales-orders/new?error=required");
  }

  const customer = await db.query.customers.findFirst({
    where: eq(customers.id, customerId),
  });
  if (!customer) redirect("/sales-orders/new?error=required");

  const summary = summarizeDocumentLines(lines, settings);
  const year = issueDate.getUTCFullYear();
  const number = await nextInvoiceNumber(year);
  const invoiceId = createId();

  await db.insert(invoices).values({
    id: invoiceId,
    number,
    customerId,
    status: "DRAFT",
    issueDate,
    dueDate,
    notes,
    subtotalExTax: summary.subtotalExTax,
    totalTax: summary.totalTax,
    totalAmount: summary.totalAmount,
    createdById: session.userId,
  });

  await db.insert(invoiceLines).values(
    lines.map((line, i) => ({
      id: createId(),
      invoiceId,
      description: line.description,
      quantity: line.quantity,
      unitPrice: line.unitPrice,
      lineTotal: line.lineTotal,
      taxRate: line.taxRate,
      taxAmount: line.taxAmount,
      lineTotalExTax: line.lineTotalExTax,
      sortOrder: i,
    }))
  );

  revalidatePath("/sales-orders");
  revalidatePath("/ledger");
  redirect(`/sales-orders/${invoiceId}?saved=1`);
}

export async function updateInvoice(formData: FormData) {
  await requireUser();
  const settings = await getCompanySettings();
  const id = String(formData.get("id") ?? "");
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const { valid: datesOk, issueDate, dueDate } = parseInvoiceDates(formData);
  const lines = parseDocumentLines(formData, settings);

  const inv = await db.query.invoices.findFirst({ where: eq(invoices.id, id) });
  if (!inv || inv.status !== "DRAFT") redirect(`/sales-orders/${id}`);

  if (!datesOk || lines.length === 0) redirect(`/sales-orders/${id}?error=required`);

  const summary = summarizeDocumentLines(lines, settings);
  await db.update(invoices).set({
    issueDate,
    dueDate,
    notes,
    subtotalExTax: summary.subtotalExTax,
    totalTax: summary.totalTax,
    totalAmount: summary.totalAmount,
    updatedAt: new Date(),
  }).where(eq(invoices.id, id));

  await db.delete(invoiceLines).where(eq(invoiceLines.invoiceId, id));
  await db.insert(invoiceLines).values(
    lines.map((line, i) => ({
      id: createId(),
      invoiceId: id,
      description: line.description,
      quantity: line.quantity,
      unitPrice: line.unitPrice,
      lineTotal: line.lineTotal,
      taxRate: line.taxRate,
      taxAmount: line.taxAmount,
      lineTotalExTax: line.lineTotalExTax,
      sortOrder: i,
    }))
  );

  revalidatePath("/sales-orders");
  revalidatePath("/ledger");
  redirect(`/sales-orders/${id}?saved=1`);
}

export async function issueInvoice(formData: FormData) {
  await requireUser();
  const settings = await getCompanySettings();
  const id = String(formData.get("id") ?? "");

  const inv = await db.query.invoices.findFirst({
    where: eq(invoices.id, id),
    with: { lines: true, customer: true },
  });
  if (!inv || inv.status !== "DRAFT") redirect(`/sales-orders/${id}`);

  if (inv.pdfStoredName) await deleteUpload(inv.pdfStoredName);

  const summary = summarizeDocumentLines(
    inv.lines.map((l) => ({
      description: l.description,
      quantity: l.quantity,
      unitPrice: l.unitPrice,
      taxRate: l.taxRate as 0 | 8 | 10,
      lineTotalExTax: l.lineTotalExTax,
      taxAmount: l.taxAmount,
      lineTotal: l.lineTotal,
    })),
    settings
  );

  const pdf = await generateInvoicePdf({
    number: inv.number,
    issueDate: inv.issueDate,
    dueDate: inv.dueDate,
    customerName: inv.customer.name,
    customerAddress: inv.customer.address,
    notes: inv.notes,
    companyName: settings.companyName,
    companyAddress: settings.companyAddress,
    registrationNumber: settings.invoiceRegistrationNumber,
    taxable: settings.jctStatus === "TAXABLE",
    lines: inv.lines.map((l) => ({
      description: l.description,
      quantity: l.quantity,
      unitPrice: l.unitPrice,
      lineTotal: l.lineTotal,
      taxRate: l.taxRate,
    })),
    subtotalExTax: summary.subtotalExTax,
    totalTax: summary.totalTax,
    totalAmount: summary.totalAmount,
    taxBuckets: summary.buckets,
  });

  await db
    .update(invoices)
    .set({
      status: "ISSUED",
      pdfStoredName: pdf.storedName,
      updatedAt: new Date(),
    })
    .where(eq(invoices.id, id));

  revalidatePath("/sales-orders");
  revalidatePath("/ledger");
  revalidatePath("/");
  redirect(`/sales-orders/${id}?issued=1`);
}

export async function voidInvoice(formData: FormData) {
  await requireUser();
  const id = String(formData.get("id") ?? "");
  const inv = await db.query.invoices.findFirst({ where: eq(invoices.id, id) });
  if (!inv || inv.status === "VOID") redirect(`/sales-orders/${id}`);

  await db
    .update(invoices)
    .set({ status: "VOID", updatedAt: new Date() })
    .where(eq(invoices.id, id));

  revalidatePath("/sales-orders");
  revalidatePath("/ledger");
  revalidatePath("/");
  redirect(`/sales-orders/${id}`);
}

export async function recordSoPayment(formData: FormData) {
  await requireUser();
  const id = String(formData.get("id") ?? "");
  const amountPaid = Math.round(Number(formData.get("amountPaid")));

  const inv = await db.query.invoices.findFirst({
    where: eq(invoices.id, id),
  });
  if (
    !inv ||
    inv.status !== "ISSUED" ||
    !Number.isFinite(amountPaid) ||
    amountPaid < 0 ||
    amountPaid > inv.totalAmount
  ) {
    redirect(`/sales-orders/${id}?error=payment`);
  }

  const paymentStatus = computePaymentStatus(inv.totalAmount, amountPaid);
  await db
    .update(invoices)
    .set({ amountPaid, paymentStatus, updatedAt: new Date() })
    .where(eq(invoices.id, id));

  revalidatePath(`/sales-orders/${id}`);
  revalidatePath("/ledger");
  redirect(`/sales-orders/${id}?payment=1`);
}
