import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { getT } from "@/lib/i18n";
import { createTransaction } from "@/lib/actions";
import { TransactionFields } from "@/components/TransactionFields";

export default async function NewTransactionPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await requireUser();
  const { t } = await getT();
  const { error } = await searchParams;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">{t("tx.new")}</h1>

      {error === "required" && (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {t("tx.error.required")}
        </p>
      )}

      <form
        action={createTransaction}
        className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <TransactionFields />

        <div>
          <label className="mb-1 block text-sm font-medium" htmlFor="files">
            {t("tx.attachments")}
          </label>
          <input
            id="files"
            name="files"
            type="file"
            multiple
            accept="image/*,application/pdf"
            className="w-full rounded-lg border border-dashed border-slate-300 px-3 py-3 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-sm file:font-medium"
          />
          <p className="mt-1 text-xs text-slate-400">{t("attach.uploadHint")}</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            className="rounded-lg bg-slate-900 px-5 py-2 text-sm font-medium text-white hover:bg-slate-700"
          >
            {t("tx.create")}
          </button>
          <Link
            href="/transactions"
            className="rounded-lg border border-slate-300 px-5 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            {t("tx.cancel")}
          </Link>
        </div>
      </form>
    </div>
  );
}
