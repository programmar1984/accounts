import { asc, eq } from "drizzle-orm";
import { customers, db } from "@shime/db";
import { requireUser } from "@/lib/auth";
import { getT } from "@/lib/i18n";
import { createInvoice } from "@/lib/actions-invoices";
import { getCompanySettings } from "@/lib/company-settings";
import { LineItemsEditor } from "@/components/LineItemsEditor";
import type { TaxRate } from "@shime/shared";
import { PageToolbar } from "@/components/ui/PageToolbar";
import { ButtonLink } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Card, CardBody } from "@/components/ui/Card";

export default async function NewSalesOrderPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await requireUser();
  const { t } = await getT();
  const { error } = await searchParams;

  const settings = await getCompanySettings();
  const taxable = settings.jctStatus === "TAXABLE";
  const customerList = await db.query.customers.findMany({
    where: eq(customers.active, true),
    orderBy: [asc(customers.name)],
  });

  const today = new Date().toISOString().slice(0, 10);
  const due = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);

  return (
    <div className="stack-lg" style={{ maxWidth: "48rem", marginInline: "auto" }}>
      <PageToolbar title={t("so.new")} />
      {error === "required" && <Alert variant="danger">{t("so.error.required")}</Alert>}
      <Card>
        <CardBody>
          <form action={createInvoice} className="stack">
            <div className="form-grid form-grid-2">
              <div className="form-group">
                <label className="form-label" htmlFor="customerId">
                  {t("so.customer")}
                </label>
                <select id="customerId" name="customerId" required className="select">
                  <option value="">—</option>
                  {customerList.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.code ? `${c.code} — ` : ""}
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="issueDate">
                  {t("so.issueDate")}
                </label>
                <input id="issueDate" name="issueDate" type="date" required defaultValue={today} className="input" />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="dueDate">
                  {t("so.dueDate")}
                </label>
                <input id="dueDate" name="dueDate" type="date" required defaultValue={due} className="input" />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">{t("so.lines")}</label>
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
                labels={{
                  description: t("line.description"),
                  quantity: t("line.qty"),
                  unitPrice: t("line.unitPrice"),
                  taxRate: t("tax.rate"),
                  rate10: t("tax.rate10"),
                  rate8: t("tax.rate8"),
                  rate0: t("tax.rate0"),
                  add: t("line.add"),
                  remove: t("line.remove"),
                }}
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="notes">
                {t("so.notes")}
              </label>
              <textarea id="notes" name="notes" rows={2} className="textarea" />
            </div>
            <div className="stack" style={{ flexDirection: "row", gap: "0.75rem" }}>
              <button type="submit" className="btn btn-primary">
                {t("so.create")}
              </button>
              <ButtonLink href="/sales-orders" variant="muted">
                {t("common.cancel")}
              </ButtonLink>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
