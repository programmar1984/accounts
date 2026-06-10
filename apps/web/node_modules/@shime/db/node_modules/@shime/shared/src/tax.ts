/** Tax rate in percent (10 = 10%, 8 = 8%, 0 = non-taxable). */
export type TaxRate = 0 | 8 | 10;

export type JctStatus = "EXEMPT" | "TAXABLE";

export type PriceBasis = "TAX_EXCLUSIVE" | "TAX_INCLUSIVE";

export type TaxRounding = "FLOOR" | "ROUND" | "CEIL";

export interface TaxSplit {
  exTax: number;
  tax: number;
  inclusive: number;
}

export interface TaxRateBucket {
  rate: TaxRate;
  exTaxSubtotal: number;
  taxAmount: number;
  inclusiveTotal: number;
}

export interface InvoiceTaxSummary {
  buckets: TaxRateBucket[];
  subtotalExTax: number;
  totalTax: number;
  totalAmount: number;
}

function applyRounding(value: number, rounding: TaxRounding): number {
  switch (rounding) {
    case "FLOOR":
      return Math.floor(value);
    case "CEIL":
      return Math.ceil(value);
    default:
      return Math.round(value);
  }
}

/** Compute tax from ex-tax amount. rate is percent (10 = 10%). */
export function computeTaxFromExTax(
  exTax: number,
  rate: TaxRate,
  rounding: TaxRounding
): number {
  if (rate === 0) return 0;
  return applyRounding((exTax * rate) / 100, rounding);
}

/** Compute ex-tax and tax from tax-inclusive amount. */
export function computeTaxFromInclusive(
  inclusive: number,
  rate: TaxRate,
  rounding: TaxRounding
): TaxSplit {
  if (rate === 0) {
    return { exTax: inclusive, tax: 0, inclusive };
  }
  const exTax = applyRounding((inclusive * 100) / (100 + rate), rounding);
  const tax = inclusive - exTax;
  return { exTax, tax, inclusive };
}

/** Split a line amount based on price basis and rate. */
export function splitLineAmount(
  amount: number,
  rate: TaxRate,
  basis: PriceBasis,
  rounding: TaxRounding
): TaxSplit {
  if (basis === "TAX_EXCLUSIVE") {
    const tax = computeTaxFromExTax(amount, rate, rounding);
    return { exTax: amount, tax, inclusive: amount + tax };
  }
  return computeTaxFromInclusive(amount, rate, rounding);
}

export interface LineTaxInput {
  quantity: number;
  unitPrice: number;
  taxRate: TaxRate;
}

/** Compute line ex-tax subtotal (qty × unit price; unit price per basis). */
export function computeLineExTax(
  line: LineTaxInput,
  basis: PriceBasis
): number {
  const gross = line.quantity * line.unitPrice;
  if (basis === "TAX_EXCLUSIVE") return gross;
  if (line.taxRate === 0) return gross;
  return applyRounding((gross * 100) / (100 + line.taxRate), "ROUND");
}

/**
 * Aggregate invoice/PO tax: sum ex-tax per rate bucket, round tax once per bucket.
 */
export function aggregateInvoiceTaxByRate(
  lines: LineTaxInput[],
  basis: PriceBasis,
  rounding: TaxRounding
): InvoiceTaxSummary {
  const bucketMap = new Map<TaxRate, number>();

  for (const line of lines) {
    const exTax = computeLineExTax(line, basis);
    bucketMap.set(line.taxRate, (bucketMap.get(line.taxRate) ?? 0) + exTax);
  }

  const buckets: TaxRateBucket[] = [];
  let subtotalExTax = 0;
  let totalTax = 0;

  const rates: TaxRate[] = [10, 8, 0];
  for (const rate of rates) {
    const exTaxSubtotal = bucketMap.get(rate) ?? 0;
    if (exTaxSubtotal === 0 && !bucketMap.has(rate)) continue;
    const taxAmount = computeTaxFromExTax(exTaxSubtotal, rate, rounding);
    const inclusiveTotal = exTaxSubtotal + taxAmount;
    buckets.push({ rate, exTaxSubtotal, taxAmount, inclusiveTotal });
    subtotalExTax += exTaxSubtotal;
    totalTax += taxAmount;
  }

  return {
    buckets,
    subtotalExTax,
    totalTax,
    totalAmount: subtotalExTax + totalTax,
  };
}

/** Parse tax rate from form value; returns null if invalid. */
export function parseTaxRate(value: unknown): TaxRate | null {
  const n = Number(value);
  if (n === 0 || n === 8 || n === 10) return n;
  return null;
}
