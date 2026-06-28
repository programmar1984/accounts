import type { TaxRate } from "../tax";

export type RawReceiptLine = {
  description: string;
  amount: number;
  taxRate: TaxRate;
};

const DEFAULT_MERGE_THRESHOLD = 1000;

/** Merge lines at or below threshold within the same tax rate bucket. */
export function mergeSmallReceiptLines(
  lines: RawReceiptLine[],
  threshold = DEFAULT_MERGE_THRESHOLD
): RawReceiptLine[] {
  if (lines.length <= 1) return lines;

  const kept: RawReceiptLine[] = [];
  const smallByRate = new Map<TaxRate, RawReceiptLine[]>();

  for (const line of lines) {
    if (line.amount > threshold) {
      kept.push(line);
      continue;
    }
    const bucket = smallByRate.get(line.taxRate) ?? [];
    bucket.push(line);
    smallByRate.set(line.taxRate, bucket);
  }

  for (const [taxRate, bucket] of smallByRate) {
    if (bucket.length === 1) {
      kept.push(bucket[0]!);
      continue;
    }
    const total = bucket.reduce((sum, line) => sum + line.amount, 0);
    kept.push({
      description: `Misc (${bucket.length} items)`,
      amount: total,
      taxRate,
    });
  }

  return kept.sort((a, b) => b.amount - a.amount);
}
