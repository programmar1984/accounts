import { and, gte, like, lt } from "drizzle-orm";
import { db } from "./client";
import { invoices, purchaseOrders } from "./schema";

export async function nextInvoiceNumber(year: number): Promise<string> {
  const prefix = `INV-${year}-`;
  const start = new Date(Date.UTC(year, 0, 1));
  const end = new Date(Date.UTC(year + 1, 0, 1));
  const existing = await db
    .select({ number: invoices.number })
    .from(invoices)
    .where(
      and(
        gte(invoices.issueDate, start),
        lt(invoices.issueDate, end),
        like(invoices.number, `${prefix}%`)
      )
    );
  let max = 0;
  for (const row of existing) {
    const seq = Number(row.number.slice(prefix.length));
    if (Number.isFinite(seq) && seq > max) max = seq;
  }
  return `${prefix}${String(max + 1).padStart(4, "0")}`;
}

export async function nextPurchaseOrderNumber(year: number): Promise<string> {
  const prefix = `PO-${year}-`;
  const start = new Date(Date.UTC(year, 0, 1));
  const end = new Date(Date.UTC(year + 1, 0, 1));
  const existing = await db
    .select({ number: purchaseOrders.number })
    .from(purchaseOrders)
    .where(
      and(
        gte(purchaseOrders.issueDate, start),
        lt(purchaseOrders.issueDate, end),
        like(purchaseOrders.number, `${prefix}%`)
      )
    );
  let max = 0;
  for (const row of existing) {
    const seq = Number(row.number.slice(prefix.length));
    if (Number.isFinite(seq) && seq > max) max = seq;
  }
  return `${prefix}${String(max + 1).padStart(4, "0")}`;
}
