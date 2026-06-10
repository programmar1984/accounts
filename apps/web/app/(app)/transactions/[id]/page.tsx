import Link from "next/link";
import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { attachments, customers, db, suppliers, transactions } from "@shime/db";
import { requireUser } from "@/lib/auth";
import { getT, type TKey } from "@/lib/i18n";
import { formatBytes, formatDate } from "@shime/shared";
import {
  addAttachments,
  deleteAttachment,
  deleteTransaction,
  recordPayment,
  updateTransaction,
} from "@/lib/actions";
import { TransactionFields } from "@/components/TransactionFields";
import { TypeBadge } from "@/components/TypeBadge";
import { ConfirmSubmit } from "@/components/ConfirmSubmit";

export default async function TransactionDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; saved?: string; payment?: string }>;
}) {
  await requireUser();
  const { t, lang } = await getT();
  const { id } = await params;
  const { error, saved, payment } = await searchParams;

  const [tx, customerList, supplierList] = await Promise.all([
    db.query.transactions.findFirst({
    where: eq(transactions.id, id),
      with: {
        attachments: { orderBy: asc(attachments.createdAt) },
        createdBy: { columns: { name: true } },
      },
    }),
    db.query.customers.findMany({
      where: eq(customers.active, true),
      orderBy: [asc(customers.name)],
      columns: { id: true, name: true },
    }),
    db.query.suppliers.findMany({
      where: eq(suppliers.active, true),
      orderBy: [asc(suppliers.name)],
      columns: { id: true, name: true },
    }),
  ]);
  if (!tx) notFound();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">{t("tx.editTitle")}</h1>
          <TypeBadge type={tx.type} label={t(`type.${tx.type}` as TKey)} />
        </div>
        <Link
          href="/transactions"
          className="text-sm font-medium text-slate-500 underline-offset-2 hover:underline"
        >
          ← {t("tx.title")}
        </Link>
      </div>

      {saved && (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {t("tx.saved")}
        </p>
      )}
      {error === "required" && (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {t("tx.error.required")}
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
      {error === "payment" && (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {t("tx.error.payment")}
        </p>
      )}
      {payment && (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {t("tx.paymentUpdated")}
        </p>
      )}

      <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
        <span className="text-slate-500">{t("tx.paymentStatus")}: </span>
        <span className="font-medium">
          {t(`pay.${tx.paymentStatus}` as TKey)}
        </span>
        <span className="ml-4 text-slate-500">
          {tx.amountPaid} / {tx.amount} ¥
        </span>
      </div>

      <form
        action={updateTransaction}
        className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <input type="hidden" name="id" value={tx.id} />
        <TransactionFields
          defaults={tx}
          customers={customerList}
          suppliers={supplierList}
        />
        <div className="flex items-center gap-3">
          <button
            type="submit"
            className="rounded-lg bg-slate-900 px-5 py-2 text-sm font-medium text-white hover:bg-slate-700"
          >
            {t("tx.save")}
          </button>
        </div>
      </form>

      <form
        action={recordPayment}
        className="flex flex-wrap items-end gap-3 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <input type="hidden" name="id" value={tx.id} />
        <div>
          <label className="mb-1 block text-sm font-medium" htmlFor="payAmount">
            {t("tx.amountPaid")}
          </label>
          <input
            id="payAmount"
            name="amountPaid"
            type="number"
            min={0}
            max={tx.amount}
            defaultValue={tx.amountPaid}
            className="w-40 rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <button
          type="submit"
          className="rounded-lg bg-slate-900 px-5 py-2 text-sm font-medium text-white hover:bg-slate-700"
        >
          {t("tx.recordPayment")}
        </button>
      </form>

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <h2 className="border-b border-slate-100 px-6 py-4 font-semibold">
          {t("tx.attachments")}
        </h2>

        {tx.attachments.length === 0 ? (
          <p className="px-6 py-6 text-sm text-slate-500">{t("attach.empty")}</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {tx.attachments.map((file) => (
              <li key={file.id} className="flex items-center gap-4 px-6 py-3">
                <span className="text-lg">
                  {file.mimeType === "application/pdf" ? "📄" : "🖼️"}
                </span>
                <div className="min-w-0 flex-1">
                  <a
                    href={`/api/files/${file.id}`}
                    target="_blank"
                    className="block truncate text-sm font-medium underline-offset-2 hover:underline"
                  >
                    {file.originalName}
                  </a>
                  <span className="text-xs text-slate-400">
                    {formatBytes(file.size)} · {formatDate(file.createdAt, lang)}
                  </span>
                </div>
                <a
                  href={`/api/files/${file.id}?download=1`}
                  className="text-sm text-slate-500 underline-offset-2 hover:underline"
                >
                  {t("attach.download")}
                </a>
                <form action={deleteAttachment}>
                  <input type="hidden" name="id" value={file.id} />
                  <ConfirmSubmit
                    message={t("attach.deleteConfirm")}
                    className="text-sm text-rose-600 underline-offset-2 hover:underline"
                  >
                    {t("attach.delete")}
                  </ConfirmSubmit>
                </form>
              </li>
            ))}
          </ul>
        )}

        <form
          action={addAttachments}
          className="flex flex-wrap items-center gap-3 border-t border-slate-100 px-6 py-4"
        >
          <input type="hidden" name="transactionId" value={tx.id} />
          <input
            name="files"
            type="file"
            multiple
            required
            accept="image/*,application/pdf"
            className="flex-1 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-sm file:font-medium"
          />
          <button
            type="submit"
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            {t("attach.upload")}
          </button>
        </form>
      </section>

      <form action={deleteTransaction} className="flex justify-end">
        <input type="hidden" name="id" value={tx.id} />
        <ConfirmSubmit
          message={t("tx.deleteConfirm")}
          className="rounded-lg border border-rose-200 px-4 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50"
        >
          {t("tx.delete")}
        </ConfirmSubmit>
      </form>
    </div>
  );
}
