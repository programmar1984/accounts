"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import {
  attachments,
  db,
  expenseLines,
  expenses,
  nextExpenseNumber,
  suppliers,
} from "@shime/db";
import {
  canPostExpense,
  canVoidExpense,
  computePaymentStatus,
  createId,
} from "@shime/shared";
import { requireUser } from "./auth";
import { getCompanySettings } from "./company-settings";
import { deleteUpload, isAllowedMimeType, MAX_FILE_SIZE, saveUpload } from "./files";
import { parseDocumentLines, summarizeDocumentLines } from "./tax-helpers";
import {
  extractReceiptFromImage,
  parseReceiptExpenseDate,
} from "./receipt-extract";
import {
  buildExpenseLinesFromReceipt,
  receiptHeaderDescription,
} from "./receipt-to-expense";

function parseExpenseDates(formData: FormData) {
  const dateStr = String(formData.get("expenseDate") ?? "");
  const dueStr = String(formData.get("dueDate") ?? "").trim();
  const expenseDate = new Date(`${dateStr}T00:00:00.000Z`);
  const dueDate = dueStr ? new Date(`${dueStr}T00:00:00.000Z`) : null;
  const valid = !Number.isNaN(expenseDate.getTime());
  return { valid, expenseDate, dueDate };
}

export async function createExpense(formData: FormData) {
  const session = await requireUser();
  const settings = await getCompanySettings();
  const supplierId = String(formData.get("supplierId") ?? "").trim() || null;
  const description = String(formData.get("description") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const { valid: datesOk, expenseDate, dueDate } = parseExpenseDates(formData);
  const lines = parseDocumentLines(formData, settings);

  if (!datesOk || lines.length === 0) {
    redirect("/expenses/new?error=required");
  }

  if (supplierId) {
    const supplier = await db.query.suppliers.findFirst({
      where: eq(suppliers.id, supplierId),
    });
    if (!supplier) redirect("/expenses/new?error=required");
  }

  const summary = summarizeDocumentLines(lines, settings);
  const year = expenseDate.getUTCFullYear();
  const number = await nextExpenseNumber(year);
  const expenseId = createId();

  await db.insert(expenses).values({
    id: expenseId,
    number,
    expenseDate,
    supplierId,
    description,
    notes,
    status: "DRAFT",
    subtotalExTax: summary.subtotalExTax,
    totalTax: summary.totalTax,
    totalAmount: summary.totalAmount,
    dueDate,
    createdById: session.userId,
  });

  await db.insert(expenseLines).values(
    lines.map((line, i) => ({
      id: createId(),
      expenseId,
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

  revalidatePath("/expenses");
  revalidatePath("/ledger");
  redirect(`/expenses/${expenseId}?saved=1`);
}

export async function scanReceiptAndCreateExpense(formData: FormData) {
  const session = await requireUser();
  const settings = await getCompanySettings();

  const file = formData.get("receipt");
  if (!(file instanceof File) || file.size === 0) {
    redirect("/expenses/new?error=scan_required");
  }
  if (!isAllowedMimeType(file.type)) {
    redirect("/expenses/new?error=scan_type");
  }
  if (file.size > MAX_FILE_SIZE) {
    redirect("/expenses/new?error=scan_size");
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  let extraction;
  try {
    extraction = await extractReceiptFromImage(buffer, file.type);
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    if (message === "LM_STUDIO_UNREACHABLE") {
      redirect("/expenses/new?error=scan_lmstudio");
    }
    if (message.startsWith("LM_STUDIO_ERROR")) {
      redirect("/expenses/new?error=scan_lmstudio");
    }
    if (message === "PARSE_FAILED" || message === "EMPTY_MODEL_RESPONSE") {
      redirect("/expenses/new?error=scan_parse");
    }
    redirect("/expenses/new?error=scan_ai");
  }

  const lines = buildExpenseLinesFromReceipt(extraction, settings);
  if (lines.length === 0) {
    redirect("/expenses/new?error=scan_empty");
  }

  const summary = summarizeDocumentLines(lines, settings);
  const expenseDate = parseReceiptExpenseDate(extraction.date);
  const year = expenseDate.getUTCFullYear();
  const number = await nextExpenseNumber(year);
  const expenseId = createId();
  const description = receiptHeaderDescription(extraction, extraction.category);
  const notes =
    extraction.confidence && extraction.confidence !== "high"
      ? `Receipt scan confidence: ${extraction.confidence}`
      : null;

  const saved = await saveUpload(file);

  await db.insert(expenses).values({
    id: expenseId,
    number,
    expenseDate,
    supplierId: null,
    description,
    category: extraction.category,
    notes,
    status: "DRAFT",
    subtotalExTax: summary.subtotalExTax,
    totalTax: summary.totalTax,
    totalAmount: summary.totalAmount,
    dueDate: null,
    createdById: session.userId,
  });

  await db.insert(expenseLines).values(
    lines.map((line, i) => ({
      id: createId(),
      expenseId,
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

  await db.insert(attachments).values({
    id: createId(),
    expenseId,
    transactionId: null,
    purchaseOrderId: null,
    serviceOrderId: null,
    ...saved,
    uploadedById: session.userId,
  });

  revalidatePath("/expenses");
  revalidatePath("/ledger");
  redirect(`/expenses/${expenseId}?scanned=1`);
}

export async function updateExpense(formData: FormData) {
  await requireUser();
  const settings = await getCompanySettings();
  const id = String(formData.get("id") ?? "");
  const supplierId = String(formData.get("supplierId") ?? "").trim() || null;
  const description = String(formData.get("description") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const { valid: datesOk, expenseDate, dueDate } = parseExpenseDates(formData);
  const lines = parseDocumentLines(formData, settings);

  const exp = await db.query.expenses.findFirst({ where: eq(expenses.id, id) });
  if (!exp || exp.status !== "DRAFT") redirect(`/expenses/${id}`);

  if (!datesOk || lines.length === 0) redirect(`/expenses/${id}?error=required`);

  const summary = summarizeDocumentLines(lines, settings);
  await db
    .update(expenses)
    .set({
      expenseDate,
      supplierId,
      description,
      notes,
      dueDate,
      subtotalExTax: summary.subtotalExTax,
      totalTax: summary.totalTax,
      totalAmount: summary.totalAmount,
      updatedAt: new Date(),
    })
    .where(eq(expenses.id, id));

  await db.delete(expenseLines).where(eq(expenseLines.expenseId, id));
  await db.insert(expenseLines).values(
    lines.map((line, i) => ({
      id: createId(),
      expenseId: id,
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

  revalidatePath("/expenses");
  revalidatePath("/ledger");
  redirect(`/expenses/${id}?saved=1`);
}

export async function postExpense(formData: FormData) {
  await requireUser();
  const id = String(formData.get("id") ?? "");
  const exp = await db.query.expenses.findFirst({ where: eq(expenses.id, id) });
  if (!exp || !canPostExpense(exp.status)) redirect(`/expenses/${id}`);

  await db
    .update(expenses)
    .set({ status: "POSTED", postedAt: new Date(), updatedAt: new Date() })
    .where(eq(expenses.id, id));

  revalidatePath("/expenses");
  revalidatePath("/ledger");
  revalidatePath("/");
  redirect(`/expenses/${id}?posted=1`);
}

export async function voidExpense(formData: FormData) {
  await requireUser();
  const id = String(formData.get("id") ?? "");
  const exp = await db.query.expenses.findFirst({ where: eq(expenses.id, id) });
  if (!exp || !canVoidExpense(exp.status)) redirect(`/expenses/${id}`);

  await db
    .update(expenses)
    .set({ status: "VOID", updatedAt: new Date() })
    .where(eq(expenses.id, id));

  revalidatePath("/expenses");
  revalidatePath("/ledger");
  revalidatePath("/");
  redirect(`/expenses/${id}`);
}

export async function recordExpensePayment(formData: FormData) {
  await requireUser();
  const id = String(formData.get("id") ?? "");
  const amountPaid = Math.round(Number(formData.get("amountPaid")));

  const exp = await db.query.expenses.findFirst({ where: eq(expenses.id, id) });
  if (
    !exp ||
    exp.status !== "POSTED" ||
    !Number.isFinite(amountPaid) ||
    amountPaid < 0 ||
    amountPaid > exp.totalAmount
  ) {
    redirect(`/expenses/${id}?error=payment`);
  }

  const paymentStatus = computePaymentStatus(exp.totalAmount, amountPaid);
  await db
    .update(expenses)
    .set({ amountPaid, paymentStatus, updatedAt: new Date() })
    .where(eq(expenses.id, id));

  revalidatePath(`/expenses/${id}`);
  revalidatePath("/ledger");
  redirect(`/expenses/${id}?payment=1`);
}

export async function addExpenseAttachments(formData: FormData) {
  const session = await requireUser();
  const expenseId = String(formData.get("expenseId") ?? "");

  const exp = await db.query.expenses.findFirst({ where: eq(expenses.id, expenseId) });
  if (!exp) redirect("/expenses");

  const files = formData
    .getAll("files")
    .filter((f): f is File => f instanceof File && f.size > 0);

  for (const file of files) {
    if (!isAllowedMimeType(file.type)) {
      redirect(`/expenses/${expenseId}?error=type`);
    }
    if (file.size > MAX_FILE_SIZE) {
      redirect(`/expenses/${expenseId}?error=size`);
    }
  }

  for (const file of files) {
    const saved = await saveUpload(file);
    await db.insert(attachments).values({
      id: createId(),
      expenseId,
      transactionId: null,
      purchaseOrderId: null,
      ...saved,
      uploadedById: session.userId,
    });
  }

  revalidatePath(`/expenses/${expenseId}`);
  redirect(`/expenses/${expenseId}`);
}

export async function deleteExpenseAttachment(formData: FormData) {
  await requireUser();
  const id = String(formData.get("id") ?? "");

  const attachment = await db.query.attachments.findFirst({
    where: eq(attachments.id, id),
  });
  if (!attachment || !attachment.expenseId) return;

  await db.delete(attachments).where(eq(attachments.id, id));
  await deleteUpload(attachment.storedName);

  revalidatePath(`/expenses/${attachment.expenseId}`);
  redirect(`/expenses/${attachment.expenseId}`);
}
