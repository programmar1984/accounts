import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { customers, db } from "@shime/db";
import { requireUser } from "@/lib/auth";
import { getT } from "@/lib/i18n";
import { updateCustomer } from "@/lib/actions-counterparties";
import { PartyFields } from "@/components/PartyFields";

export default async function CustomerDetailPage({
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

  const customer = await db.query.customers.findFirst({ where: eq(customers.id, id) });
  if (!customer) notFound();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("cust.edit")}</h1>
        <Link href="/customers" className="text-sm text-slate-500 hover:underline">
          ← {t("cust.title")}
        </Link>
      </div>
      {saved && (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {t("cust.saved")}
        </p>
      )}
      {error === "required" && (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {t("cust.error.required")}
        </p>
      )}
      <form
        action={updateCustomer}
        className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <input type="hidden" name="id" value={customer.id} />
        <PartyFields kind="customer" defaults={customer} />
        <button
          type="submit"
          className="rounded-lg bg-slate-900 px-5 py-2 text-sm font-medium text-white hover:bg-slate-700"
        >
          {t("cust.save")}
        </button>
      </form>
    </div>
  );
}
