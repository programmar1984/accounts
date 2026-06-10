import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { db, purchaseOrderLines, purchaseOrders } from "@shime/db";
import { requireUser } from "@/lib/auth";
import { getT, type TKey } from "@/lib/i18n";
import { formatBytes, formatDate, formatYen } from "@shime/shared";
import {
  addPurchaseOrderAttachments,
  cancelPurchaseOrder,
  deletePurchaseOrderAttachment,
  postPurchaseOrder,
  recordPoPayment,
  updatePurchaseOrder,
  voidPurchaseOrder,
} from "@/lib/actions-purchase-orders";
import { getCompanySettings } from "@/lib/company-settings";
import { LineItemsEditor } from "@/components/LineItemsEditor";
import { canCancelPo, canPostPo, canVoidPo, type TaxRate } from "@shime/shared";
import { PageToolbar } from "@/components/ui/PageToolbar";
import { ButtonLink } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Card, CardBody, CardFooter, CardHeader } from "@/components/ui/Card";
import { paymentBadgeVariant } from "@/components/TypeBadge";

export default async function PurchaseOrderDetailPage({
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

  const po = await db.query.purchaseOrders.findFirst({
    where: eq(purchaseOrders.id, id),
    with: {
      supplier: true,
      lines: { orderBy: asc(purchaseOrderLines.sortOrder) },
      attachments: true,
    },
  });
  if (!po) notFound();

  const isDraft = po.status === "DRAFT";
  const isPosted = po.status === "POSTED";

  return (
    <div className="stack-lg" style={{ maxWidth: "48rem", marginInline: "auto" }}>
      <PageToolbar
        title={po.number}
        subtitle={`${t(`po.status.${po.status}` as TKey)} · ${po.supplier.name}${po.supplier.code ? ` (${po.supplier.code})` : ""}`}
        actions={
          <ButtonLink href="/purchase-orders" variant="muted" size="sm">
            ← {t("po.title")}
          </ButtonLink>
        }
      />

      {saved && <Alert variant="success">{t("po.saved")}</Alert>}
      {posted && <Alert variant="success">{t("po.posted")}</Alert>}
      {payment && <Alert variant="success">{t("po.paymentUpdated")}</Alert>}
      {error === "payment" && <Alert variant="danger">{t("po.error.payment")}</Alert>}
      {error === "type" && <Alert variant="danger">{t("attach.error.type")}</Alert>}
      {error === "size" && <Alert variant="danger">{t("attach.error.size")}</Alert>}
      {error === "required" && <Alert variant="danger">{t("po.error.required")}</Alert>}

      {isPosted && (
        <Card>
          <CardBody>
            <p>
              <span className="muted">{t("po.paymentStatus")}: </span>
              <Badge variant={paymentBadgeVariant(po.paymentStatus)}>
                {t(`pay.${po.paymentStatus}` as TKey)}
              </Badge>
              <span className="muted" style={{ marginLeft: "1rem" }}>
                {po.amountPaid} / {po.totalAmount} ¥
              </span>
            </p>
          </CardBody>
        </Card>
      )}

      {isDraft ? (
        <Card>
          <CardBody>
            <form action={updatePurchaseOrder} className="stack">
              <input type="hidden" name="id" value={po.id} />
              <div className="form-grid form-grid-2">
                <div className="form-group">
                  <label className="form-label">{t("po.issueDate")}</label>
                  <input
                    name="issueDate"
                    type="date"
                    required
                    defaultValue={po.issueDate.toISOString().slice(0, 10)}
                    className="input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">{t("po.dueDate")}</label>
                  <input
                    name="dueDate"
                    type="date"
                    defaultValue={po.dueDate?.toISOString().slice(0, 10) ?? ""}
                    className="input"
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">{t("po.lines")}</label>
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
                  defaults={po.lines.map((l) => ({
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
                <label className="form-label">{t("po.notes")}</label>
                <textarea name="notes" rows={2} defaultValue={po.notes ?? ""} className="textarea" />
              </div>
              <button type="submit" className="btn btn-primary">
                {t("po.save")}
              </button>
            </form>
          </CardBody>
        </Card>
      ) : (
        <Card>
          <CardBody>
            <p className="muted">
              {formatDate(po.issueDate, lang)}
              {po.dueDate ? ` → ${formatDate(po.dueDate, lang)}` : ""}
            </p>
            <ul className="stack" style={{ marginTop: "1rem" }}>
              {po.lines.map((l) => (
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
            {taxable && po.totalTax > 0 && (
              <div className="muted" style={{ marginTop: "1rem", fontSize: "0.88rem" }}>
                <p>{t("tax.subtotalExTax")}: {formatYen(po.subtotalExTax, lang)}</p>
                <p>{t("tax.totalTax")}: {formatYen(po.totalTax, lang)}</p>
              </div>
            )}
            <p
              className="text-right tabular-nums"
              style={{ marginTop: "1rem", fontSize: "1.125rem", fontWeight: 700 }}
            >
              {formatYen(po.totalAmount, lang)}
            </p>
          </CardBody>
        </Card>
      )}

      <div className="stack" style={{ flexDirection: "row", flexWrap: "wrap", gap: "0.75rem" }}>
        {canPostPo(po.status) && (
          <form action={postPurchaseOrder}>
            <input type="hidden" name="id" value={po.id} />
            <button type="submit" className="btn btn-success">
              {t("po.post")}
            </button>
          </form>
        )}
        {canVoidPo(po.status) && (
          <form action={voidPurchaseOrder}>
            <input type="hidden" name="id" value={po.id} />
            <button type="submit" className="btn btn-danger">
              {t("po.void")}
            </button>
          </form>
        )}
        {canCancelPo(po.status) && po.status === "DRAFT" && (
          <form action={cancelPurchaseOrder}>
            <input type="hidden" name="id" value={po.id} />
            <button type="submit" className="btn btn-muted">
              {t("po.cancel")}
            </button>
          </form>
        )}
      </div>

      {isPosted && (
        <Card>
          <CardBody>
            <form action={recordPoPayment} className="stack">
              <input type="hidden" name="id" value={po.id} />
              <h2 style={{ fontWeight: 600 }}>{t("po.recordPayment")}</h2>
              <div className="form-group">
                <label className="form-label" htmlFor="amountPaid">
                  {t("po.amountPaid")}
                </label>
                <input
                  id="amountPaid"
                  name="amountPaid"
                  type="number"
                  min={0}
                  max={po.totalAmount}
                  step={1}
                  defaultValue={po.amountPaid}
                  className="input"
                />
              </div>
              <button type="submit" className="btn btn-primary">
                {t("po.updatePayment")}
              </button>
            </form>
          </CardBody>
        </Card>
      )}

      <Card>
        <CardHeader>{t("po.attachments")}</CardHeader>
        {po.attachments.length === 0 ? (
          <CardBody>
            <p className="muted">{t("attach.empty")}</p>
          </CardBody>
        ) : (
          <ul className="stack">
            {po.attachments.map((file) => (
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
                  <form action={deletePurchaseOrderAttachment}>
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
            action={addPurchaseOrderAttachments}
            className="stack"
            style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: "0.75rem" }}
          >
            <input type="hidden" name="purchaseOrderId" value={po.id} />
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
