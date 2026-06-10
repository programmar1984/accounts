import Link from "next/link";
import { and, asc, count, desc, eq, gte, lt, min, sum } from "drizzle-orm";
import { db, transactions } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { getT } from "@/lib/i18n";
import { formatDate, formatYen } from "@/lib/format";
import { TypeBadge } from "@/components/TypeBadge";
import type { TKey } from "@/lib/i18n";

function yearRange(year: number) {
  return and(
    gte(transactions.date, new Date(Date.UTC(year, 0, 1))),
    lt(transactions.date, new Date(Date.UTC(year + 1, 0, 1)))
  );
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>;
}) {
  await requireUser();
  const { t, lang } = await getT();

  const currentYear = new Date().getUTCFullYear();
  const params = await searchParams;
  const year = Number(params.year) || currentYear;
  const yearWhere = yearRange(year);

  const [grouped, [{ value: txCount }], recentRows, [oldest]] = await Promise.all([
    db
      .select({
        type: transactions.type,
        total: sum(transactions.amount),
      })
      .from(transactions)
      .where(yearWhere)
      .groupBy(transactions.type),
    db.select({ value: count() }).from(transactions).where(yearWhere),
    db.query.transactions.findMany({
      where: yearWhere,
      orderBy: [desc(transactions.date), desc(transactions.createdAt)],
      limit: 6,
      with: { attachments: { columns: { id: true } } },
    }),
    db.select({ minDate: min(transactions.date) }).from(transactions),
  ]);

  const recent = recentRows.map((tx) => ({
    ...tx,
    _count: { attachments: tx.attachments.length },
  }));

  const sums: Record<string, number> = {};
  for (const g of grouped) sums[g.type] = Number(g.total ?? 0);
  const sales = sums.SALE ?? 0;
  const purchases = sums.PURCHASE ?? 0;
  const expenses = sums.EXPENSE ?? 0;
  const net = sales - purchases - expenses;

  const firstYear = oldest.minDate?.getUTCFullYear() ?? currentYear;
  const years: number[] = [];
  for (let y = Math.max(firstYear, currentYear - 10); y <= currentYear + 1; y++) {
    years.push(y);
  }

  const cards: { label: TKey; value: number; accent: string }[] = [
    { label: "dashboard.sales", value: sales, accent: "text-emerald-700" },
    { label: "dashboard.purchases", value: purchases, accent: "text-sky-700" },
    { label: "dashboard.expenses", value: expenses, accent: "text-rose-700" },
    {
      label: "dashboard.net",
      value: net,
      accent: net >= 0 ? "text-slate-900" : "text-rose-700",
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">{t("dashboard.title")}</h1>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-slate-500">{t("dashboard.year")}:</span>
          <div className="flex gap-1">
            {years.map((y) => (
              <Link
                key={y}
                href={`/?year=${y}`}
                className={`rounded-lg px-3 py-1.5 font-medium ${
                  y === year
                    ? "bg-slate-900 text-white"
                    : "border border-slate-300 text-slate-600 hover:bg-slate-100"
                }`}
              >
                {y}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="text-sm text-slate-500">{t(card.label)}</div>
            <div className={`mt-1 text-2xl font-bold tabular-nums ${card.accent}`}>
              {formatYen(card.value, lang)}
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="font-semibold">
            {t("dashboard.recent")}{" "}
            <span className="ml-1 text-sm font-normal text-slate-400">
              {txCount} {t("dashboard.count")}
            </span>
          </h2>
          <Link
            href={`/transactions?year=${year}`}
            className="text-sm font-medium text-slate-600 underline-offset-2 hover:underline"
          >
            {t("dashboard.viewAll")} →
          </Link>
        </div>
        {recent.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-slate-500">
            {t("dashboard.empty")}{" "}
            <Link
              href="/transactions/new"
              className="font-medium text-slate-900 underline underline-offset-2"
            >
              {t("tx.new")}
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {recent.map((tx) => (
              <li key={tx.id}>
                <Link
                  href={`/transactions/${tx.id}`}
                  className="flex items-center gap-4 px-5 py-3 hover:bg-slate-50"
                >
                  <span className="w-24 shrink-0 text-sm tabular-nums text-slate-500">
                    {formatDate(tx.date, lang)}
                  </span>
                  <TypeBadge type={tx.type} label={t(`type.${tx.type}` as TKey)} />
                  <span className="min-w-0 flex-1 truncate text-sm">
                    <span className="font-medium">{tx.counterparty}</span>
                    {tx.description && (
                      <span className="text-slate-500"> — {tx.description}</span>
                    )}
                  </span>
                  {tx._count.attachments > 0 && (
                    <span className="text-xs text-slate-400">
                      📎{tx._count.attachments}
                    </span>
                  )}
                  <span className="text-sm font-semibold tabular-nums">
                    {formatYen(tx.amount, lang)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
