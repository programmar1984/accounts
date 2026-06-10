import Link from "next/link";
import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { db, purchaseOrderLines, purchaseOrders } from "@shime/db";
import { requireUser } from "@/lib/auth";
import { getT, type TKey } from "@/lib/i18n";
import { formatBytes, formatDate, formatYen } from "@shime/shared";
import {
  addPurchaseOrderAttachments,
  cancelPurchaseOrder,
  deletePurchaseOrderAttachment,
  recordPurchaseOrderReceipt,
  sendPurchaseOrder,
  updatePurchaseOrder,
} from "@/lib/actions-purchase-orders";
import { LineItemsEditor } from "@/components/LineItemsEditor";
import { canCancelPo, canReceivePo, canSendPo } from "@shime/shared";

export default async function PurchaseOrderDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    saved?: string;
    sent?: string;
    received?: string;
    error?: string;
  }>;
}) {
  await requireUser();
  const { t, lang } = await getT();
  const { id } = await params;
  const { saved, sent, received, error } = await searchParams;

  const po = await db.query.purchaseOrders.findFirst({
    where: eq(purchaseOrders.id, id),
    with: {
      supplier: true,
      lines: { orderBy: asc(purchaseOrderLines.sortOrder) },
      attachments: true,
    },
  });
  if (!po) notFound();

  const isDraft = po.status === "DRAFT";
  const inputCls =
    "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none";

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{po.number}</h1>
          <p className="text-sm text-slate-500">
            {t(`po.status.${po.status}` as TKey)} · {po.supplier.name}
          </p>
        </div>
        <Link href="/purchase-orders" className="text-sm text-slate-500 hover:underline">
          ← {t("po.title")}
        </Link>
      </div>

      {saved && (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {t("po.saved")}
        </p>
      )}
      {sent && (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {t("po.sent")}
        </p>
      )}
      {received && (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {t("po.received")}
        </p>
      )}
      {error === "type" && (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {t("attach.error.type")}
        </p>
      )}
      {error === "size" && (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {t("attach.error.size")}
        </p>
      )}

      {isDraft ? (
        <form
          action={updatePurchaseOrder}
          className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <input type="hidden" name="id" value={po.id} />
          <div>
            <label className="mb-1 block text-sm font-medium">{t("po.expectedDate")}</label>
            <input
              name="expectedDate"
              type="date"
              defaultValue={po.expectedDate?.toISOString().slice(0, 10) ?? ""}
              className={inputCls}
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">{t("po.lines")}</label>
            <LineItemsEditor
              defaults={po.lines.map((l) => ({
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
            <label className="mb-1 block text-sm font-medium">{t("po.notes")}</label>
            <textarea
              name="notes"
              rows={2}
              defaultValue={po.notes ?? ""}
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
          <ul className="divide-y divide-slate-100">
            {po.lines.map((l) => (
              <li key={l.id} className="flex justify-between py-2 text-sm">
                <span>
                  {l.description} — {l.qtyReceived}/{l.quantity} {t("po.qtyReceived")}
                </span>
                <span className="font-medium tabular-nums">
                  {formatYen(l.lineTotal, lang)}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-right text-lg font-bold tabular-nums">
            {formatYen(po.totalAmount, lang)}
          </p>
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        {canSendPo(po.status) && (
          <form action={sendPurchaseOrder}>
            <input type="hidden" name="id" value={po.id} />
            <button
              type="submit"
              className="rounded-lg bg-emerald-700 px-5 py-2 text-sm font-medium text-white hover:bg-emerald-600"
            >
              {t("po.send")}
            </button>
          </form>
        )}
        {canCancelPo(po.status) && (
          <form action={cancelPurchaseOrder}>
            <input type="hidden" name="id" value={po.id} />
            <button
              type="submit"
              className="rounded-lg border border-rose-200 px-5 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50"
            >
              {t("po.cancel")}
            </button>
          </form>
        )}
      </div>

      {canReceivePo(po.status) && (
        <form
          action={recordPurchaseOrderReceipt}
          className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <input type="hidden" name="id" value={po.id} />
          <h2 className="font-semibold">{t("po.recordReceipt")}</h2>
          {po.lines.map((l) => {
            const remaining = l.quantity - l.qtyReceived;
            if (remaining <= 0) return null;
            return (
              <div key={l.id} className="flex items-center gap-4 text-sm">
                <input type="hidden" name="lineId" value={l.id} />
                <span className="min-w-0 flex-1 truncate">{l.description}</span>
                <span className="text-slate-500">max {remaining}</span>
                <input
                  name="receiveQty"
                  type="number"
                  min={0}
                  max={remaining}
                  defaultValue={remaining}
                  className="w-20 rounded-lg border border-slate-300 px-2 py-1"
                />
              </div>
            );
          })}
          <button
            type="submit"
            className="rounded-lg bg-slate-900 px-5 py-2 text-sm font-medium text-white hover:bg-slate-700"
          >
            {t("po.recordReceipt")}
          </button>
        </form>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <h2 className="border-b border-slate-100 px-6 py-4 font-semibold">
          {t("po.receipts")}
        </h2>
        {po.attachments.length === 0 ? (
          <p className="px-6 py-6 text-sm text-slate-500">{t("attach.empty")}</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {po.attachments.map((file) => (
              <li key={file.id} className="flex items-center gap-4 px-6 py-3">
                <a
                  href={`/api/files/${file.id}`}
                  target="_blank"
                  className="min-w-0 flex-1 truncate text-sm font-medium hover:underline"
                >
                  {file.originalName}
                </a>
                <span className="text-xs text-slate-400">{formatBytes(file.size)}</span>
                <form action={deletePurchaseOrderAttachment}>
                  <input type="hidden" name="id" value={file.id} />
                  <button type="submit" className="text-sm text-rose-600 hover:underline">
                    {t("attach.delete")}
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
        {canReceivePo(po.status) || po.status === "CLOSED" ? (
          <form
            action={addPurchaseOrderAttachments}
            className="flex flex-wrap items-center gap-3 border-t border-slate-100 px-6 py-4"
          >
            <input type="hidden" name="purchaseOrderId" value={po.id} />
            <input
              name="files"
              type="file"
              multiple
              accept="image/*,application/pdf"
              className="flex-1 text-sm"
            />
            <button
              type="submit"
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-50"
            >
              {t("attach.upload")}
            </button>
          </form>
        ) : null}
      </section>
    </div>
  );
}
