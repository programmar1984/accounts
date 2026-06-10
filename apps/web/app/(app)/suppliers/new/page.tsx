import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { getT } from "@/lib/i18n";
import { createSupplier } from "@/lib/actions-counterparties";
import { PartyFields } from "@/components/PartyFields";

export default async function NewSupplierPage() {
  await requireUser();
  const { t } = await getT();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">{t("supp.new")}</h1>
      <form
        action={createSupplier}
        className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <PartyFields kind="supplier" />
        <div className="flex gap-3">
          <button
            type="submit"
            className="rounded-lg bg-slate-900 px-5 py-2 text-sm font-medium text-white hover:bg-slate-700"
          >
            {t("supp.create")}
          </button>
          <Link
            href="/suppliers"
            className="rounded-lg border border-slate-300 px-5 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            {t("tx.cancel")}
          </Link>
        </div>
      </form>
    </div>
  );
}
