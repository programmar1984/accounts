import Link from "next/link";
import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { db, invoiceLines, invoices } from "@shime/db";
import { requireUser } from "@/lib/auth";
import { getT, type TKey } from "@/lib/i18n";
import { formatDate, formatYen } from "@shime/shared";
import {
  issueInvoice,
  updateInvoice,
  voidInvoice,
} from "@/lib/actions-invoices";
import { LineItemsEditor } from "@/components/LineItemsEditor";

export default async function InvoiceDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string; issued?: string; error?: string }>;
}) {
  await requireUser();
  const { t, lang } = await getT();
  const { id } = await params;
  const { saved, issued, error } = await searchParams;

  const inv = await db.query.invoices.findFirst({
    where: eq(invoices.id, id),
    with: { customer: true, lines: { orderBy: asc(invoiceLines.sortOrder) } },
  });
  if (!inv) notFound();

  const isDraft = inv.status === "DRAFT";
  const inputCls =
    "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none";

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{inv.number}</h1>
          <p className="text-sm text-slate-500">
            {t(`inv.status.${inv.status}` as TKey)} · {inv.customer.name}
          </p>
        </div>
        <Link href="/invoices" className="text-sm text-slate-500 hover:underline">
          ← {t("inv.title")}
        </Link>
      </div>

      {saved && (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {t("inv.saved")}
        </p>
      )}
      {issued && (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {t("inv.issued")}
        </p>
      )}
      {error === "required" && (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {t("inv.error.required")}
        </p>
      )}

      {isDraft ? (
        <form
          action={updateInvoice}
          className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <input type="hidden" name="id" value={inv.id} />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">{t("inv.issueDate")}</label>
              <input
                name="issueDate"
                type="date"
                required
                defaultValue={inv.issueDate.toISOString().slice(0, 10)}
                className={inputCls}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">{t("inv.dueDate")}</label>
              <input
                name="dueDate"
                type="date"
                required
                defaultValue={inv.dueDate.toISOString().slice(0, 10)}
                className={inputCls}
              />
            </div>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">{t("inv.lines")}</label>
            <LineItemsEditor
              defaults={inv.lines.map((l) => ({
                description: l.description,
                quantity: l.quantity,
                unitPrice: l.unitPrice,
              }))}
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
            <label className="mb-1 block text-sm font-medium">{t("inv.notes")}</label>
            <textarea
              name="notes"
              rows={2}
              defaultValue={inv.notes ?? ""}
              className={inputCls}
            />
          </div>
          <button
            type="submit"
            className="rounded-lg bg-slate-900 px-5 py-2 text-sm font-medium text-white hover:bg-slate-700"
          >
            {t("inv.save")}
          </button>
        </form>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">
            {formatDate(inv.issueDate, lang)} → {formatDate(inv.dueDate, lang)}
          </p>
          <ul className="mt-4 divide-y divide-slate-100">
            {inv.lines.map((l) => (
              <li key={l.id} className="flex justify-between py-2 text-sm">
                <span>
                  {l.description} × {l.quantity}
                </span>
                <span className="font-medium tabular-nums">
                  {formatYen(l.lineTotal, lang)}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-right text-lg font-bold tabular-nums">
            {formatYen(inv.totalAmount, lang)}
          </p>
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        {isDraft && (
          <form action={issueInvoice} className="flex items-center gap-2">
            <input type="hidden" name="id" value={inv.id} />
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="createSale" value="true" defaultChecked />
              {t("inv.issueWithSale")}
            </label>
            <button
              type="submit"
              className="rounded-lg bg-emerald-700 px-5 py-2 text-sm font-medium text-white hover:bg-emerald-600"
            >
              {t("inv.issue")}
            </button>
          </form>
        )}
        {inv.pdfStoredName && (
          <a
            href={`/api/invoices/${inv.id}/pdf`}
            target="_blank"
            className="rounded-lg border border-slate-300 px-5 py-2 text-sm font-medium hover:bg-slate-50"
          >
            {t("inv.download")}
          </a>
        )}
        {inv.status === "ISSUED" && (
          <form action={voidInvoice}>
            <input type="hidden" name="id" value={inv.id} />
            <button
              type="submit"
              className="rounded-lg border border-rose-200 px-5 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50"
            >
              {t("inv.void")}
            </button>
          </form>
        )}
        {inv.transactionId && (
          <Link
            href={`/transactions/${inv.transactionId}`}
            className="rounded-lg border border-slate-300 px-5 py-2 text-sm font-medium hover:bg-slate-50"
          >
            {t("nav.transactions")}
          </Link>
        )}
      </div>
    </div>
  );
}
