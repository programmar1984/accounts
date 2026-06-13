import Link from "next/link";
import { asc } from "drizzle-orm";
import { db, suppliers } from "@shime/db";
import { requireUser } from "@/lib/auth";
import { getT } from "@/lib/i18n";
import { createPurchaseOrder } from "@/lib/actions-purchase-orders";
import { getCompanySettings } from "@/lib/company-settings";
import { PoLineItemsEditor } from "@/components/PoLineItemsEditor";
import { getPoLineDescriptionSuggestions } from "@/lib/po-line-suggestions";
import type { TaxRate } from "@shime/shared";
import { PageToolbar } from "@/components/ui/PageToolbar";
import { ButtonLink } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Card, CardBody } from "@/components/ui/Card";

export default async function NewPurchaseOrderPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await requireUser();
  const { t } = await getT();
  const { error } = await searchParams;

  const settings = await getCompanySettings();
  const taxable = settings.jctStatus === "TAXABLE";
  const supplierList = await db.query.suppliers.findMany({
    orderBy: [asc(suppliers.name)],
  });
  const lineSuggestions = await getPoLineDescriptionSuggestions();

  const today = new Date().toISOString().slice(0, 10);

  const lineLabels = {
    description: t("line.description"),
    quantity: t("line.qty"),
    unitPrice: t("line.unitPrice"),
    taxRate: t("tax.rate"),
    taxable: t("line.taxable"),
    nonTaxable: t("line.nonTaxable"),
    rate: t("line.rate"),
    rate10: t("tax.rate10"),
    rate8: t("tax.rate8"),
    rate0: t("tax.rate0"),
    add: t("line.add"),
    remove: t("line.remove"),
  };

  return (
    <div className="stack-lg form-page">
      <PageToolbar title={t("po.new")} />
      {error === "required" && (
        <Alert variant="danger">{t("po.error.required")}</Alert>
      )}
      <Card>
        <CardBody>
          <form action={createPurchaseOrder} className="stack">
            <div className="form-grid form-grid-header">
              <div className="form-group">
                <label className="form-label" htmlFor="supplierId">
                  {t("po.supplier")}
                </label>
                <select id="supplierId" name="supplierId" required className="select">
                  <option value="">—</option>
                  {supplierList.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="issueDate">
                  {t("po.issueDate")}
                </label>
                <input
                  id="issueDate"
                  name="issueDate"
                  type="date"
                  required
                  defaultValue={today}
                  className="input"
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="dueDate">
                  {t("po.dueDate")}
                </label>
                <input id="dueDate" name="dueDate" type="date" className="input" />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">{t("po.lines")}</label>
              {!taxable && (
                <div style={{ marginBottom: "0.75rem" }}>
                  <Alert variant="info">
                    {t("po.taxExemptHint")}{" "}
                    <Link href="/settings/tax">{t("po.taxExemptHintLink")}</Link>
                  </Alert>
                </div>
              )}
              <PoLineItemsEditor
                allSuggestions={lineSuggestions}
                pickSupplierHint={t("po.lineSuggestPickSupplier")}
                suggestionsLabel={t("line.suggestions")}
                taxable={taxable}
                defaultTaxRate={settings.defaultTaxRate as TaxRate}
                unitPriceLabel={
                  taxable && settings.priceBasis === "TAX_EXCLUSIVE"
                    ? t("tax.exclusive")
                    : taxable
                      ? t("tax.inclusive")
                      : t("line.unitPrice")
                }
                labels={lineLabels}
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="notes">
                {t("po.notes")}
              </label>
              <textarea id="notes" name="notes" rows={2} className="textarea" />
            </div>
            <div className="stack" style={{ flexDirection: "row", gap: "0.75rem" }}>
              <button type="submit" className="btn btn-primary">
                {t("po.create")}
              </button>
              <ButtonLink href="/purchase-orders" variant="muted">
                {t("common.cancel")}
              </ButtonLink>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
