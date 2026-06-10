import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, suppliers } from "@shime/db";
import { requireUser } from "@/lib/auth";
import { getT } from "@/lib/i18n";
import { updateSupplier } from "@/lib/actions-counterparties";
import { PartyFields } from "@/components/PartyFields";
import { PageToolbar } from "@/components/ui/PageToolbar";
import { ButtonLink } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Card, CardBody } from "@/components/ui/Card";

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
    <div className="stack-lg" style={{ maxWidth: "42rem", marginInline: "auto" }}>
      <PageToolbar
        title={t("supp.edit")}
        actions={
          <ButtonLink href="/suppliers" variant="muted" size="sm">
            ← {t("supp.title")}
          </ButtonLink>
        }
      />
      {saved && <Alert variant="success">{t("supp.saved")}</Alert>}
      {error === "required" && (
        <Alert variant="danger">{t("supp.error.required")}</Alert>
      )}
      <Card>
        <CardBody>
          <form action={updateSupplier} className="stack">
            <input type="hidden" name="id" value={supplier.id} />
            <PartyFields kind="supplier" defaults={supplier} />
            <button type="submit" className="btn btn-primary">
              {t("supp.save")}
            </button>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
