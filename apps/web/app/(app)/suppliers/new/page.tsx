import { requireUser } from "@/lib/auth";
import { getT } from "@/lib/i18n";
import { createSupplier } from "@/lib/actions-counterparties";
import { PartyFields } from "@/components/PartyFields";
import { PageToolbar } from "@/components/ui/PageToolbar";
import { ButtonLink } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";

export default async function NewSupplierPage() {
  await requireUser();
  const { t } = await getT();

  return (
    <div className="stack-lg form-page">
      <PageToolbar title={t("supp.new")} />
      <Card>
        <CardBody>
          <form action={createSupplier} className="stack">
            <PartyFields kind="supplier" />
            <div className="stack" style={{ flexDirection: "row", gap: "0.75rem" }}>
              <button type="submit" className="btn btn-primary">
                {t("supp.create")}
              </button>
              <ButtonLink href="/suppliers" variant="muted">
                {t("tx.cancel")}
              </ButtonLink>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
