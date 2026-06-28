import {
  computeLineExTax,
  mergeSmallReceiptLines,
  splitLineAmount,
  type ExpenseCategory,
  type TaxRate,
} from "@shime/shared";
import type { CompanySettingsRow } from "./company-settings";
import type { ParsedDocumentLine } from "./tax-helpers";
import type { ReceiptExtraction } from "./receipt-extract";
import { getReceiptMergeThreshold } from "./receipt-extract";

export function buildExpenseLinesFromReceipt(
  extraction: ReceiptExtraction,
  settings: CompanySettingsRow
): ParsedDocumentLine[] {
  const taxable = settings.jctStatus === "TAXABLE";
  const merged = mergeSmallReceiptLines(
    extraction.lines.map((line) => ({
      description: line.description,
      amount: line.amount,
      taxRate: (taxable ? line.taxRate : 0) as TaxRate,
    })),
    getReceiptMergeThreshold()
  );

  return merged.map((line) => {
    const taxRate: TaxRate = taxable ? line.taxRate : 0;
    const quantity = 1;
    let unitPrice = line.amount;
    let lineTotal = line.amount;

    if (taxable && settings.priceBasis === "TAX_EXCLUSIVE") {
      const split = splitLineAmount(
        line.amount,
        taxRate,
        "TAX_INCLUSIVE",
        settings.taxRounding
      );
      unitPrice = split.exTax;
      lineTotal = split.exTax;
    }

    const lineTotalExTax = taxable
      ? computeLineExTax({ quantity, unitPrice, taxRate }, settings.priceBasis)
      : line.amount;

    if (settings.priceBasis === "TAX_INCLUSIVE" || !taxable) {
      lineTotal = line.amount;
    }

    return {
      description: line.description,
      quantity,
      unitPrice,
      taxRate,
      lineTotalExTax,
      taxAmount: 0,
      lineTotal,
    };
  });
}

export function receiptHeaderDescription(
  extraction: ReceiptExtraction,
  category: ExpenseCategory
): string {
  if (extraction.vendor) return extraction.vendor;
  return category;
}
