import Link from "next/link";
import { and, asc, desc, eq, gte, lt } from "drizzle-orm";
import { customers, db, invoices } from "@shime/db";
import { requireUser } from "@/lib/auth";
import { getT, type TKey } from "@/lib/i18n";
import { formatDate, formatYen } from "@shime/shared";
import { PageToolbar } from "@/components/ui/PageToolbar";
import { ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { DataTable } from "@/components/ui/DataTable";
import { Badge, type BadgeVariant } from "@/components/ui/Badge";

function soBadgeVariant(status: string): BadgeVariant {
  if (status === "ISSUED") return "success";
  if (status === "VOID") return "danger";
  return "secondary";
}

export default async function SalesOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; status?: string; customerId?: string }>;
}) {
  await requireUser();
  const { t, lang } = await getT();
  const params = await searchParams;
  const year = Number(params.year) || new Date().getUTCFullYear();
  const status = params.status?.trim() || undefined;
  const customerId = params.customerId?.trim() || undefined;

  const conditions = [
    gte(invoices.issueDate, new Date(Date.UTC(year, 0, 1))),
    lt(invoices.issueDate, new Date(Date.UTC(year + 1, 0, 1))),
  ];
  if (status) conditions.push(eq(invoices.status, status));
  if (customerId) conditions.push(eq(invoices.customerId, customerId));

  const [list, customerList] = await Promise.all([
    db.query.invoices.findMany({
      where: and(...conditions),
      orderBy: [desc(invoices.issueDate)],
      with: { customer: { columns: { name: true, code: true } } },
    }),
    db.query.customers.findMany({ orderBy: [asc(customers.name)] }),
  ]);

  return (
    <div className="stack-lg">
      <PageToolbar
        title={t("so.title")}
        actions={
          <ButtonLink href="/sales-orders/new" variant="primary">
            + {t("so.new")}
          </ButtonLink>
        }
      />

      <Card>
        <form method="GET" className="filter-bar">
          <input type="number" name="year" defaultValue={year} className="input" style={{ width: "6rem" }} />
          <select name="status" defaultValue={status ?? ""} className="select">
            <option value="">{t("ledger.allStatuses")}</option>
            {(["DRAFT", "ISSUED", "VOID"] as const).map((s) => (
              <option key={s} value={s}>
                {t(`so.status.${s}` as TKey)}
              </option>
            ))}
          </select>
          <select name="customerId" defaultValue={customerId ?? ""} className="select">
            <option value="">{t("so.customer")}</option>
            {customerList.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <button type="submit" className="btn btn-muted">
            {t("ledger.filter")}
          </button>
        </form>
      </Card>

      <DataTable empty={list.length === 0 ? <div className="empty-state">{t("so.empty")}</div> : undefined}>
        {list.length > 0 ? (
          <>
            <thead>
              <tr>
                <th>{t("so.number")}</th>
                <th>{t("ledger.code")}</th>
                <th>{t("so.customer")}</th>
                <th>{t("so.issueDate")}</th>
                <th>{t("so.statusLabel")}</th>
                <th className="text-right">{t("so.total")}</th>
              </tr>
            </thead>
            <tbody>
              {list.map((so) => (
                <tr key={so.id}>
                  <td style={{ fontWeight: 600 }}>
                    <Link href={`/sales-orders/${so.id}`} className="data-row-link">
                      {so.number}
                    </Link>
                  </td>
                  <td className="muted">{so.customer.code ?? "—"}</td>
                  <td>{so.customer.name}</td>
                  <td className="tabular-nums muted">{formatDate(so.issueDate, lang)}</td>
                  <td>
                    <Badge variant={soBadgeVariant(so.status)}>
                      {t(`so.status.${so.status}` as TKey)}
                    </Badge>
                  </td>
                  <td className="text-right tabular-nums" style={{ fontWeight: 600 }}>
                    {formatYen(so.totalAmount, lang)}
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
