import Link from "next/link";
import { asc, eq } from "drizzle-orm";
import { db, serviceOrderLines, serviceOrders, suppliers } from "@shime/db";
import { requireUser } from "@/lib/auth";
import { getT } from "@/lib/i18n";
import { createServiceOrder } from "@/lib/actions-service-orders";
import { getCompanySettings } from "@/lib/company-settings";
import { LineItemsEditor } from "@/components/LineItemsEditor";
import { SERVICE_CATEGORIES, type TaxRate } from "@shime/shared";
import { PageToolbar } from "@/components/ui/PageToolbar";
import { ButtonLink } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Card, CardBody } from "@/components/ui/Card";
import type { TKey } from "@/lib/i18n";

export default async function NewServiceOrderPage({
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
      <PageToolbar title={t("svo.new")} />
      {error === "required" && (
        <Alert variant="danger">{t("svo.error.required")}</Alert>
      )}
      <Card>
        <CardBody>
          <form action={createServiceOrder} className="stack">
            <div className="form-grid form-grid-header">
              <div className="form-group">
                <label className="form-label" htmlFor="supplierId">
                  {t("svo.supplier")}
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
                <label className="form-label" htmlFor="serviceCategory">
                  {t("svo.category")}
                </label>
                <select id="serviceCategory" name="serviceCategory" required className="select">
                  <option value="">—</option>
                  {SERVICE_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {t(`svo.category.${cat}` as TKey)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="issueDate">
                  {t("svo.issueDate")}
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
                  {t("svo.dueDate")}
                </label>
                <input id="dueDate" name="dueDate" type="date" className="input" />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">{t("svo.lines")}</label>
              {!taxable && (
                <div style={{ marginBottom: "0.75rem" }}>
                  <Alert variant="info">
                    {t("po.taxExemptHint")}{" "}
                    <Link href="/settings/tax">{t("po.taxExemptHintLink")}</Link>
                  </Alert>
                </div>
              )}
              <LineItemsEditor
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
                {t("svo.notes")}
              </label>
              <textarea id="notes" name="notes" rows={2} className="textarea" />
            </div>
            <div className="stack" style={{ flexDirection: "row", gap: "0.75rem" }}>
              <button type="submit" className="btn btn-primary">
                {t("svo.create")}
              </button>
              <ButtonLink href="/service-orders" variant="muted">
                {t("common.cancel")}
              </ButtonLink>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
