import { requireUser } from "@/lib/auth";
import { getT } from "@/lib/i18n";
import { createCustomer } from "@/lib/actions-counterparties";
import { PartyFields } from "@/components/PartyFields";
import { PageToolbar } from "@/components/ui/PageToolbar";
import { ButtonLink } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";

export default async function NewCustomerPage() {
  await requireUser();
  const { t } = await getT();

  return (
    <div className="stack-lg" style={{ maxWidth: "42rem", marginInline: "auto" }}>
      <PageToolbar title={t("cust.new")} />
      <Card>
        <CardBody>
          <form action={createCustomer} className="stack">
            <PartyFields kind="customer" />
            <div className="stack" style={{ flexDirection: "row", gap: "0.75rem" }}>
              <button type="submit" className="btn btn-primary">
                {t("cust.create")}
              </button>
              <ButtonLink href="/customers" variant="muted">
                {t("tx.cancel")}
              </ButtonLink>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
