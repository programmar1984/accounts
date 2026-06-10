"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { attachments, db, transactions, users } from "./db";
import { createSession, destroySession, requireAdmin, requireUser } from "./auth";
import { deleteUpload, isAllowedMimeType, MAX_FILE_SIZE, saveUpload } from "./files";
import { createId } from "./id";

// ---------- auth ----------

export async function login(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  const user = await db.query.users.findFirst({ where: eq(users.email, email) });
  if (!user || !user.active || !(await bcrypt.compare(password, user.passwordHash))) {
    redirect("/login?error=1");
  }

  await createSession({
    userId: user.id,
    role: user.role,
    name: user.name,
    email: user.email,
  });
  redirect("/");
}

export async function logout() {
  await destroySession();
  redirect("/login");
}

// ---------- transactions ----------

const TX_TYPES = new Set(["SALE", "PURCHASE", "EXPENSE"]);

function parseTransactionForm(formData: FormData) {
  const type = String(formData.get("type") ?? "");
  const dateStr = String(formData.get("date") ?? "");
  const counterparty = String(formData.get("counterparty") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const memo = String(formData.get("memo") ?? "").trim();
  const amount = Math.round(Number(formData.get("amount")));

  const date = new Date(`${dateStr}T00:00:00.000Z`);
  const valid =
    TX_TYPES.has(type) &&
    !Number.isNaN(date.getTime()) &&
    counterparty.length > 0 &&
    Number.isFinite(amount) &&
    amount > 0;

  return {
    valid,
    data: { type, date, counterparty, description, amount, memo: memo || null },
  };
}

async function saveAttachmentsFromForm(
  formData: FormData,
  transactionId: string,
  userId: string
): Promise<string | null> {
  const files = formData
    .getAll("files")
    .filter((f): f is File => f instanceof File && f.size > 0);

  for (const file of files) {
    if (!isAllowedMimeType(file.type)) return "type";
    if (file.size > MAX_FILE_SIZE) return "size";
  }

  for (const file of files) {
    const saved = await saveUpload(file);
    await db.insert(attachments).values({
      id: createId(),
      ...saved,
      transactionId,
      uploadedById: userId,
    });
  }
  return null;
}

export async function createTransaction(formData: FormData) {
  const session = await requireUser();
  const { valid, data } = parseTransactionForm(formData);
  if (!valid) redirect("/transactions/new?error=required");

  const [tx] = await db
    .insert(transactions)
    .values({ id: createId(), ...data, createdById: session.userId })
    .returning();

  const fileError = await saveAttachmentsFromForm(formData, tx.id, session.userId);
  revalidatePath("/transactions");
  revalidatePath("/");
  redirect(`/transactions/${tx.id}${fileError ? `?error=${fileError}` : "?saved=1"}`);
}

export async function updateTransaction(formData: FormData) {
  await requireUser();
  const id = String(formData.get("id") ?? "");
  const { valid, data } = parseTransactionForm(formData);
  if (!valid) redirect(`/transactions/${id}?error=required`);

  await db
    .update(transactions)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(transactions.id, id));
  revalidatePath("/transactions");
  revalidatePath("/");
  redirect(`/transactions/${id}?saved=1`);
}

export async function deleteTransaction(formData: FormData) {
  await requireUser();
  const id = String(formData.get("id") ?? "");

  const txAttachments = await db
    .select()
    .from(attachments)
    .where(eq(attachments.transactionId, id));
  await db.delete(transactions).where(eq(transactions.id, id));
  for (const attachment of txAttachments) {
    await deleteUpload(attachment.storedName);
  }

  revalidatePath("/transactions");
  revalidatePath("/");
  redirect("/transactions");
}

// ---------- attachments ----------

export async function addAttachments(formData: FormData) {
  const session = await requireUser();
  const transactionId = String(formData.get("transactionId") ?? "");

  const tx = await db.query.transactions.findFirst({
    where: eq(transactions.id, transactionId),
  });
  if (!tx) redirect("/transactions");

  const fileError = await saveAttachmentsFromForm(
    formData,
    transactionId,
    session.userId
  );
  revalidatePath(`/transactions/${transactionId}`);
  redirect(`/transactions/${transactionId}${fileError ? `?error=${fileError}` : ""}`);
}

export async function deleteAttachment(formData: FormData) {
  await requireUser();
  const id = String(formData.get("id") ?? "");

  const attachment = await db.query.attachments.findFirst({
    where: eq(attachments.id, id),
  });
  if (!attachment) return;

  await db.delete(attachments).where(eq(attachments.id, id));
  await deleteUpload(attachment.storedName);

  revalidatePath(`/transactions/${attachment.transactionId}`);
  redirect(`/transactions/${attachment.transactionId}`);
}

// ---------- users (admin) ----------

export async function createUser(formData: FormData) {
  await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const role = formData.get("role") === "ADMIN" ? "ADMIN" : "MEMBER";

  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  if (!name || !emailOk || password.length < 8) {
    redirect("/users?error=required");
  }

  const existing = await db.query.users.findFirst({ where: eq(users.email, email) });
  if (existing) redirect("/users?error=exists");

  const passwordHash = await bcrypt.hash(password, 10);
  await db.insert(users).values({ id: createId(), name, email, passwordHash, role });

  revalidatePath("/users");
  redirect("/users?created=1");
}

export async function setUserActive(formData: FormData) {
  const session = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const active = formData.get("active") === "true";

  if (id === session.userId) redirect("/users"); // cannot deactivate yourself

  await db.update(users).set({ active }).where(eq(users.id, id));
  revalidatePath("/users");
  redirect("/users");
}
