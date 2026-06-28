import { asc } from "drizzle-orm";
import { db, suppliers } from "@shime/db";
import { requireUser } from "@/lib/auth";
import { getT } from "@/lib/i18n";
import { createExpense, scanReceiptAndCreateExpense } from "@/lib/actions-expenses";
import { getCompanySettings } from "@/lib/company-settings";
import { LineItemsEditor } from "@/components/LineItemsEditor";
import type { TaxRate } from "@shime/shared";
import { PageToolbar } from "@/components/ui/PageToolbar";
import { ButtonLink } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Card, CardBody } from "@/components/ui/Card";

export default async function NewExpensePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await requireUser();
  const { t } = await getT();
  const { error } = await searchParams;

  const scanErrors: Record<string, string> = {
    scan_required: t("exp.error.scan_required"),
    scan_type: t("exp.error.scan_type"),
    scan_size: t("exp.error.scan_size"),
    scan_lmstudio: t("exp.error.scan_lmstudio"),
    scan_parse: t("exp.error.scan_parse"),
    scan_ai: t("exp.error.scan_ai"),
    scan_empty: t("exp.error.scan_empty"),
  };

  const settings = await getCompanySettings();
  const taxable = settings.jctStatus === "TAXABLE";
  const supplierList = await db.query.suppliers.findMany({
    orderBy: [asc(suppliers.name)],
  });

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="stack-lg form-page">
      <PageToolbar title={t("exp.new")} />
      {error === "required" && <Alert variant="danger">{t("exp.error.required")}</Alert>}
      {error && error !== "required" && scanErrors[error] && (
        <Alert variant="danger">{scanErrors[error]}</Alert>
      )}
      <Card>
        <CardBody>
          <form action={scanReceiptAndCreateExpense} className="stack" encType="multipart/form-data">
            <h2 className="section-title">{t("exp.scan.title")}</h2>
            <p className="muted">{t("exp.scan.hint")}</p>
            <div className="form-group">
              <input name="receipt" type="file" accept="image/*,application/pdf" required className="input" />
            </div>
            <button type="submit" className="btn btn-primary">
              {t("exp.scan.submit")}
            </button>
          </form>
        </CardBody>
      </Card>
      <Card>
        <CardBody>
          <form action={createExpense} className="stack">
            <div className="form-grid form-grid-header">
              <div className="form-group">
                <label className="form-label" htmlFor="supplierId">
                  {t("exp.supplier")}
                </label>
                <select id="supplierId" name="supplierId" className="select">
                  <option value="">{t("exp.supplierNone")}</option>
                  {supplierList.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.code ? `${s.code} — ` : ""}
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="expenseDate">
                  {t("exp.date")}
                </label>
                <input id="expenseDate" name="expenseDate" type="date" required defaultValue={today} className="input" />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="dueDate">
                  {t("exp.dueDate")}
                </label>
                <input id="dueDate" name="dueDate" type="date" className="input" />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="description">
                {t("exp.description")}
              </label>
              <input id="description" name="description" type="text" className="input" />
            </div>
            <div className="form-group">
              <label className="form-label">{t("exp.lines")}</label>
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
                {t("exp.notes")}
              </label>
              <textarea id="notes" name="notes" rows={2} className="textarea" />
            </div>
            <div className="stack" style={{ flexDirection: "row", gap: "0.75rem" }}>
              <button type="submit" className="btn btn-primary">
                {t("exp.create")}
              </button>
              <ButtonLink href="/expenses" variant="muted">
                {t("common.cancel")}
              </ButtonLink>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
