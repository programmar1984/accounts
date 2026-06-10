import Link from "next/link";
import { and, desc, eq, gte, like, lt, min, or, sum } from "drizzle-orm";
import { db, transactions } from "@shime/db";
import { requireUser } from "@/lib/auth";
import { getT, type TKey } from "@/lib/i18n";
import { formatDate, formatYen } from "@shime/shared";
import { TypeBadge } from "@/components/TypeBadge";

const TYPES = ["SALE", "PURCHASE", "EXPENSE"] as const;

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; type?: string; q?: string }>;
}) {
  await requireUser();
  const { t, lang } = await getT();

  const params = await searchParams;
  const currentYear = new Date().getUTCFullYear();
  const year = Number(params.year) || currentYear;
  const type = TYPES.includes(params.type as (typeof TYPES)[number])
    ? params.type
    : undefined;
  const q = (params.q ?? "").trim();

  const conditions = [
    gte(transactions.date, new Date(Date.UTC(year, 0, 1))),
    lt(transactions.date, new Date(Date.UTC(year + 1, 0, 1))),
  ];
  if (type) conditions.push(eq(transactions.type, type));
  if (q) {
    conditions.push(
      or(
        like(transactions.counterparty, `%${q}%`),
        like(transactions.description, `%${q}%`),
        like(transactions.memo, `%${q}%`)
      )!
    );
  }
  const where = and(...conditions);

  const [transactionRows, [totals], [oldest]] = await Promise.all([
    db.query.transactions.findMany({
      where,
      orderBy: [desc(transactions.date), desc(transactions.createdAt)],
      with: { attachments: { columns: { id: true } } },
    }),
    db.select({ total: sum(transactions.amount) }).from(transactions).where(where),
    db.select({ minDate: min(transactions.date) }).from(transactions),
  ]);

  const transactionsList = transactionRows.map((tx) => ({
    ...tx,
    _count: { attachments: tx.attachments.length },
  }));

  const firstYear = oldest.minDate?.getUTCFullYear() ?? currentYear;
  const years: number[] = [];
  for (let y = currentYear + 1; y >= Math.min(firstYear, currentYear - 10); y--) {
    years.push(y);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">{t("tx.title")}</h1>
        <Link
          href="/transactions/new"
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
        >
          + {t("tx.new")}
        </Link>
      </div>

      <form
        method="GET"
        className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
      >
        <select
          name="year"
          defaultValue={year}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        >
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
        <select
          name="type"
          defaultValue={type ?? ""}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="">{t("tx.allTypes")}</option>
          {TYPES.map((ty) => (
            <option key={ty} value={ty}>
              {t(`type.${ty}` as TKey)}
            </option>
          ))}
        </select>
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder={t("tx.search")}
          className="min-w-52 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          {t("tx.filter")}
        </button>
      </form>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {transactionsList.length === 0 ? (
          <div className="px-5 py-12 text-center text-sm text-slate-500">
            {t("tx.empty")}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400">
                <th className="px-5 py-3 font-medium">{t("tx.date")}</th>
                <th className="px-3 py-3 font-medium">{t("tx.type")}</th>
                <th className="px-3 py-3 font-medium">{t("tx.counterparty")}</th>
                <th className="px-3 py-3 font-medium">{t("tx.description")}</th>
                <th className="px-3 py-3 text-center font-medium">📎</th>
                <th className="px-5 py-3 text-right font-medium">{t("tx.amount")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {transactionsList.map((tx) => (
                <tr key={tx.id} className="group hover:bg-slate-50">
                  <td className="px-5 py-3 tabular-nums text-slate-500">
                    <Link href={`/transactions/${tx.id}`} className="block">
                      {formatDate(tx.date, lang)}
                    </Link>
                  </td>
                  <td className="px-3 py-3">
                    <TypeBadge type={tx.type} label={t(`type.${tx.type}` as TKey)} />
                  </td>
                  <td className="px-3 py-3 font-medium">
                    <Link
                      href={`/transactions/${tx.id}`}
                      className="underline-offset-2 group-hover:underline"
                    >
                      {tx.counterparty}
                    </Link>
                  </td>
                  <td className="max-w-60 truncate px-3 py-3 text-slate-500">
                    {tx.description}
                  </td>
                  <td className="px-3 py-3 text-center text-xs text-slate-400">
                    {tx._count.attachments > 0 ? tx._count.attachments : ""}
                  </td>
                  <td className="px-5 py-3 text-right font-semibold tabular-nums">
                    {formatYen(tx.amount, lang)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-slate-200 bg-slate-50">
                <td colSpan={5} className="px-5 py-3 text-right text-slate-500">
                  {t("tx.total")} ({transactionsList.length})
                </td>
                <td className="px-5 py-3 text-right font-bold tabular-nums">
                  {formatYen(Number(totals.total ?? 0), lang)}
                </td>
              </tr>
            </tfoot>
          </table>
        )}
      </div>
    </div>
  );
}
