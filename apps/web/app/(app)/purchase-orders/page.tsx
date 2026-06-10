import Link from "next/link";
import { and, desc, eq, gte, lt } from "drizzle-orm";
import { db, purchaseOrders } from "@shime/db";
import { requireUser } from "@/lib/auth";
import { getT, type TKey } from "@/lib/i18n";
import { formatDate, formatYen } from "@shime/shared";
import { poBadgeVariant } from "@/components/TypeBadge";
import { PageToolbar } from "@/components/ui/PageToolbar";
import { ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { DataTable } from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/Badge";

export default async function PurchaseOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; status?: string }>;
}) {
  await requireUser();
  const { t, lang } = await getT();
  const params = await searchParams;
  const year = Number(params.year) || new Date().getUTCFullYear();
  const status = params.status?.trim() || undefined;

  const conditions = [
    gte(purchaseOrders.issueDate, new Date(Date.UTC(year, 0, 1))),
    lt(purchaseOrders.issueDate, new Date(Date.UTC(year + 1, 0, 1))),
  ];
  if (status) conditions.push(eq(purchaseOrders.status, status));

  const list = await db.query.purchaseOrders.findMany({
    where: and(...conditions),
    orderBy: [desc(purchaseOrders.issueDate)],
    with: { supplier: { columns: { name: true, code: true } } },
  });

  const statuses = ["DRAFT", "POSTED", "VOID", "CANCELLED"] as const;

  return (
    <div className="stack-lg">
      <PageToolbar
        title={t("po.title")}
        actions={
          <ButtonLink href="/purchase-orders/new" variant="primary">
            + {t("po.new")}
          </ButtonLink>
        }
      />

      <Card>
        <form method="GET" className="filter-bar">
          <input
            type="number"
            name="year"
            defaultValue={year}
            className="input"
            style={{ width: "6rem" }}
          />
          <select name="status" defaultValue={status ?? ""} className="select">
            <option value="">{t("tx.allTypes")}</option>
            {statuses.map((s) => (
              <option key={s} value={s}>
                {t(`po.status.${s}` as TKey)}
              </option>
            ))}
          </select>
          <button type="submit" className="btn btn-muted">
            {t("tx.filter")}
          </button>
        </form>
      </Card>

      <DataTable
        empty={
          list.length === 0 ? (
            <div className="empty-state">{t("po.empty")}</div>
          ) : undefined
        }
      >
        {list.length > 0 ? (
          <>
            <thead>
              <tr>
                <th>{t("po.number")}</th>
                <th>{t("ledger.code")}</th>
                <th>{t("po.supplier")}</th>
                <th>{t("po.issueDate")}</th>
                <th>Status</th>
                <th className="text-right">{t("inv.total")}</th>
              </tr>
            </thead>
            <tbody>
              {list.map((po) => (
                <tr key={po.id}>
                  <td style={{ fontWeight: 600 }}>
                    <Link href={`/purchase-orders/${po.id}`} className="data-row-link">
                      {po.number}
                    </Link>
                  </td>
                  <td className="muted">{po.supplier.code ?? "—"}</td>
                  <td>{po.supplier.name}</td>
                  <td className="tabular-nums muted">
                    {formatDate(po.issueDate, lang)}
                  </td>
                  <td>
                    <Badge variant={poBadgeVariant(po.status)}>
                      {t(`po.status.${po.status}` as TKey)}
                    </Badge>
                  </td>
                  <td className="text-right tabular-nums" style={{ fontWeight: 600 }}>
                    {formatYen(po.totalAmount, lang)}
                  </td>
                </tr>
              ))}
            </tbody>
          </>
        ) : null}
      </DataTable>
    </div>
  );
}
