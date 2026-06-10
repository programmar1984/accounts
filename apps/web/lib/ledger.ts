import { and, eq, gte, lt, sum } from "drizzle-orm";
import { db, expenses, invoices, purchaseOrders } from "@shime/db";

export type LedgerDocType = "PO" | "SO" | "EXP";

export type LedgerEntry = {
  id: string;
  docType: LedgerDocType;
  number: string;
  date: Date;
  partyCode: string | null;
  partyName: string;
  totalAmount: number;
  totalTax: number;
  paymentStatus: string;
  href: string;
};

export async function fetchLedgerEntries(opts: {
  year: number;
  docType?: LedgerDocType;
  paymentStatus?: string;
  q?: string;
}): Promise<LedgerEntry[]> {
  const start = new Date(Date.UTC(opts.year, 0, 1));
  const end = new Date(Date.UTC(opts.year + 1, 0, 1));
  const entries: LedgerEntry[] = [];

  if (!opts.docType || opts.docType === "PO") {
    const pos = await db.query.purchaseOrders.findMany({
      where: and(
        eq(purchaseOrders.status, "POSTED"),
        gte(purchaseOrders.issueDate, start),
        lt(purchaseOrders.issueDate, end)
      ),
      with: { supplier: { columns: { name: true, code: true } } },
    });
    for (const po of pos) {
      entries.push({
        id: po.id,
        docType: "PO",
        number: po.number,
        date: po.issueDate,
        partyCode: po.supplier.code,
        partyName: po.supplier.name,
        totalAmount: po.totalAmount,
        totalTax: po.totalTax,
        paymentStatus: po.paymentStatus,
        href: `/purchase-orders/${po.id}`,
      });
    }
  }

  if (!opts.docType || opts.docType === "SO") {
    const sos = await db.query.invoices.findMany({
      where: and(
        eq(invoices.status, "ISSUED"),
        gte(invoices.issueDate, start),
        lt(invoices.issueDate, end)
      ),
      with: { customer: { columns: { name: true, code: true } } },
    });
    for (const so of sos) {
      entries.push({
        id: so.id,
        docType: "SO",
        number: so.number,
        date: so.issueDate,
        partyCode: so.customer.code,
        partyName: so.customer.name,
        totalAmount: so.totalAmount,
        totalTax: so.totalTax,
        paymentStatus: so.paymentStatus,
        href: `/sales-orders/${so.id}`,
      });
    }
  }

  if (!opts.docType || opts.docType === "EXP") {
    const exps = await db.query.expenses.findMany({
      where: and(
        eq(expenses.status, "POSTED"),
        gte(expenses.expenseDate, start),
        lt(expenses.expenseDate, end)
      ),
      with: { supplier: { columns: { name: true, code: true } } },
    });
    for (const exp of exps) {
      entries.push({
        id: exp.id,
        docType: "EXP",
        number: exp.number,
        date: exp.expenseDate,
        partyCode: exp.supplier?.code ?? null,
        partyName: exp.supplier?.name ?? (exp.description || "—"),
        totalAmount: exp.totalAmount,
        totalTax: exp.totalTax,
        paymentStatus: exp.paymentStatus,
        href: `/expenses/${exp.id}`,
      });
    }
  }

  let filtered = entries;
  if (opts.paymentStatus) {
    filtered = filtered.filter((e) => e.paymentStatus === opts.paymentStatus);
  }
  if (opts.q) {
    const q = opts.q.toLowerCase();
    filtered = filtered.filter(
      (e) =>
        e.number.toLowerCase().includes(q) ||
        e.partyName.toLowerCase().includes(q) ||
        (e.partyCode?.toLowerCase().includes(q) ?? false)
    );
  }

  filtered.sort((a, b) => b.date.getTime() - a.date.getTime());
  return filtered;
}

export async function sumLedgerTax(year: number) {
  const start = new Date(Date.UTC(year, 0, 1));
  const end = new Date(Date.UTC(year + 1, 0, 1));

  const [[soRow], [poRow], [expRow]] = await Promise.all([
    db
      .select({ total: sum(invoices.totalTax) })
      .from(invoices)
      .where(
        and(
          eq(invoices.status, "ISSUED"),
          gte(invoices.issueDate, start),
          lt(invoices.issueDate, end)
        )
      ),
    db
      .select({ total: sum(purchaseOrders.totalTax) })
      .from(purchaseOrders)
      .where(
        and(
          eq(purchaseOrders.status, "POSTED"),
          gte(purchaseOrders.issueDate, start),
          lt(purchaseOrders.issueDate, end)
        )
      ),
    db
      .select({ total: sum(expenses.totalTax) })
      .from(expenses)
      .where(
        and(
          eq(expenses.status, "POSTED"),
          gte(expenses.expenseDate, start),
          lt(expenses.expenseDate, end)
        )
      ),
  ]);

  const outputTax = Number(soRow?.total ?? 0);
  const inputTax = Number(poRow?.total ?? 0) + Number(expRow?.total ?? 0);

  return { outputTax, inputTax, netJct: outputTax - inputTax };
}

export async function sumLedgerAmounts(year: number) {
  const start = new Date(Date.UTC(year, 0, 1));
  const end = new Date(Date.UTC(year + 1, 0, 1));

  const [sales, purchases, expenseRows] = await Promise.all([
    db.query.invoices.findMany({
      where: and(
        eq(invoices.status, "ISSUED"),
        gte(invoices.issueDate, start),
        lt(invoices.issueDate, end)
      ),
      columns: { totalAmount: true },
    }),
    db.query.purchaseOrders.findMany({
      where: and(
        eq(purchaseOrders.status, "POSTED"),
        gte(purchaseOrders.issueDate, start),
        lt(purchaseOrders.issueDate, end)
      ),
      columns: { totalAmount: true },
    }),
    db.query.expenses.findMany({
      where: and(
        eq(expenses.status, "POSTED"),
        gte(expenses.expenseDate, start),
        lt(expenses.expenseDate, end)
      ),
      columns: { totalAmount: true },
    }),
  ]);

  const salesTotal = sales.reduce((s, r) => s + r.totalAmount, 0);
  const purchasesTotal = purchases.reduce((s, r) => s + r.totalAmount, 0);
  const expensesTotal = expenseRows.reduce((s, r) => s + r.totalAmount, 0);

  return {
    sales: salesTotal,
    purchases: purchasesTotal,
    expenses: expensesTotal,
    net: salesTotal - purchasesTotal - expensesTotal,
  };
}
