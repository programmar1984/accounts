import { eq } from "drizzle-orm";
import { companySettings, db } from "@shime/db";
import type { JctStatus, PriceBasis, TaxRounding } from "@shime/shared";

export type CompanySettingsRow = {
  id: string;
  jctStatus: JctStatus;
  invoiceRegistrationNumber: string | null;
  companyName: string | null;
  companyAddress: string | null;
  defaultTaxRate: number;
  priceBasis: PriceBasis;
  taxRounding: TaxRounding;
};

const DEFAULTS: CompanySettingsRow = {
  id: "default",
  jctStatus: "EXEMPT",
  invoiceRegistrationNumber: null,
  companyName: null,
  companyAddress: null,
  defaultTaxRate: 10,
  priceBasis: "TAX_EXCLUSIVE",
  taxRounding: "FLOOR",
};

export async function getCompanySettings(): Promise<CompanySettingsRow> {
  const row = await db.query.companySettings.findFirst({
    where: eq(companySettings.id, "default"),
  });
  if (!row) return DEFAULTS;
  return {
    id: row.id,
    jctStatus: row.jctStatus as JctStatus,
    invoiceRegistrationNumber: row.invoiceRegistrationNumber,
    companyName: row.companyName,
    companyAddress: row.companyAddress,
    defaultTaxRate: row.defaultTaxRate,
    priceBasis: row.priceBasis as PriceBasis,
    taxRounding: row.taxRounding as TaxRounding,
  };
}

export function isTaxable(settings: CompanySettingsRow): boolean {
  return settings.jctStatus === "TAXABLE";
}
