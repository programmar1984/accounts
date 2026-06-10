import Link from "next/link";
import { and, desc, eq, gte, lt } from "drizzle-orm";
import { db, purchaseOrders, suppliers } from "@shime/db";
import { requireUser } from "@/lib/auth";
import { getT, type TKey } from "@/lib/i18n";
import { formatDate, formatYen } from "@shime/shared";

export default async function PurchaseOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; status?: string }>;
}) {
  await requireUser();
  const { t, lang } = await getT();
  const params = await searchParams;
  const year = Number(params.year) || new Date().getUTCFullYear();
  const status = params.status?.trim() || undefined;

  const conditions = [
    gte(purchaseOrders.issueDate, new Date(Date.UTC(year, 0, 1))),
    lt(purchaseOrders.issueDate, new Date(Date.UTC(year + 1, 0, 1))),
  ];
  if (status) conditions.push(eq(purchaseOrders.status, status));

  const list = await db.query.purchaseOrders.findMany({
    where: and(...conditions),
    orderBy: [desc(purchaseOrders.issueDate)],
    with: { supplier: { columns: { name: true } } },
  });

  const statuses = [
    "DRAFT",
    "SENT",
    "PARTIALLY_RECEIVED",
    "CLOSED",
    "CANCELLED",
  ] as const;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">{t("po.title")}</h1>
        <Link
          href="/purchase-orders/new"
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
        >
          + {t("po.new")}
        </Link>
      </div>

      <form
        method="GET"
        className="flex flex-wrap gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
      >
        <input
          type="number"
          name="year"
          defaultValue={year}
          className="w-24 rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <select
          name="status"
          defaultValue={status ?? ""}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="">{t("tx.allTypes")}</option>
          {statuses.map((s) => (
            <option key={s} value={s}>
              {t(`po.status.${s}` as TKey)}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-50"
        >
          {t("tx.filter")}
        </button>
      </form>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {list.length === 0 ? (
          <div className="px-5 py-12 text-center text-sm text-slate-500">{t("po.empty")}</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400">
                <th className="px-5 py-3">{t("po.number")}</th>
                <th className="px-3 py-3">{t("po.supplier")}</th>
                <th className="px-3 py-3">{t("po.issueDate")}</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-5 py-3 text-right">{t("inv.total")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {list.map((po) => (
                <tr key={po.id} className="hover:bg-slate-50">
                  <td className="px-5 py-3 font-medium">
                    <Link href={`/purchase-orders/${po.id}`} className="hover:underline">
                      {po.number}
                    </Link>
                  </td>
                  <td className="px-3 py-3">{po.supplier.name}</td>
                  <td className="px-3 py-3 tabular-nums text-slate-500">
                    {formatDate(po.issueDate, lang)}
                  </td>
                  <td className="px-3 py-3">{t(`po.status.${po.status}` as TKey)}</td>
                  <td className="px-5 py-3 text-right font-semibold tabular-nums">
                    {formatYen(po.totalAmount, lang)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
