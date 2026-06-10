import Link from "next/link";
import { asc } from "drizzle-orm";
import { db, suppliers } from "@shime/db";
import { requireUser } from "@/lib/auth";
import { getT } from "@/lib/i18n";
import { setSupplierActive } from "@/lib/actions-counterparties";

export default async function SuppliersPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; created?: string }>;
}) {
  await requireUser();
  const { t } = await getT();
  const { error, created } = await searchParams;

  const list = await db.query.suppliers.findMany({ orderBy: asc(suppliers.name) });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">{t("supp.title")}</h1>
        <Link
          href="/suppliers/new"
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
        >
          + {t("supp.new")}
        </Link>
      </div>

      {created && (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {t("supp.created")}
        </p>
      )}
      {error === "required" && (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {t("supp.error.required")}
        </p>
      )}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {list.length === 0 ? (
          <div className="px-5 py-12 text-center text-sm text-slate-500">{t("supp.empty")}</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400">
                <th className="px-5 py-3 font-medium">{t("supp.name")}</th>
                <th className="px-3 py-3 font-medium">{t("supp.code")}</th>
                <th className="px-3 py-3 font-medium">{t("supp.email")}</th>
                <th className="px-3 py-3 font-medium">{t("supp.status")}</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {list.map((s) => (
                <tr key={s.id}>
                  <td className="px-5 py-3 font-medium">
                    <Link href={`/suppliers/${s.id}`} className="hover:underline">
                      {s.name}
                    </Link>
                  </td>
                  <td className="px-3 py-3 text-slate-500">{s.code ?? "—"}</td>
                  <td className="px-3 py-3 text-slate-500">{s.email ?? "—"}</td>
                  <td className="px-3 py-3">
                    <span
                      className={`inline-flex rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${
                        s.active
                          ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20"
                          : "bg-slate-100 text-slate-500 ring-slate-400/20"
                      }`}
                    >
                      {s.active ? t("supp.active") : t("supp.inactive")}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <form action={setSupplierActive}>
                      <input type="hidden" name="id" value={s.id} />
                      <input type="hidden" name="active" value={s.active ? "false" : "true"} />
                      <button
                        type="submit"
                        className={`text-sm underline-offset-2 hover:underline ${
                          s.active ? "text-rose-600" : "text-emerald-700"
                        }`}
                      >
                        {s.active ? t("supp.deactivate") : t("supp.activate")}
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
