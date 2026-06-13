import { requireAdmin } from "@/lib/auth";
import { getCompanySettings } from "@/lib/company-settings";
import { getT } from "@/lib/i18n";
import { updateTaxSettings } from "@/lib/actions-settings";
import { PageToolbar } from "@/components/ui/PageToolbar";
import { Alert } from "@/components/ui/Alert";
import { Card, CardBody } from "@/components/ui/Card";

export default async function TaxSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  await requireAdmin();
  const { t } = await getT();
  const settings = await getCompanySettings();
  const { saved, error } = await searchParams;

  return (
    <div className="stack-lg form-page">
      <PageToolbar title={t("settings.jct.title")} />
      {saved && <Alert variant="success">{t("settings.jct.saved")}</Alert>}
      {error && <Alert variant="danger">{t("settings.jct.error")}</Alert>}
      <Alert variant="info">{t("settings.jct.disclaimer")}</Alert>
      <Card>
        <CardBody>
          <form action={updateTaxSettings} className="stack">
            <div className="form-group">
              <label className="form-label" htmlFor="jctStatus">
                {t("settings.jct.status")}
              </label>
              <select
                id="jctStatus"
                name="jctStatus"
                defaultValue={settings.jctStatus}
                className="select"
              >
                <option value="EXEMPT">{t("settings.jct.exempt")}</option>
                <option value="TAXABLE">{t("settings.jct.taxable")}</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="invoiceRegistrationNumber">
                {t("settings.jct.regNumber")}
              </label>
              <input
                id="invoiceRegistrationNumber"
                name="invoiceRegistrationNumber"
                type="text"
                defaultValue={settings.invoiceRegistrationNumber ?? ""}
                placeholder="T1234567890123"
                className="input"
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="companyName">
                {t("settings.jct.companyName")}
              </label>
              <input
                id="companyName"
                name="companyName"
                type="text"
                defaultValue={settings.companyName ?? ""}
                className="input"
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="companyAddress">
                {t("settings.jct.companyAddress")}
              </label>
              <textarea
                id="companyAddress"
                name="companyAddress"
                rows={2}
                defaultValue={settings.companyAddress ?? ""}
                className="textarea"
              />
            </div>
            <div className="form-grid form-grid-2">
              <div className="form-group">
                <label className="form-label" htmlFor="defaultTaxRate">
                  {t("settings.jct.defaultRate")}
                </label>
                <select
                  id="defaultTaxRate"
                  name="defaultTaxRate"
                  defaultValue={String(settings.defaultTaxRate)}
                  className="select"
                >
                  <option value="10">{t("tax.rate10")}</option>
                  <option value="8">{t("tax.rate8")}</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="priceBasis">
                  {t("settings.jct.priceBasis")}
                </label>
                <select
                  id="priceBasis"
                  name="priceBasis"
                  defaultValue={settings.priceBasis}
                  className="select"
                >
                  <option value="TAX_EXCLUSIVE">{t("tax.exclusive")}</option>
                  <option value="TAX_INCLUSIVE">{t("tax.inclusive")}</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="taxRounding">
                  {t("settings.jct.rounding")}
                </label>
                <select
                  id="taxRounding"
                  name="taxRounding"
                  defaultValue={settings.taxRounding}
                  className="select"
                >
                  <option value="FLOOR">{t("settings.jct.roundFloor")}</option>
                  <option value="ROUND">{t("settings.jct.roundRound")}</option>
                  <option value="CEIL">{t("settings.jct.roundCeil")}</option>
                </select>
              </div>
            </div>
            <button type="submit" className="btn btn-primary">
              {t("settings.jct.save")}
            </button>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
