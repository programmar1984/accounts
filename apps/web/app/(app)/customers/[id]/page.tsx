import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { customers, db } from "@shime/db";
import { requireUser } from "@/lib/auth";
import { getT } from "@/lib/i18n";
import { updateCustomer } from "@/lib/actions-counterparties";
import { PartyFields } from "@/components/PartyFields";
import { PageToolbar } from "@/components/ui/PageToolbar";
import { ButtonLink } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Card, CardBody } from "@/components/ui/Card";

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
    <div className="stack-lg form-page">
      <PageToolbar
        title={t("cust.edit")}
        actions={
          <ButtonLink href="/customers" variant="muted" size="sm">
            ← {t("cust.title")}
          </ButtonLink>
        }
      />
      {saved && <Alert variant="success">{t("cust.saved")}</Alert>}
      {error === "required" && (
        <Alert variant="danger">{t("cust.error.required")}</Alert>
      )}
      <Card>
        <CardBody>
          <form action={updateCustomer} className="stack">
            <input type="hidden" name="id" value={customer.id} />
            <PartyFields kind="customer" defaults={customer} />
            <button type="submit" className="btn btn-primary">
              {t("cust.save")}
            </button>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
