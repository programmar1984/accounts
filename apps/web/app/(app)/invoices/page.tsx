import Link from "next/link";
import { and, asc, desc, eq, gte, lt } from "drizzle-orm";
import { customers, db, invoices } from "@shime/db";
import { requireUser } from "@/lib/auth";
import { getT, type TKey } from "@/lib/i18n";
import { formatDate, formatYen } from "@shime/shared";

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; status?: string; customerId?: string }>;
}) {
  await requireUser();
  const { t, lang } = await getT();
  const params = await searchParams;
  const year = Number(params.year) || new Date().getUTCFullYear();
  const status = params.status?.trim() || undefined;
  const customerId = params.customerId?.trim() || undefined;

  const conditions = [
    gte(invoices.issueDate, new Date(Date.UTC(year, 0, 1))),
    lt(invoices.issueDate, new Date(Date.UTC(year + 1, 0, 1))),
  ];
  if (status) conditions.push(eq(invoices.status, status));
  if (customerId) conditions.push(eq(invoices.customerId, customerId));

  const [list, customerList] = await Promise.all([
    db.query.invoices.findMany({
      where: and(...conditions),
      orderBy: [desc(invoices.issueDate)],
      with: { customer: { columns: { name: true } } },
    }),
    db.query.customers.findMany({ orderBy: [asc(customers.name)] }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">{t("inv.title")}</h1>
        <Link
          href="/invoices/new"
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
        >
          + {t("inv.new")}
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
          {(["DRAFT", "ISSUED", "VOID"] as const).map((s) => (
            <option key={s} value={s}>
              {t(`inv.status.${s}` as TKey)}
            </option>
          ))}
        </select>
        <select
          name="customerId"
          defaultValue={customerId ?? ""}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="">{t("inv.customer")}</option>
          {customerList.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
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
          <div className="px-5 py-12 text-center text-sm text-slate-500">{t("inv.empty")}</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400">
                <th className="px-5 py-3">{t("inv.number")}</th>
                <th className="px-3 py-3">{t("inv.customer")}</th>
                <th className="px-3 py-3">{t("inv.issueDate")}</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-5 py-3 text-right">{t("inv.total")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {list.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50">
                  <td className="px-5 py-3 font-medium">
                    <Link href={`/invoices/${inv.id}`} className="hover:underline">
                      {inv.number}
                    </Link>
                  </td>
                  <td className="px-3 py-3">{inv.customer.name}</td>
                  <td className="px-3 py-3 tabular-nums text-slate-500">
                    {formatDate(inv.issueDate, lang)}
                  </td>
                  <td className="px-3 py-3">
                    {t(`inv.status.${inv.status}` as TKey)}
                  </td>
                  <td className="px-5 py-3 text-right font-semibold tabular-nums">
                    {formatYen(inv.totalAmount, lang)}
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
