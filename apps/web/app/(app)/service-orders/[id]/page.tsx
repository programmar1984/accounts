import Link from "next/link";
import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { db, serviceOrderLines, serviceOrders } from "@shime/db";
import { requireUser } from "@/lib/auth";
import { getT, type TKey } from "@/lib/i18n";
import { formatBytes, formatDate, formatYen, SERVICE_CATEGORIES, type TaxRate } from "@shime/shared";
import {
  addServiceOrderAttachments,
  cancelServiceOrder,
  deleteServiceOrderAttachment,
  postServiceOrder,
  recordSvoPayment,
  updateServiceOrder,
  voidServiceOrder,
} from "@/lib/actions-service-orders";
import { getCompanySettings } from "@/lib/company-settings";
import { LineItemsEditor } from "@/components/LineItemsEditor";
import { canCancelSvo, canPostSvo, canVoidSvo } from "@shime/shared";
import { PageToolbar } from "@/components/ui/PageToolbar";
import { ButtonLink } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Card, CardBody, CardFooter, CardHeader } from "@/components/ui/Card";
import { paymentBadgeVariant } from "@/components/TypeBadge";

export default async function ServiceOrderDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    saved?: string;
    posted?: string;
    payment?: string;
    error?: string;
  }>;
}) {
  await requireUser();
  const { t, lang } = await getT();
  const { id } = await params;
  const { saved, posted, payment, error } = await searchParams;

  const settings = await getCompanySettings();
  const taxable = settings.jctStatus === "TAXABLE";

  const svo = await db.query.serviceOrders.findFirst({
    where: eq(serviceOrders.id, id),
    with: {
      supplier: true,
      lines: { orderBy: asc(serviceOrderLines.sortOrder) },
      attachments: true,
    },
  });
  if (!svo) notFound();

  const isDraft = svo.status === "DRAFT";
  const isPosted = svo.status === "POSTED";

  return (
    <div className="stack-lg form-page">
      <PageToolbar
        title={svo.number}
        subtitle={`${t(`svo.status.${svo.status}` as TKey)} · ${t(`svo.category.${svo.serviceCategory}` as TKey)} · ${svo.supplier.name}${svo.supplier.code ? ` (${svo.supplier.code})` : ""}`}
        actions={
          <ButtonLink href="/service-orders" variant="muted" size="sm">
            ← {t("svo.title")}
          </ButtonLink>
        }
      />

      {saved && <Alert variant="success">{t("svo.saved")}</Alert>}
      {posted && <Alert variant="success">{t("svo.posted")}</Alert>}
      {payment && <Alert variant="success">{t("svo.paymentUpdated")}</Alert>}
      {error === "payment" && <Alert variant="danger">{t("svo.error.payment")}</Alert>}
      {error === "type" && <Alert variant="danger">{t("attach.error.type")}</Alert>}
      {error === "size" && <Alert variant="danger">{t("attach.error.size")}</Alert>}
      {error === "required" && <Alert variant="danger">{t("svo.error.required")}</Alert>}

      {isPosted && (
        <Card>
          <CardBody>
            <p className="payment-status-line">
              <span className="muted">{t("svo.paymentStatus")}:</span>
              <Badge variant={paymentBadgeVariant(svo.paymentStatus)}>
                {t(`pay.${svo.paymentStatus}` as TKey)}
              </Badge>
              <span className="tabular-nums">
                {formatYen(svo.amountPaid, lang)} / {formatYen(svo.totalAmount, lang)}
              </span>
            </p>
          </CardBody>
        </Card>
      )}

      {isDraft ? (
        <Card>
          <CardBody>
            <form action={updateServiceOrder} className="stack">
              <input type="hidden" name="id" value={svo.id} />
              <div className="form-grid form-grid-header">
                <div className="form-group">
                  <label className="form-label" htmlFor="serviceCategory">
                    {t("svo.category")}
                  </label>
                  <select
                    id="serviceCategory"
                    name="serviceCategory"
                    required
                    defaultValue={svo.serviceCategory}
                    className="select"
                  >
                    {SERVICE_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {t(`svo.category.${cat}` as TKey)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">{t("svo.issueDate")}</label>
                  <input
                    name="issueDate"
                    type="date"
                    required
                    defaultValue={svo.issueDate.toISOString().slice(0, 10)}
                    className="input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">{t("svo.dueDate")}</label>
                  <input
                    name="dueDate"
                    type="date"
                    defaultValue={svo.dueDate?.toISOString().slice(0, 10) ?? ""}
                    className="input"
                  />
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
                  defaults={svo.lines.map((l) => ({
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
                    taxable: t("line.taxable"),
                    nonTaxable: t("line.nonTaxable"),
                    rate: t("line.rate"),
                    rate10: t("tax.rate10"),
                    rate8: t("tax.rate8"),
                    rate0: t("tax.rate0"),
                    add: t("line.add"),
                    remove: t("line.remove"),
                  }}
                />
              </div>
              <div className="form-group">
                <label className="form-label">{t("svo.notes")}</label>
                <textarea name="notes" rows={2} defaultValue={svo.notes ?? ""} className="textarea" />
              </div>
              <button type="submit" className="btn btn-primary">
                {t("svo.save")}
              </button>
            </form>
          </CardBody>
        </Card>
      ) : (
        <Card>
          <CardBody>
            <p className="muted">
              {formatDate(svo.issueDate, lang)}
              {svo.dueDate ? ` → ${formatDate(svo.dueDate, lang)}` : ""}
            </p>
            <p className="muted" style={{ marginTop: "0.5rem" }}>
              {t("svo.category")}: {t(`svo.category.${svo.serviceCategory}` as TKey)}
            </p>
            <ul className="stack" style={{ marginTop: "1rem" }}>
              {svo.lines.map((l) => (
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
            {taxable && svo.totalTax > 0 && (
              <div className="muted" style={{ marginTop: "1rem", fontSize: "0.88rem" }}>
                <p>{t("tax.subtotalExTax")}: {formatYen(svo.subtotalExTax, lang)}</p>
                <p>{t("tax.totalTax")}: {formatYen(svo.totalTax, lang)}</p>
              </div>
            )}
            <p
              className="text-right tabular-nums"
              style={{ marginTop: "1rem", fontSize: "1.125rem", fontWeight: 700 }}
            >
              {formatYen(svo.totalAmount, lang)}
            </p>
          </CardBody>
        </Card>
      )}

      <div className="stack" style={{ flexDirection: "row", flexWrap: "wrap", gap: "0.75rem" }}>
        {canPostSvo(svo.status) && (
          <form action={postServiceOrder}>
            <input type="hidden" name="id" value={svo.id} />
            <button type="submit" className="btn btn-success">
              {t("svo.post")}
            </button>
          </form>
        )}
        {canVoidSvo(svo.status) && (
          <form action={voidServiceOrder}>
            <input type="hidden" name="id" value={svo.id} />
            <button type="submit" className="btn btn-danger">
              {t("svo.void")}
            </button>
          </form>
        )}
        {canCancelSvo(svo.status) && svo.status === "DRAFT" && (
          <form action={cancelServiceOrder}>
            <input type="hidden" name="id" value={svo.id} />
            <button type="submit" className="btn btn-muted">
              {t("svo.cancel")}
            </button>
          </form>
        )}
      </div>

      {isPosted && (
        <Card>
          <CardBody>
            <form action={recordSvoPayment} className="stack">
              <input type="hidden" name="id" value={svo.id} />
              <h2 style={{ fontWeight: 600 }}>{t("svo.recordPayment")}</h2>
              <div className="form-group">
                <label className="form-label" htmlFor="amountPaid">
                  {t("svo.amountPaid")}
                </label>
                <input
                  id="amountPaid"
                  name="amountPaid"
                  type="number"
                  min={0}
                  max={svo.totalAmount}
                  step={1}
                  defaultValue={svo.amountPaid}
                  className="input"
                />
              </div>
              <button type="submit" className="btn btn-primary">
                {t("svo.updatePayment")}
              </button>
            </form>
          </CardBody>
        </Card>
      )}

      <Card>
        <CardHeader>{t("svo.attachments")}</CardHeader>
        {svo.attachments.length === 0 ? (
          <CardBody>
            <p className="muted">{t("attach.empty")}</p>
          </CardBody>
        ) : (
          <ul className="stack">
            {svo.attachments.map((file) => (
              <li
                key={file.id}
                className="stack"
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: "1rem",
                  padding: "0.75rem 1.25rem",
                  borderBottom: "1px solid var(--border-color, #eee)",
                }}
              >
                <a href={`/api/files/${file.id}`} target="_blank" className="btn-link" style={{ flex: 1 }}>
                  {file.originalName}
                </a>
                <span className="muted" style={{ fontSize: "0.75rem" }}>
                  {formatBytes(file.size)}
                </span>
                {isDraft && (
                  <form action={deleteServiceOrderAttachment}>
                    <input type="hidden" name="id" value={file.id} />
                    <button type="submit" className="btn-link danger">
                      {t("attach.delete")}
                    </button>
                  </form>
                )}
              </li>
            ))}
          </ul>
        )}
        <CardFooter>
          <form
            action={addServiceOrderAttachments}
            className="stack"
            style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: "0.75rem" }}
          >
            <input type="hidden" name="serviceOrderId" value={svo.id} />
            <input
              name="files"
              type="file"
              multiple
              accept="image/*,application/pdf"
              className="input"
              style={{ flex: 1 }}
            />
            <button type="submit" className="btn btn-muted">
              {t("attach.upload")}
            </button>
          </form>
        </CardFooter>
      </Card>
    </div>
  );
}
