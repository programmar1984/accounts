import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, suppliers } from "@shime/db";
import { requireUser } from "@/lib/auth";
import { getT } from "@/lib/i18n";
import { updateSupplier } from "@/lib/actions-counterparties";
import { PartyFields } from "@/components/PartyFields";

export default async function SupplierDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  await requireUser();
  const { t } = await getT();
  const { id } = await params;
  const { saved, error } = await searchParams;

  const supplier = await db.query.suppliers.findFirst({ where: eq(suppliers.id, id) });
  if (!supplier) notFound();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("supp.edit")}</h1>
        <Link href="/suppliers" className="text-sm text-slate-500 hover:underline">
          ← {t("supp.title")}
        </Link>
      </div>
      {saved && (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {t("supp.saved")}
        </p>
      )}
      {error === "required" && (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {t("supp.error.required")}
        </p>
      )}
      <form
        action={updateSupplier}
        className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <input type="hidden" name="id" value={supplier.id} />
        <PartyFields kind="supplier" defaults={supplier} />
        <button
          type="submit"
          className="rounded-lg bg-slate-900 px-5 py-2 text-sm font-medium text-white hover:bg-slate-700"
        >
          {t("supp.save")}
        </button>
      </form>
    </div>
  );
}
