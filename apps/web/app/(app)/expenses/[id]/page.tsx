import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { db, expenseLines, expenses, suppliers } from "@shime/db";
import { requireUser } from "@/lib/auth";
import { getT, type TKey } from "@/lib/i18n";
import { formatBytes, formatDate, formatYen } from "@shime/shared";
import {
  addExpenseAttachments,
  deleteExpenseAttachment,
  postExpense,
  recordExpensePayment,
  updateExpense,
  voidExpense,
} from "@/lib/actions-expenses";
import { getCompanySettings } from "@/lib/company-settings";
import { LineItemsEditor } from "@/components/LineItemsEditor";
import { canPostExpense, canVoidExpense, type TaxRate } from "@shime/shared";
import { PageToolbar } from "@/components/ui/PageToolbar";
import { ButtonLink } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Card, CardBody, CardFooter, CardHeader } from "@/components/ui/Card";
import { paymentBadgeVariant } from "@/components/TypeBadge";

export default async function ExpenseDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string; posted?: string; payment?: string; error?: string }>;
}) {
  await requireUser();
  const { t, lang } = await getT();
  const { id } = await params;
  const { saved, posted, payment, error } = await searchParams;

  const settings = await getCompanySettings();
  const taxable = settings.jctStatus === "TAXABLE";

  const [exp, supplierList] = await Promise.all([
    db.query.expenses.findFirst({
      where: eq(expenses.id, id),
      with: {
        supplier: true,
        lines: { orderBy: asc(expenseLines.sortOrder) },
        attachments: true,
      },
    }),
    db.query.suppliers.findMany({ orderBy: [asc(suppliers.name)] }),
  ]);
  if (!exp) notFound();

  const isDraft = exp.status === "DRAFT";
  const isPosted = exp.status === "POSTED";

  return (
    <div className="stack-lg form-page">
      <PageToolbar
        title={exp.number}
        subtitle={`${t(`exp.status.${exp.status}` as TKey)}${exp.supplier ? ` · ${exp.supplier.name}` : ""}`}
        actions={
          <ButtonLink href="/expenses" variant="muted" size="sm">
            ← {t("exp.title")}
          </ButtonLink>
        }
      />

      {saved && <Alert variant="success">{t("exp.saved")}</Alert>}
      {posted && <Alert variant="success">{t("exp.posted")}</Alert>}
      {payment && <Alert variant="success">{t("exp.paymentUpdated")}</Alert>}
      {error === "payment" && <Alert variant="danger">{t("exp.error.payment")}</Alert>}
      {error === "required" && <Alert variant="danger">{t("exp.error.required")}</Alert>}

      {isPosted && (
        <Card>
          <CardBody>
            <p className="payment-status-line">
              <span className="muted">{t("exp.paymentStatus")}:</span>
              <Badge variant={paymentBadgeVariant(exp.paymentStatus)}>
                {t(`pay.${exp.paymentStatus}` as TKey)}
              </Badge>
              <span className="tabular-nums">
                {formatYen(exp.amountPaid, lang)} / {formatYen(exp.totalAmount, lang)}
              </span>
            </p>
          </CardBody>
        </Card>
      )}

      {isDraft ? (
        <Card>
          <CardBody>
            <form action={updateExpense} className="stack">
              <input type="hidden" name="id" value={exp.id} />
              <div className="form-grid form-grid-header">
                <div className="form-group">
                  <label className="form-label">{t("exp.supplier")}</label>
                  <select name="supplierId" defaultValue={exp.supplierId ?? ""} className="select">
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
                  <label className="form-label">{t("exp.date")}</label>
                  <input
                    name="expenseDate"
                    type="date"
                    required
                    defaultValue={exp.expenseDate.toISOString().slice(0, 10)}
                    className="input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">{t("exp.dueDate")}</label>
                  <input
                    name="dueDate"
                    type="date"
                    defaultValue={exp.dueDate?.toISOString().slice(0, 10) ?? ""}
                    className="input"
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">{t("exp.description")}</label>
                <input name="description" type="text" defaultValue={exp.description} className="input" />
              </div>
              <div className="form-group">
                <label className="form-label">{t("exp.lines")}</label>
                <LineItemsEditor
                  taxable={taxable}
                  defaultTaxRate={settings.defaultTaxRate as TaxRate}
                  defaults={exp.lines.map((l) => ({
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
                <label className="form-label">{t("exp.notes")}</label>
                <textarea name="notes" rows={2} defaultValue={exp.notes ?? ""} className="textarea" />
              </div>
              <button type="submit" className="btn btn-primary">
                {t("exp.save")}
              </button>
            </form>
          </CardBody>
        </Card>
      ) : (
        <Card>
          <CardBody>
            {exp.description && <p>{exp.description}</p>}
            <p className="muted">{formatDate(exp.expenseDate, lang)}</p>
            <ul className="stack" style={{ marginTop: "1rem" }}>
              {exp.lines.map((l) => (
                <li
                  key={l.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    borderBottom: "1px solid var(--border-color, #eee)",
                    paddingBlock: "0.5rem",
                  }}
                >
                  <span>
                    {l.description} × {l.quantity}
                  </span>
                  <span className="tabular-nums" style={{ fontWeight: 600 }}>
                    {formatYen(l.lineTotal, lang)}
                  </span>
                </li>
              ))}
            </ul>
            <p className="text-right tabular-nums" style={{ marginTop: "1rem", fontSize: "1.125rem", fontWeight: 700 }}>
              {formatYen(exp.totalAmount, lang)}
            </p>
          </CardBody>
        </Card>
      )}

      <div className="stack" style={{ flexDirection: "row", flexWrap: "wrap", gap: "0.75rem" }}>
        {canPostExpense(exp.status) && (
          <form action={postExpense}>
            <input type="hidden" name="id" value={exp.id} />
            <button type="submit" className="btn btn-success">
              {t("exp.post")}
            </button>
          </form>
        )}
        {canVoidExpense(exp.status) && (
          <form action={voidExpense}>
            <input type="hidden" name="id" value={exp.id} />
            <button type="submit" className="btn btn-danger">
              {t("exp.void")}
            </button>
          </form>
        )}
      </div>

      {isPosted && (
        <Card>
          <CardBody>
            <form action={recordExpensePayment} className="stack">
              <input type="hidden" name="id" value={exp.id} />
              <h2 style={{ fontWeight: 600 }}>{t("exp.recordPayment")}</h2>
              <div className="form-group">
                <label className="form-label">{t("exp.amountPaid")}</label>
                <input
                  name="amountPaid"
                  type="number"
                  min={0}
                  max={exp.totalAmount}
                  defaultValue={exp.amountPaid}
                  className="input"
                />
              </div>
              <button type="submit" className="btn btn-primary">
                {t("exp.updatePayment")}
              </button>
            </form>
          </CardBody>
        </Card>
      )}

      <Card>
        <CardHeader>{t("exp.attachments")}</CardHeader>
        {exp.attachments.length === 0 ? (
          <CardBody>
            <p className="muted">{t("attach.empty")}</p>
          </CardBody>
        ) : (
          <ul>
            {exp.attachments.map((file) => (
              <li key={file.id} style={{ padding: "0.75rem 1.25rem" }}>
                <a href={`/api/files/${file.id}`} target="_blank" className="btn-link">
                  {file.originalName}
                </a>
                <span className="muted"> ({formatBytes(file.size)})</span>
              </li>
            ))}
          </ul>
        )}
        <CardFooter>
          <form action={addExpenseAttachments} className="stack" style={{ flexDirection: "row", gap: "0.75rem" }}>
            <input type="hidden" name="expenseId" value={exp.id} />
            <input name="files" type="file" multiple accept="image/*,application/pdf" className="input" style={{ flex: 1 }} />
            <button type="submit" className="btn btn-muted">
              {t("attach.upload")}
            </button>
          </form>
        </CardFooter>
      </Card>
    </div>
  );
}
