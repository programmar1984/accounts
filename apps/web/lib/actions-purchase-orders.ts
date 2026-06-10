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
  transactions,
} from "@shime/db";
import {
  canCancelPo,
  canReceivePo,
  canSendPo,
  computePoStatus,
  createId,
  lineTotal,
} from "@shime/shared";
import { requireUser } from "./auth";
import { deleteUpload, isAllowedMimeType, MAX_FILE_SIZE, saveUpload } from "./files";

function parsePoLines(formData: FormData) {
  const descriptions = formData.getAll("line_description").map(String);
  const quantities = formData.getAll("line_quantity").map((v) => Math.round(Number(v)));
  const unitPrices = formData.getAll("line_unitPrice").map((v) => Math.round(Number(v)));
  const lines: {
    description: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }[] = [];
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

export async function createPurchaseOrder(formData: FormData) {
  const session = await requireUser();
  const supplierId = String(formData.get("supplierId") ?? "");
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const issueStr = String(formData.get("issueDate") ?? "");
  const expectedStr = String(formData.get("expectedDate") ?? "");
  const issueDate = new Date(`${issueStr}T00:00:00.000Z`);
  const expectedDate = expectedStr
    ? new Date(`${expectedStr}T00:00:00.000Z`)
    : null;
  const lines = parsePoLines(formData);

  if (
    !supplierId ||
    Number.isNaN(issueDate.getTime()) ||
    lines.length === 0
  ) {
    redirect("/purchase-orders/new?error=required");
  }

  const supplier = await db.query.suppliers.findFirst({
    where: eq(suppliers.id, supplierId),
  });
  if (!supplier) redirect("/purchase-orders/new?error=required");

  const year = issueDate.getUTCFullYear();
  const number = await nextPurchaseOrderNumber(year);
  const totalAmount = lines.reduce((s, l) => s + l.lineTotal, 0);
  const poId = createId();

  await db.insert(purchaseOrders).values({
    id: poId,
    number,
    supplierId,
    status: "DRAFT",
    issueDate,
    expectedDate,
    notes,
    totalAmount,
    createdById: session.userId,
  });

  await db.insert(purchaseOrderLines).values(
    lines.map((line, i) => ({
      id: createId(),
      purchaseOrderId: poId,
      ...line,
      qtyReceived: 0,
      sortOrder: i,
    }))
  );

  revalidatePath("/purchase-orders");
  redirect(`/purchase-orders/${poId}?saved=1`);
}

export async function updatePurchaseOrder(formData: FormData) {
  await requireUser();
  const id = String(formData.get("id") ?? "");
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const expectedStr = String(formData.get("expectedDate") ?? "");
  const expectedDate = expectedStr
    ? new Date(`${expectedStr}T00:00:00.000Z`)
    : null;
  const lines = parsePoLines(formData);

  const po = await db.query.purchaseOrders.findFirst({
    where: eq(purchaseOrders.id, id),
  });
  if (!po || po.status !== "DRAFT") redirect(`/purchase-orders/${id}`);

  if (lines.length === 0) redirect(`/purchase-orders/${id}?error=required`);

  const totalAmount = lines.reduce((s, l) => s + l.lineTotal, 0);
  await db
    .update(purchaseOrders)
    .set({ expectedDate, notes, totalAmount, updatedAt: new Date() })
    .where(eq(purchaseOrders.id, id));

  await db.delete(purchaseOrderLines).where(eq(purchaseOrderLines.purchaseOrderId, id));
  await db.insert(purchaseOrderLines).values(
    lines.map((line, i) => ({
      id: createId(),
      purchaseOrderId: id,
      ...line,
      qtyReceived: 0,
      sortOrder: i,
    }))
  );

  revalidatePath("/purchase-orders");
  redirect(`/purchase-orders/${id}?saved=1`);
}

export async function sendPurchaseOrder(formData: FormData) {
  await requireUser();
  const id = String(formData.get("id") ?? "");
  const po = await db.query.purchaseOrders.findFirst({
    where: eq(purchaseOrders.id, id),
  });
  if (!po || !canSendPo(po.status)) redirect(`/purchase-orders/${id}`);

  await db
    .update(purchaseOrders)
    .set({ status: "SENT", updatedAt: new Date() })
    .where(eq(purchaseOrders.id, id));

  revalidatePath("/purchase-orders");
  redirect(`/purchase-orders/${id}?sent=1`);
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
  redirect(`/purchase-orders/${id}`);
}

export async function recordPurchaseOrderReceipt(formData: FormData) {
  const session = await requireUser();
  const id = String(formData.get("id") ?? "");
  const lineIds = formData.getAll("lineId").map(String);
  const receiveQtys = formData.getAll("receiveQty").map((v) => Math.round(Number(v)));

  const po = await db.query.purchaseOrders.findFirst({
    where: eq(purchaseOrders.id, id),
    with: { lines: true, supplier: true },
  });
  if (!po || !canReceivePo(po.status)) redirect(`/purchase-orders/${id}`);

  let receivedValue = 0;
  for (let i = 0; i < lineIds.length; i++) {
    const line = po.lines.find((l) => l.id === lineIds[i]);
    const qty = receiveQtys[i];
    if (!line || !Number.isFinite(qty) || qty <= 0) continue;
    const remaining = line.quantity - line.qtyReceived;
    const toReceive = Math.min(qty, remaining);
    if (toReceive <= 0) continue;

    await db
      .update(purchaseOrderLines)
      .set({ qtyReceived: line.qtyReceived + toReceive })
      .where(eq(purchaseOrderLines.id, line.id));

    receivedValue += toReceive * line.unitPrice;
    line.qtyReceived += toReceive;
  }

  if (receivedValue > 0) {
    const txId = createId();
    await db.insert(transactions).values({
      id: txId,
      type: "PURCHASE",
      date: new Date(),
      counterparty: po.supplier.name,
      description: `PO ${po.number} receipt`,
      amount: receivedValue,
      supplierId: po.supplierId,
      purchaseOrderId: po.id,
      paymentStatus: "UNPAID",
      amountPaid: 0,
      createdById: session.userId,
    });
  }

  const newStatus = computePoStatus(po.lines);
  await db
    .update(purchaseOrders)
    .set({ status: newStatus, updatedAt: new Date() })
    .where(eq(purchaseOrders.id, id));

  revalidatePath("/purchase-orders");
  revalidatePath("/transactions");
  revalidatePath("/");
  redirect(`/purchase-orders/${id}?received=1`);
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
