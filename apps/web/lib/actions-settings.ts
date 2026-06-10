"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { companySettings, db } from "@shime/db";
import type { JctStatus, PriceBasis, TaxRounding } from "@shime/shared";
import { requireAdmin } from "./auth";

function parseSettingsForm(formData: FormData) {
  const jctStatus = formData.get("jctStatus") === "TAXABLE" ? "TAXABLE" : "EXEMPT";
  const invoiceRegistrationNumber =
    String(formData.get("invoiceRegistrationNumber") ?? "").trim() || null;
  const companyName = String(formData.get("companyName") ?? "").trim() || null;
  const companyAddress = String(formData.get("companyAddress") ?? "").trim() || null;
  const defaultTaxRate = Math.round(Number(formData.get("defaultTaxRate") ?? 10));
  const priceBasis =
    formData.get("priceBasis") === "TAX_INCLUSIVE" ? "TAX_INCLUSIVE" : "TAX_EXCLUSIVE";
  const taxRoundingRaw = String(formData.get("taxRounding") ?? "FLOOR");
  const taxRounding: TaxRounding =
    taxRoundingRaw === "ROUND" || taxRoundingRaw === "CEIL"
      ? taxRoundingRaw
      : "FLOOR";

  const validRate = defaultTaxRate === 8 || defaultTaxRate === 10;

  return {
    valid: validRate,
    data: {
      jctStatus: jctStatus as JctStatus,
      invoiceRegistrationNumber,
      companyName,
      companyAddress,
      defaultTaxRate: validRate ? defaultTaxRate : 10,
      priceBasis: priceBasis as PriceBasis,
      taxRounding,
    },
  };
}

export async function updateTaxSettings(formData: FormData) {
  await requireAdmin();
  const { valid, data } = parseSettingsForm(formData);
  if (!valid) redirect("/settings/tax?error=required");

  const existing = await db.query.companySettings.findFirst({
    where: eq(companySettings.id, "default"),
  });

  if (existing) {
    await db
      .update(companySettings)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(companySettings.id, "default"));
  } else {
    await db.insert(companySettings).values({ id: "default", ...data });
  }

  revalidatePath("/settings/tax");
  revalidatePath("/");
  revalidatePath("/transactions");
  revalidatePath("/invoices");
  revalidatePath("/purchase-orders");
  redirect("/settings/tax?saved=1");
}
