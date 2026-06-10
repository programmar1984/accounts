"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import {
  attachments,
  db,
  nextPurchaseOrderNumber,
  purchaseOrderLines,
  purchaseOrders,
  suppliers,
} from "@shime/db";
import { canCancelPo, canPostPo, canVoidPo, computePaymentStatus, createId } from "@shime/shared";
import { requireUser } from "./auth";
import { getCompanySettings } from "./company-settings";
import { deleteUpload, isAllowedMimeType, MAX_FILE_SIZE, saveUpload } from "./files";
import { parseDocumentLines, summarizeDocumentLines } from "./tax-helpers";

function parsePoDates(formData: FormData) {
  const issueStr = String(formData.get("issueDate") ?? "");
  const dueStr = String(formData.get("dueDate") ?? "").trim();
  const issueDate = new Date(`${issueStr}T00:00:00.000Z`);
  const dueDate = dueStr ? new Date(`${dueStr}T00:00:00.000Z`) : null;
  const valid = !Number.isNaN(issueDate.getTime());
  return { valid, issueDate, dueDate };
}

export async function createPurchaseOrder(formData: FormData) {
  const session = await requireUser();
  const settings = await getCompanySettings();
  const supplierId = String(formData.get("supplierId") ?? "");
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const { valid: datesOk, issueDate, dueDate } = parsePoDates(formData);
  const lines = parseDocumentLines(formData, settings);

  if (!supplierId || !datesOk || lines.length === 0) {
    redirect("/purchase-orders/new?error=required");
  }

  const supplier = await db.query.suppliers.findFirst({
    where: eq(suppliers.id, supplierId),
  });
  if (!supplier) redirect("/purchase-orders/new?error=required");

  const summary = summarizeDocumentLines(lines, settings);
  const year = issueDate.getUTCFullYear();
  const number = await nextPurchaseOrderNumber(year);
  const poId = createId();

  await db.insert(purchaseOrders).values({
    id: poId,
    number,
    supplierId,
    status: "DRAFT",
    issueDate,
    dueDate,
    notes,
    subtotalExTax: summary.subtotalExTax,
    totalTax: summary.totalTax,
    totalAmount: summary.totalAmount,
    createdById: session.userId,
  });

  await db.insert(purchaseOrderLines).values(
    lines.map((line, i) => ({
      id: createId(),
      purchaseOrderId: poId,
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

  revalidatePath("/purchase-orders");
  revalidatePath("/ledger");
  redirect(`/purchase-orders/${poId}?saved=1`);
}

export async function updatePurchaseOrder(formData: FormData) {
  await requireUser();
  const settings = await getCompanySettings();
  const id = String(formData.get("id") ?? "");
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const { valid: datesOk, issueDate, dueDate } = parsePoDates(formData);
  const lines = parseDocumentLines(formData, settings);

  const po = await db.query.purchaseOrders.findFirst({
    where: eq(purchaseOrders.id, id),
  });
  if (!po || po.status !== "DRAFT") redirect(`/purchase-orders/${id}`);

  if (!datesOk || lines.length === 0) redirect(`/purchase-orders/${id}?error=required`);

  const summary = summarizeDocumentLines(lines, settings);
  await db
    .update(purchaseOrders)
    .set({
      issueDate,
      dueDate,
      notes,
      subtotalExTax: summary.subtotalExTax,
      totalTax: summary.totalTax,
      totalAmount: summary.totalAmount,
      updatedAt: new Date(),
    })
    .where(eq(purchaseOrders.id, id));

  await db.delete(purchaseOrderLines).where(eq(purchaseOrderLines.purchaseOrderId, id));
  await db.insert(purchaseOrderLines).values(
    lines.map((line, i) => ({
      id: createId(),
      purchaseOrderId: id,
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

  revalidatePath("/purchase-orders");
  revalidatePath("/ledger");
  redirect(`/purchase-orders/${id}?saved=1`);
}

export async function postPurchaseOrder(formData: FormData) {
  await requireUser();
  const id = String(formData.get("id") ?? "");
  const po = await db.query.purchaseOrders.findFirst({
    where: eq(purchaseOrders.id, id),
  });
  if (!po || !canPostPo(po.status)) redirect(`/purchase-orders/${id}`);

  await db
    .update(purchaseOrders)
    .set({ status: "POSTED", postedAt: new Date(), updatedAt: new Date() })
    .where(eq(purchaseOrders.id, id));

  revalidatePath("/purchase-orders");
  revalidatePath("/ledger");
  revalidatePath("/");
  redirect(`/purchase-orders/${id}?posted=1`);
}

export async function voidPurchaseOrder(formData: FormData) {
  await requireUser();
  const id = String(formData.get("id") ?? "");
  const po = await db.query.purchaseOrders.findFirst({
    where: eq(purchaseOrders.id, id),
  });
  if (!po || !canVoidPo(po.status)) redirect(`/purchase-orders/${id}`);

  await db
    .update(purchaseOrders)
    .set({ status: "VOID", updatedAt: new Date() })
    .where(eq(purchaseOrders.id, id));

  revalidatePath("/purchase-orders");
  revalidatePath("/ledger");
  revalidatePath("/");
  redirect(`/purchase-orders/${id}`);
}

export async function cancelPurchaseOrder(formData: FormData) {
  await requireUser();
  const id = String(formData.get("id") ?? "");
  const po = await db.query.purchaseOrders.findFirst({
    where: eq(purchaseOrders.id, id),
  });
  if (!po || !canCancelPo(po.status)) redirect(`/purchase-orders/${id}`);

  await db
    .update(purchaseOrders)
    .set({ status: "CANCELLED", updatedAt: new Date() })
    .where(eq(purchaseOrders.id, id));

  revalidatePath("/purchase-orders");
  revalidatePath("/ledger");
  redirect(`/purchase-orders/${id}`);
}

export async function recordPoPayment(formData: FormData) {
  await requireUser();
  const id = String(formData.get("id") ?? "");
  const amountPaid = Math.round(Number(formData.get("amountPaid")));

  const po = await db.query.purchaseOrders.findFirst({
    where: eq(purchaseOrders.id, id),
  });
  if (
    !po ||
    po.status !== "POSTED" ||
    !Number.isFinite(amountPaid) ||
    amountPaid < 0 ||
    amountPaid > po.totalAmount
  ) {
    redirect(`/purchase-orders/${id}?error=payment`);
  }

  const paymentStatus = computePaymentStatus(po.totalAmount, amountPaid);
  await db
    .update(purchaseOrders)
    .set({ amountPaid, paymentStatus, updatedAt: new Date() })
    .where(eq(purchaseOrders.id, id));

  revalidatePath(`/purchase-orders/${id}`);
  revalidatePath("/ledger");
  redirect(`/purchase-orders/${id}?payment=1`);
}

export async function addPurchaseOrderAttachments(formData: FormData) {
  const session = await requireUser();
  const purchaseOrderId = String(formData.get("purchaseOrderId") ?? "");

  const po = await db.query.purchaseOrders.findFirst({
    where: eq(purchaseOrders.id, purchaseOrderId),
  });
  if (!po) redirect("/purchase-orders");

  const files = formData
    .getAll("files")
    .filter((f): f is File => f instanceof File && f.size > 0);

  for (const file of files) {
    if (!isAllowedMimeType(file.type)) {
      redirect(`/purchase-orders/${purchaseOrderId}?error=type`);
    }
    if (file.size > MAX_FILE_SIZE) {
      redirect(`/purchase-orders/${purchaseOrderId}?error=size`);
    }
  }

  for (const file of files) {
    const saved = await saveUpload(file);
    await db.insert(attachments).values({
      id: createId(),
      purchaseOrderId,
      transactionId: null,
      expenseId: null,
      ...saved,
      uploadedById: session.userId,
    });
  }

  revalidatePath(`/purchase-orders/${purchaseOrderId}`);
  redirect(`/purchase-orders/${purchaseOrderId}`);
}

export async function deletePurchaseOrderAttachment(formData: FormData) {
  await requireUser();
  const id = String(formData.get("id") ?? "");

  const attachment = await db.query.attachments.findFirst({
    where: eq(attachments.id, id),
  });
  if (!attachment || !attachment.purchaseOrderId) return;

  await db.delete(attachments).where(eq(attachments.id, id));
  await deleteUpload(attachment.storedName);

  revalidatePath(`/purchase-orders/${attachment.purchaseOrderId}`);
  redirect(`/purchase-orders/${attachment.purchaseOrderId}`);
}
