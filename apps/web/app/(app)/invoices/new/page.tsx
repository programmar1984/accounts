import Link from "next/link";
import { asc, eq } from "drizzle-orm";
import { customers, db } from "@shime/db";
import { requireUser } from "@/lib/auth";
import { getT } from "@/lib/i18n";
import { createInvoice } from "@/lib/actions-invoices";
import { LineItemsEditor } from "@/components/LineItemsEditor";

export default async function NewInvoicePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await requireUser();
  const { t } = await getT();
  const { error } = await searchParams;

  const customerList = await db.query.customers.findMany({
    where: eq(customers.active, true),
    orderBy: [asc(customers.name)],
  });

  const today = new Date().toISOString().slice(0, 10);
  const due = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
  const inputCls =
    "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none";

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold">{t("inv.new")}</h1>
      {error === "required" && (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {t("inv.error.required")}
        </p>
      )}
      <form
        action={createInvoice}
        className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium" htmlFor="customerId">
              {t("inv.customer")}
            </label>
            <select
              id="customerId"
              name="customerId"
              required
              className={inputCls}
            >
              <option value="">—</option>
              {customerList.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium" htmlFor="issueDate">
              {t("inv.issueDate")}
            </label>
            <input
              id="issueDate"
              name="issueDate"
              type="date"
              required
              defaultValue={today}
              className={inputCls}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium" htmlFor="dueDate">
              {t("inv.dueDate")}
            </label>
            <input
              id="dueDate"
              name="dueDate"
              type="date"
              required
              defaultValue={due}
              className={inputCls}
            />
          </div>
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium">{t("inv.lines")}</label>
          <LineItemsEditor
            labels={{
              description: t("inv.lineDescription"),
              quantity: t("inv.lineQty"),
              unitPrice: t("inv.linePrice"),
              add: t("inv.addLine"),
              remove: t("inv.removeLine"),
            }}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium" htmlFor="notes">
            {t("inv.notes")}
          </label>
          <textarea id="notes" name="notes" rows={2} className={inputCls} />
        </div>
        <div className="flex gap-3">
          <button
            type="submit"
            className="rounded-lg bg-slate-900 px-5 py-2 text-sm font-medium text-white hover:bg-slate-700"
          >
            {t("inv.create")}
          </button>
          <Link
            href="/invoices"
            className="rounded-lg border border-slate-300 px-5 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            {t("tx.cancel")}
          </Link>
        </div>
      </form>
    </div>
  );
}
