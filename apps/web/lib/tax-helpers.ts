import {
  aggregateInvoiceTaxByRate,
  computeLineExTax,
  parseTaxRate,
  splitLineAmount,
  type LineTaxInput,
  type PriceBasis,
  type TaxRate,
  type TaxRounding,
} from "@shime/shared";
import type { CompanySettingsRow } from "./company-settings";

export type ParsedDocumentLine = {
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: TaxRate;
  lineTotalExTax: number;
  taxAmount: number;
  lineTotal: number;
};

export function parseDocumentLines(
  formData: FormData,
  settings: CompanySettingsRow
): ParsedDocumentLine[] {
  const descriptions = formData.getAll("line_description").map(String);
  const quantities = formData
    .getAll("line_quantity")
    .map((v) => Math.round(Number(v)));
  const unitPrices = formData
    .getAll("line_unitPrice")
    .map((v) => Math.round(Number(v)));
  const taxRates = formData.getAll("line_taxRate").map((v) => parseTaxRate(v));

  const lines: ParsedDocumentLine[] = [];
  const taxable = settings.jctStatus === "TAXABLE";

  for (let i = 0; i < descriptions.length; i++) {
    const description = descriptions[i].trim();
    const quantity = quantities[i];
    const unitPrice = unitPrices[i];
    if (!description || !Number.isFinite(quantity) || quantity <= 0) continue;
    if (!Number.isFinite(unitPrice) || unitPrice < 0) continue;

    const taxRate: TaxRate = taxable
      ? (taxRates[i] ?? (settings.defaultTaxRate as TaxRate))
      : 0;

    const lineTotalExTax = taxable
      ? computeLineExTax({ quantity, unitPrice, taxRate }, settings.priceBasis)
      : quantity * unitPrice;

    const lineTotal =
      settings.priceBasis === "TAX_INCLUSIVE" || !taxable
        ? quantity * unitPrice
        : lineTotalExTax;

    lines.push({
      description,
      quantity,
      unitPrice,
      taxRate,
      lineTotalExTax,
      taxAmount: 0,
      lineTotal,
    });
  }

  return lines;
}

export function summarizeDocumentLines(
  lines: ParsedDocumentLine[],
  settings: CompanySettingsRow
) {
  if (settings.jctStatus !== "TAXABLE" || lines.length === 0) {
    const totalAmount = lines.reduce((s, l) => s + l.lineTotal, 0);
    return {
      subtotalExTax: totalAmount,
      totalTax: 0,
      totalAmount,
    };
  }

  const summary = aggregateInvoiceTaxByRate(
    lines.map((l) => ({
      quantity: l.quantity,
      unitPrice: l.unitPrice,
      taxRate: l.taxRate,
    })),
    settings.priceBasis,
    settings.taxRounding
  );

  return {
    subtotalExTax: summary.subtotalExTax,
    totalTax: summary.totalTax,
    totalAmount: summary.totalAmount,
    buckets: summary.buckets,
  };
}

export function computeTransactionTax(
  amount: number,
  taxRateRaw: unknown,
  settings: CompanySettingsRow
) {
  if (settings.jctStatus !== "TAXABLE") {
    return {
      taxRate: null as number | null,
      taxAmount: 0,
      amountExTax: amount,
      amount,
    };
  }

  const taxRate = parseTaxRate(taxRateRaw) ?? (settings.defaultTaxRate as TaxRate);
  const split = splitLineAmount(
    amount,
    taxRate,
    settings.priceBasis,
    settings.taxRounding
  );

  return {
    taxRate,
    taxAmount: split.tax,
    amountExTax: split.exTax,
    amount: split.inclusive,
  };
}
