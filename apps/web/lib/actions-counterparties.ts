"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { customers, db, suppliers } from "@shime/db";
import { createId } from "@shime/shared";
import { requireUser } from "./auth";

function parsePartyForm(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const code = String(formData.get("code") ?? "").trim() || null;
  const email = String(formData.get("email") ?? "").trim() || null;
  const address = String(formData.get("address") ?? "").trim() || null;
  const phone = String(formData.get("phone") ?? "").trim() || null;
  const taxId = String(formData.get("taxId") ?? "").trim() || null;
  const paymentTermsDays = Math.round(
    Number(formData.get("paymentTermsDays") ?? 30)
  );
  const valid = name.length > 0 && paymentTermsDays >= 0;
  return {
    valid,
    data: { name, code, email, address, phone, taxId, paymentTermsDays },
  };
}

export async function createCustomer(formData: FormData) {
  await requireUser();
  const { valid, data } = parsePartyForm(formData);
  if (!valid) redirect("/customers?error=required");

  await db.insert(customers).values({ id: createId(), ...data });
  revalidatePath("/customers");
  redirect("/customers?created=1");
}

export async function updateCustomer(formData: FormData) {
  await requireUser();
  const id = String(formData.get("id") ?? "");
  const { valid, data } = parsePartyForm(formData);
  if (!valid) redirect(`/customers/${id}?error=required`);

  await db.update(customers).set(data).where(eq(customers.id, id));
  revalidatePath("/customers");
  redirect(`/customers/${id}?saved=1`);
}

export async function setCustomerActive(formData: FormData) {
  await requireUser();
  const id = String(formData.get("id") ?? "");
  const active = formData.get("active") === "true";
  await db.update(customers).set({ active }).where(eq(customers.id, id));
  revalidatePath("/customers");
  redirect("/customers");
}

export async function createSupplier(formData: FormData) {
  await requireUser();
  const { valid, data } = parsePartyForm(formData);
  if (!valid) redirect("/suppliers?error=required");

  await db.insert(suppliers).values({ id: createId(), ...data });
  revalidatePath("/suppliers");
  redirect("/suppliers?created=1");
}

export async function updateSupplier(formData: FormData) {
  await requireUser();
  const id = String(formData.get("id") ?? "");
  const { valid, data } = parsePartyForm(formData);
  if (!valid) redirect(`/suppliers/${id}?error=required`);

  await db.update(suppliers).set(data).where(eq(suppliers.id, id));
  revalidatePath("/suppliers");
  redirect(`/suppliers/${id}?saved=1`);
}

export async function setSupplierActive(formData: FormData) {
  await requireUser();
  const id = String(formData.get("id") ?? "");
  const active = formData.get("active") === "true";
  await db.update(suppliers).set({ active }).where(eq(suppliers.id, id));
  revalidatePath("/suppliers");
  redirect("/suppliers");
}
