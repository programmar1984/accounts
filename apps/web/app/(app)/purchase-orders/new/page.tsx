import Link from "next/link";
import { asc } from "drizzle-orm";
import { db, suppliers } from "@shime/db";
import { requireUser } from "@/lib/auth";
import { getT } from "@/lib/i18n";
import { createPurchaseOrder } from "@/lib/actions-purchase-orders";
import { LineItemsEditor } from "@/components/LineItemsEditor";

export default async function NewPurchaseOrderPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await requireUser();
  const { t } = await getT();
  const { error } = await searchParams;

  const supplierList = await db.query.suppliers.findMany({
    orderBy: [asc(suppliers.name)],
  });

  const today = new Date().toISOString().slice(0, 10);
  const inputCls =
    "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none";

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold">{t("po.new")}</h1>
      {error === "required" && (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {t("po.error.required")}
        </p>
      )}
      <form
        action={createPurchaseOrder}
        className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium" htmlFor="supplierId">
              {t("po.supplier")}
            </label>
            <select id="supplierId" name="supplierId" required className={inputCls}>
              <option value="">—</option>
              {supplierList.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium" htmlFor="issueDate">
              {t("po.issueDate")}
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
            <label className="mb-1 block text-sm font-medium" htmlFor="expectedDate">
              {t("po.expectedDate")}
            </label>
            <input id="expectedDate" name="expectedDate" type="date" className={inputCls} />
          </div>
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium">{t("po.lines")}</label>
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
            {t("po.notes")}
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
            href="/purchase-orders"
            className="rounded-lg border border-slate-300 px-5 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            {t("tx.cancel")}
          </Link>
        </div>
      </form>
    </div>
  );
}
