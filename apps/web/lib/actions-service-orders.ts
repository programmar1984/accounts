"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import {
  attachments,
  db,
  nextServiceOrderNumber,
  serviceOrderLines,
  serviceOrders,
  suppliers,
} from "@shime/db";
import {
  canCancelSvo,
  canPostSvo,
  canVoidSvo,
  computePaymentStatus,
  createId,
  parseServiceCategory,
} from "@shime/shared";
import { requireUser } from "./auth";
import { getCompanySettings } from "./company-settings";
import { deleteUpload, isAllowedMimeType, MAX_FILE_SIZE, saveUpload } from "./files";
import { parseDocumentLines, summarizeDocumentLines } from "./tax-helpers";

function parseSvoDates(formData: FormData) {
  const issueStr = String(formData.get("issueDate") ?? "");
  const dueStr = String(formData.get("dueDate") ?? "").trim();
  const issueDate = new Date(`${issueStr}T00:00:00.000Z`);
  const dueDate = dueStr ? new Date(`${dueStr}T00:00:00.000Z`) : null;
  const valid = !Number.isNaN(issueDate.getTime());
  return { valid, issueDate, dueDate };
}

export async function createServiceOrder(formData: FormData) {
  const session = await requireUser();
  const settings = await getCompanySettings();
  const supplierId = String(formData.get("supplierId") ?? "");
  const serviceCategory = parseServiceCategory(String(formData.get("serviceCategory") ?? ""));
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const { valid: datesOk, issueDate, dueDate } = parseSvoDates(formData);
  const lines = parseDocumentLines(formData, settings);

  if (!supplierId || !serviceCategory || !datesOk || lines.length === 0) {
    redirect("/service-orders/new?error=required");
  }

  const supplier = await db.query.suppliers.findFirst({
    where: eq(suppliers.id, supplierId),
  });
  if (!supplier) redirect("/service-orders/new?error=required");

  const summary = summarizeDocumentLines(lines, settings);
  const year = issueDate.getUTCFullYear();
  const number = await nextServiceOrderNumber(year);
  const svoId = createId();

  await db.insert(serviceOrders).values({
    id: svoId,
    number,
    supplierId,
    serviceCategory,
    status: "DRAFT",
    issueDate,
    dueDate,
    notes,
    subtotalExTax: summary.subtotalExTax,
    totalTax: summary.totalTax,
    totalAmount: summary.totalAmount,
    createdById: session.userId,
  });

  await db.insert(serviceOrderLines).values(
    lines.map((line, i) => ({
      id: createId(),
      serviceOrderId: svoId,
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

  revalidatePath("/service-orders");
  revalidatePath("/ledger");
  redirect(`/service-orders/${svoId}?saved=1`);
}

export async function updateServiceOrder(formData: FormData) {
  await requireUser();
  const settings = await getCompanySettings();
  const id = String(formData.get("id") ?? "");
  const serviceCategory = parseServiceCategory(String(formData.get("serviceCategory") ?? ""));
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const { valid: datesOk, issueDate, dueDate } = parseSvoDates(formData);
  const lines = parseDocumentLines(formData, settings);

  const svo = await db.query.serviceOrders.findFirst({
    where: eq(serviceOrders.id, id),
  });
  if (!svo || svo.status !== "DRAFT") redirect(`/service-orders/${id}`);

  if (!serviceCategory || !datesOk || lines.length === 0) {
    redirect(`/service-orders/${id}?error=required`);
  }

  const summary = summarizeDocumentLines(lines, settings);
  await db
    .update(serviceOrders)
    .set({
      serviceCategory,
      issueDate,
      dueDate,
      notes,
      subtotalExTax: summary.subtotalExTax,
      totalTax: summary.totalTax,
      totalAmount: summary.totalAmount,
      updatedAt: new Date(),
    })
    .where(eq(serviceOrders.id, id));

  await db.delete(serviceOrderLines).where(eq(serviceOrderLines.serviceOrderId, id));
  await db.insert(serviceOrderLines).values(
    lines.map((line, i) => ({
      id: createId(),
      serviceOrderId: id,
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

  revalidatePath("/service-orders");
  revalidatePath("/ledger");
  redirect(`/service-orders/${id}?saved=1`);
}

export async function postServiceOrder(formData: FormData) {
  await requireUser();
  const id = String(formData.get("id") ?? "");
  const svo = await db.query.serviceOrders.findFirst({
    where: eq(serviceOrders.id, id),
  });
  if (!svo || !canPostSvo(svo.status)) redirect(`/service-orders/${id}`);

  await db
    .update(serviceOrders)
    .set({ status: "POSTED", postedAt: new Date(), updatedAt: new Date() })
    .where(eq(serviceOrders.id, id));

  revalidatePath("/service-orders");
  revalidatePath("/ledger");
  revalidatePath("/");
  redirect(`/service-orders/${id}?posted=1`);
}

export async function voidServiceOrder(formData: FormData) {
  await requireUser();
  const id = String(formData.get("id") ?? "");
  const svo = await db.query.serviceOrders.findFirst({
    where: eq(serviceOrders.id, id),
  });
  if (!svo || !canVoidSvo(svo.status)) redirect(`/service-orders/${id}`);

  await db
    .update(serviceOrders)
    .set({ status: "VOID", updatedAt: new Date() })
    .where(eq(serviceOrders.id, id));

  revalidatePath("/service-orders");
  revalidatePath("/ledger");
  revalidatePath("/");
  redirect(`/service-orders/${id}`);
}

export async function cancelServiceOrder(formData: FormData) {
  await requireUser();
  const id = String(formData.get("id") ?? "");
  const svo = await db.query.serviceOrders.findFirst({
    where: eq(serviceOrders.id, id),
  });
  if (!svo || !canCancelSvo(svo.status)) redirect(`/service-orders/${id}`);

  await db
    .update(serviceOrders)
    .set({ status: "CANCELLED", updatedAt: new Date() })
    .where(eq(serviceOrders.id, id));

  revalidatePath("/service-orders");
  revalidatePath("/ledger");
  redirect(`/service-orders/${id}`);
}

export async function recordSvoPayment(formData: FormData) {
  await requireUser();
  const id = String(formData.get("id") ?? "");
  const amountPaid = Math.round(Number(formData.get("amountPaid")));

  const svo = await db.query.serviceOrders.findFirst({
    where: eq(serviceOrders.id, id),
  });
  if (
    !svo ||
    svo.status !== "POSTED" ||
    !Number.isFinite(amountPaid) ||
    amountPaid < 0 ||
    amountPaid > svo.totalAmount
  ) {
    redirect(`/service-orders/${id}?error=payment`);
  }

  const paymentStatus = computePaymentStatus(svo.totalAmount, amountPaid);
  await db
    .update(serviceOrders)
    .set({ amountPaid, paymentStatus, updatedAt: new Date() })
    .where(eq(serviceOrders.id, id));

  revalidatePath(`/service-orders/${id}`);
  revalidatePath("/ledger");
  redirect(`/service-orders/${id}?payment=1`);
}

export async function addServiceOrderAttachments(formData: FormData) {
  const session = await requireUser();
  const serviceOrderId = String(formData.get("serviceOrderId") ?? "");

  const svo = await db.query.serviceOrders.findFirst({
    where: eq(serviceOrders.id, serviceOrderId),
  });
  if (!svo) redirect("/service-orders");

  const files = formData
    .getAll("files")
    .filter((f): f is File => f instanceof File && f.size > 0);

  for (const file of files) {
    if (!isAllowedMimeType(file.type)) {
      redirect(`/service-orders/${serviceOrderId}?error=type`);
    }
    if (file.size > MAX_FILE_SIZE) {
      redirect(`/service-orders/${serviceOrderId}?error=size`);
    }
  }

  for (const file of files) {
    const saved = await saveUpload(file);
    await db.insert(attachments).values({
      id: createId(),
      serviceOrderId,
      purchaseOrderId: null,
      transactionId: null,
      expenseId: null,
      ...saved,
      uploadedById: session.userId,
    });
  }

  revalidatePath(`/service-orders/${serviceOrderId}`);
  redirect(`/service-orders/${serviceOrderId}`);
}

export async function deleteServiceOrderAttachment(formData: FormData) {
  await requireUser();
  const id = String(formData.get("id") ?? "");

  const attachment = await db.query.attachments.findFirst({
    where: eq(attachments.id, id),
  });
  if (!attachment || !attachment.serviceOrderId) return;

  await db.delete(attachments).where(eq(attachments.id, id));
  await deleteUpload(attachment.storedName);

  revalidatePath(`/service-orders/${attachment.serviceOrderId}`);
  redirect(`/service-orders/${attachment.serviceOrderId}`);
}
