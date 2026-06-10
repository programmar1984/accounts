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
  transactions,
} from "@shime/db";
import { createId, lineTotal } from "@shime/shared";
import { requireUser } from "./auth";
import { generateInvoicePdf } from "./invoices/pdf";
import { deleteUpload } from "./files";

function parseLines(formData: FormData) {
  const descriptions = formData.getAll("line_description").map(String);
  const quantities = formData.getAll("line_quantity").map((v) => Math.round(Number(v)));
  const unitPrices = formData.getAll("line_unitPrice").map((v) => Math.round(Number(v)));
  const lines: { description: string; quantity: number; unitPrice: number; lineTotal: number }[] =
    [];
  for (let i = 0; i < descriptions.length; i++) {
    const description = descriptions[i].trim();
    const quantity = quantities[i];
    const unitPrice = unitPrices[i];
    if (!description || !Number.isFinite(quantity) || quantity <= 0) continue;
    if (!Number.isFinite(unitPrice) || unitPrice < 0) continue;
    lines.push({
      description,
      quantity,
      unitPrice,
      lineTotal: lineTotal(quantity, unitPrice),
    });
  }
  return lines;
}

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
  const customerId = String(formData.get("customerId") ?? "");
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const { valid: datesOk, issueDate, dueDate } = parseInvoiceDates(formData);
  const lines = parseLines(formData);

  if (!customerId || !datesOk || lines.length === 0) {
    redirect("/invoices/new?error=required");
  }

  const customer = await db.query.customers.findFirst({
    where: eq(customers.id, customerId),
  });
  if (!customer) redirect("/invoices/new?error=required");

  const year = issueDate.getUTCFullYear();
  const number = await nextInvoiceNumber(year);
  const totalAmount = lines.reduce((s, l) => s + l.lineTotal, 0);
  const invoiceId = createId();

  await db.insert(invoices).values({
    id: invoiceId,
    number,
    customerId,
    status: "DRAFT",
    issueDate,
    dueDate,
    notes,
    totalAmount,
    createdById: session.userId,
  });

  await db.insert(invoiceLines).values(
    lines.map((line, i) => ({
      id: createId(),
      invoiceId,
      ...line,
      sortOrder: i,
    }))
  );

  revalidatePath("/invoices");
  redirect(`/invoices/${invoiceId}?saved=1`);
}

export async function updateInvoice(formData: FormData) {
  await requireUser();
  const id = String(formData.get("id") ?? "");
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const { valid: datesOk, issueDate, dueDate } = parseInvoiceDates(formData);
  const lines = parseLines(formData);

  const inv = await db.query.invoices.findFirst({ where: eq(invoices.id, id) });
  if (!inv || inv.status !== "DRAFT") redirect(`/invoices/${id}`);

  if (!datesOk || lines.length === 0) redirect(`/invoices/${id}?error=required`);

  const totalAmount = lines.reduce((s, l) => s + l.lineTotal, 0);
  await db.update(invoices).set({
    issueDate,
    dueDate,
    notes,
    totalAmount,
    updatedAt: new Date(),
  }).where(eq(invoices.id, id));

  await db.delete(invoiceLines).where(eq(invoiceLines.invoiceId, id));
  await db.insert(invoiceLines).values(
    lines.map((line, i) => ({
      id: createId(),
      invoiceId: id,
      ...line,
      sortOrder: i,
    }))
  );

  revalidatePath("/invoices");
  redirect(`/invoices/${id}?saved=1`);
}

export async function issueInvoice(formData: FormData) {
  const session = await requireUser();
  const id = String(formData.get("id") ?? "");
  const createSale = formData.get("createSale") === "true";

  const inv = await db.query.invoices.findFirst({
    where: eq(invoices.id, id),
    with: { lines: true, customer: true },
  });
  if (!inv || inv.status !== "DRAFT") redirect(`/invoices/${id}`);

  if (inv.pdfStoredName) await deleteUpload(inv.pdfStoredName);

  const pdf = await generateInvoicePdf({
    number: inv.number,
    issueDate: inv.issueDate,
    dueDate: inv.dueDate,
    customerName: inv.customer.name,
    customerAddress: inv.customer.address,
    notes: inv.notes,
    lines: inv.lines.map((l) => ({
      description: l.description,
      quantity: l.quantity,
      unitPrice: l.unitPrice,
      lineTotal: l.lineTotal,
    })),
    totalAmount: inv.totalAmount,
  });

  let transactionId = inv.transactionId;
  if (createSale && !transactionId) {
    const txId = createId();
    await db.insert(transactions).values({
      id: txId,
      type: "SALE",
      date: inv.issueDate,
      counterparty: inv.customer.name,
      description: `Invoice ${inv.number}`,
      amount: inv.totalAmount,
      customerId: inv.customerId,
      dueDate: inv.dueDate,
      paymentStatus: "UNPAID",
      amountPaid: 0,
      invoiceId: id,
      createdById: session.userId,
    });
    transactionId = txId;
  }

  await db
    .update(invoices)
    .set({
      status: "ISSUED",
      pdfStoredName: pdf.storedName,
      transactionId,
      updatedAt: new Date(),
    })
    .where(eq(invoices.id, id));

  if (transactionId) {
    await db
      .update(transactions)
      .set({ invoiceId: id })
      .where(eq(transactions.id, transactionId));
  }

  revalidatePath("/invoices");
  revalidatePath("/transactions");
  revalidatePath("/");
  redirect(`/invoices/${id}?issued=1`);
}

export async function voidInvoice(formData: FormData) {
  await requireUser();
  const id = String(formData.get("id") ?? "");
  const inv = await db.query.invoices.findFirst({ where: eq(invoices.id, id) });
  if (!inv || inv.status === "VOID") redirect(`/invoices/${id}`);

  await db
    .update(invoices)
    .set({ status: "VOID", updatedAt: new Date() })
    .where(eq(invoices.id, id));

  revalidatePath("/invoices");
  redirect(`/invoices/${id}`);
}
