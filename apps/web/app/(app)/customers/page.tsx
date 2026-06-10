import Link from "next/link";
import { asc } from "drizzle-orm";
import { customers, db } from "@shime/db";
import { requireUser } from "@/lib/auth";
import { getT } from "@/lib/i18n";
import { setCustomerActive } from "@/lib/actions-counterparties";

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; created?: string }>;
}) {
  await requireUser();
  const { t } = await getT();
  const { error, created } = await searchParams;

  const list = await db.query.customers.findMany({ orderBy: asc(customers.name) });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">{t("cust.title")}</h1>
        <Link
          href="/customers/new"
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
        >
          + {t("cust.new")}
        </Link>
      </div>

      {created && (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {t("cust.created")}
        </p>
      )}
      {error === "required" && (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {t("cust.error.required")}
        </p>
      )}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {list.length === 0 ? (
          <div className="px-5 py-12 text-center text-sm text-slate-500">{t("cust.empty")}</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400">
                <th className="px-5 py-3 font-medium">{t("cust.name")}</th>
                <th className="px-3 py-3 font-medium">{t("cust.code")}</th>
                <th className="px-3 py-3 font-medium">{t("cust.email")}</th>
                <th className="px-3 py-3 font-medium">{t("cust.status")}</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {list.map((c) => (
                <tr key={c.id}>
                  <td className="px-5 py-3 font-medium">
                    <Link href={`/customers/${c.id}`} className="hover:underline">
                      {c.name}
                    </Link>
                  </td>
                  <td className="px-3 py-3 text-slate-500">{c.code ?? "—"}</td>
                  <td className="px-3 py-3 text-slate-500">{c.email ?? "—"}</td>
                  <td className="px-3 py-3">
                    <span
                      className={`inline-flex rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${
                        c.active
                          ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20"
                          : "bg-slate-100 text-slate-500 ring-slate-400/20"
                      }`}
                    >
                      {c.active ? t("cust.active") : t("cust.inactive")}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <form action={setCustomerActive}>
                      <input type="hidden" name="id" value={c.id} />
                      <input type="hidden" name="active" value={c.active ? "false" : "true"} />
                      <button
                        type="submit"
                        className={`text-sm underline-offset-2 hover:underline ${
                          c.active ? "text-rose-600" : "text-emerald-700"
                        }`}
                      >
                        {c.active ? t("cust.deactivate") : t("cust.activate")}
                      </button>
                    </form>
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
