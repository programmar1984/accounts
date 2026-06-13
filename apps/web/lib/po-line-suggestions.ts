import { and, desc, eq, ne, notInArray } from "drizzle-orm";
import { db, purchaseOrderLines, purchaseOrders } from "@shime/db";

export type PoLineDescriptionSuggestion = {
  supplierId: string;
  description: string;
};

const EXCLUDED_PO_STATUSES = ["VOID", "CANCELLED"];

function dedupeSuggestions(
  rows: { supplierId: string; description: string }[]
): PoLineDescriptionSuggestion[] {
  const seen = new Set<string>();
  const result: PoLineDescriptionSuggestion[] = [];

  for (const row of rows) {
    const trimmed = row.description.trim();
    if (!trimmed) continue;
    const key = `${row.supplierId}|${trimmed.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push({ supplierId: row.supplierId, description: trimmed });
  }

  return result;
}

export async function getPoLineDescriptionSuggestions(): Promise<
  PoLineDescriptionSuggestion[]
> {
  const rows = await db
    .select({
      supplierId: purchaseOrders.supplierId,
      description: purchaseOrderLines.description,
    })
    .from(purchaseOrderLines)
    .innerJoin(
      purchaseOrders,
      eq(purchaseOrderLines.purchaseOrderId, purchaseOrders.id)
    )
    .where(notInArray(purchaseOrders.status, EXCLUDED_PO_STATUSES))
    .orderBy(desc(purchaseOrders.issueDate));

  return dedupeSuggestions(rows);
}

export async function getPoLineDescriptionsForSupplier(
  supplierId: string,
  excludePoId?: string
): Promise<string[]> {
  const conditions = [
    eq(purchaseOrders.supplierId, supplierId),
    notInArray(purchaseOrders.status, EXCLUDED_PO_STATUSES),
  ];
  if (excludePoId) {
    conditions.push(ne(purchaseOrders.id, excludePoId));
  }

  const rows = await db
    .select({
      supplierId: purchaseOrders.supplierId,
      description: purchaseOrderLines.description,
    })
    .from(purchaseOrderLines)
    .innerJoin(
      purchaseOrders,
      eq(purchaseOrderLines.purchaseOrderId, purchaseOrders.id)
    )
    .where(and(...conditions))
    .orderBy(desc(purchaseOrders.issueDate));

  return dedupeSuggestions(rows).map((s) => s.description);
}
