import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { db, invoiceLines, invoices } from "@shime/db";
import { requireUser } from "@/lib/auth";
import { getT, type TKey } from "@/lib/i18n";
import { formatDate, formatYen } from "@shime/shared";
import {
  issueInvoice,
  recordSoPayment,
  updateInvoice,
  voidInvoice,
} from "@/lib/actions-invoices";
import { getCompanySettings } from "@/lib/company-settings";
import { LineItemsEditor } from "@/components/LineItemsEditor";
import type { TaxRate } from "@shime/shared";
import { PageToolbar } from "@/components/ui/PageToolbar";
import { ButtonLink } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Card, CardBody } from "@/components/ui/Card";
import { paymentBadgeVariant } from "@/components/TypeBadge";

export default async function SalesOrderDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string; issued?: string; payment?: string; error?: string }>;
}) {
  await requireUser();
  const { t, lang } = await getT();
  const { id } = await params;
  const { saved, issued, payment, error } = await searchParams;

  const settings = await getCompanySettings();
  const taxable = settings.jctStatus === "TAXABLE";

  const so = await db.query.invoices.findFirst({
    where: eq(invoices.id, id),
    with: { customer: true, lines: { orderBy: asc(invoiceLines.sortOrder) } },
  });
  if (!so) notFound();

  const isDraft = so.status === "DRAFT";
  const isIssued = so.status === "ISSUED";

  return (
    <div className="stack-lg form-page">
      <PageToolbar
        title={so.number}
        subtitle={`${t(`so.status.${so.status}` as TKey)} · ${so.customer.name}${so.customer.code ? ` (${so.customer.code})` : ""}`}
        actions={
          <ButtonLink href="/sales-orders" variant="muted" size="sm">
            ← {t("so.title")}
          </ButtonLink>
        }
      />

      {saved && <Alert variant="success">{t("so.saved")}</Alert>}
      {issued && <Alert variant="success">{t("so.issued")}</Alert>}
      {payment && <Alert variant="success">{t("so.paymentUpdated")}</Alert>}
      {error === "required" && <Alert variant="danger">{t("so.error.required")}</Alert>}
      {error === "payment" && <Alert variant="danger">{t("so.error.payment")}</Alert>}

      {isIssued && (
        <Card>
          <CardBody>
            <p className="payment-status-line">
              <span className="muted">{t("so.paymentStatus")}:</span>
              <Badge variant={paymentBadgeVariant(so.paymentStatus)}>
                {t(`pay.${so.paymentStatus}` as TKey)}
              </Badge>
              <span className="tabular-nums">
                {formatYen(so.amountPaid, lang)} / {formatYen(so.totalAmount, lang)}
              </span>
            </p>
          </CardBody>
        </Card>
      )}

      {isDraft ? (
        <Card>
          <CardBody>
            <form action={updateInvoice} className="stack">
              <input type="hidden" name="id" value={so.id} />
              <div className="form-grid form-grid-header">
                <div className="form-group">
                  <label className="form-label">{t("so.issueDate")}</label>
                  <input
                    name="issueDate"
                    type="date"
                    required
                    defaultValue={so.issueDate.toISOString().slice(0, 10)}
                    className="input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">{t("so.dueDate")}</label>
                  <input
                    name="dueDate"
                    type="date"
                    required
                    defaultValue={so.dueDate.toISOString().slice(0, 10)}
                    className="input"
                  />
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
                  defaults={so.lines.map((l) => ({
                    description: l.description,
                    quantity: l.quantity,
                    unitPrice: l.unitPrice,
                    taxRate: l.taxRate as TaxRate,
                  }))}
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
                <label className="form-label">{t("so.notes")}</label>
                <textarea name="notes" rows={2} defaultValue={so.notes ?? ""} className="textarea" />
              </div>
              <button type="submit" className="btn btn-primary">
                {t("so.save")}
              </button>
            </form>
          </CardBody>
        </Card>
      ) : (
        <Card>
          <CardBody>
            <p className="muted">
              {formatDate(so.issueDate, lang)} → {formatDate(so.dueDate, lang)}
            </p>
            <ul className="stack" style={{ marginTop: "1rem" }}>
              {so.lines.map((l) => (
                <li
                  key={l.id}
                  className="stack"
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    borderBottom: "1px solid var(--border-color, #eee)",
                    paddingBlock: "0.5rem",
                  }}
                >
                  <span>
                    {l.description} × {l.quantity}
                    {taxable ? ` (${l.taxRate}%)` : ""}
                  </span>
                  <span className="tabular-nums" style={{ fontWeight: 600 }}>
                    {formatYen(l.lineTotal, lang)}
                  </span>
                </li>
              ))}
            </ul>
            {taxable && so.totalTax > 0 && (
              <div className="muted" style={{ marginTop: "1rem", fontSize: "0.88rem" }}>
                <p>{t("tax.subtotalExTax")}: {formatYen(so.subtotalExTax, lang)}</p>
                <p>{t("tax.totalTax")}: {formatYen(so.totalTax, lang)}</p>
              </div>
            )}
            <p className="text-right tabular-nums" style={{ marginTop: "1rem", fontSize: "1.125rem", fontWeight: 700 }}>
              {formatYen(so.totalAmount, lang)}
            </p>
          </CardBody>
        </Card>
      )}

      <div className="stack" style={{ flexDirection: "row", flexWrap: "wrap", gap: "0.75rem" }}>
        {isDraft && (
          <form action={issueInvoice}>
            <input type="hidden" name="id" value={so.id} />
            <button type="submit" className="btn btn-success">
              {t("so.issue")}
            </button>
          </form>
        )}
        {so.pdfStoredName && (
          <ButtonLink href={`/api/invoices/${so.id}/pdf`} variant="muted" target="_blank">
            {t("so.download")}
          </ButtonLink>
        )}
        {isIssued && (
          <form action={voidInvoice}>
            <input type="hidden" name="id" value={so.id} />
            <button type="submit" className="btn btn-danger">
              {t("so.void")}
            </button>
          </form>
        )}
      </div>

      {isIssued && (
        <Card>
          <CardBody>
            <form action={recordSoPayment} className="stack">
              <input type="hidden" name="id" value={so.id} />
              <h2 style={{ fontWeight: 600 }}>{t("so.recordPayment")}</h2>
              <div className="form-group">
                <label className="form-label" htmlFor="amountPaid">
                  {t("so.amountPaid")}
                </label>
                <input
                  id="amountPaid"
                  name="amountPaid"
                  type="number"
                  min={0}
                  max={so.totalAmount}
                  step={1}
                  defaultValue={so.amountPaid}
                  className="input"
                />
              </div>
              <button type="submit" className="btn btn-primary">
                {t("so.updatePayment")}
              </button>
            </form>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
