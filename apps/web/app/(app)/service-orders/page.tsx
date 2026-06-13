import Link from "next/link";
import { and, desc, eq, gte, lt } from "drizzle-orm";
import { cookies } from "next/headers";
import { db, serviceOrders } from "@shime/db";
import { requireUser } from "@/lib/auth";
import { applySvoFilter, clearSvoFilter } from "@/lib/actions-list-filters";
import { getSvoFilterFromSources, parseDateRange } from "@/lib/list-filters";
import { getT, type TKey } from "@/lib/i18n";
import { formatDate, formatYen } from "@shime/shared";
import { svoBadgeVariant } from "@/components/TypeBadge";
import { PageToolbar } from "@/components/ui/PageToolbar";
import { ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { DataTable } from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/Badge";

export default async function ServiceOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string; status?: string }>;
}) {
  await requireUser();
  const { t, lang } = await getT();
  const params = await searchParams;
  const filter = getSvoFilterFromSources(params, await cookies());
  const status = filter.status;
  const { start, endExclusive, valid } = parseDateRange(filter.from, filter.to);

  const conditions = valid
    ? [gte(serviceOrders.issueDate, start), lt(serviceOrders.issueDate, endExclusive)]
    : [];
  if (status) conditions.push(eq(serviceOrders.status, status));

  const list =
    conditions.length > 0
      ? await db.query.serviceOrders.findMany({
          where: and(...conditions),
          orderBy: [desc(serviceOrders.issueDate)],
          with: { supplier: { columns: { name: true, code: true } } },
        })
      : [];

  const statuses = ["DRAFT", "POSTED", "VOID", "CANCELLED"] as const;

  return (
    <div className="stack-lg">
      <PageToolbar
        title={t("svo.title")}
        actions={
          <ButtonLink href="/service-orders/new" variant="primary">
            + {t("svo.new")}
          </ButtonLink>
        }
      />

      <Card>
        <form action={applySvoFilter} className="filter-bar">
          <input
            type="date"
            name="from"
            defaultValue={filter.from}
            className="input"
            title={t("filter.dateFrom")}
            aria-label={t("filter.dateFrom")}
          />
          <input
            type="date"
            name="to"
            defaultValue={filter.to}
            className="input"
            title={t("filter.dateTo")}
            aria-label={t("filter.dateTo")}
          />
          <select name="status" defaultValue={status ?? ""} className="select">
            <option value="">{t("tx.allTypes")}</option>
            {statuses.map((s) => (
              <option key={s} value={s}>
                {t(`svo.status.${s}` as TKey)}
              </option>
            ))}
          </select>
          <button type="submit" className="btn btn-muted">
            {t("tx.filter")}
          </button>
          <button type="submit" formAction={clearSvoFilter} className="btn btn-muted">
            {t("filter.clear")}
          </button>
        </form>
      </Card>

      <DataTable
        empty={
          list.length === 0 ? (
            <div className="empty-state">{t("svo.empty")}</div>
          ) : undefined
        }
      >
        {list.length > 0 ? (
          <>
            <thead>
              <tr>
                <th>{t("svo.number")}</th>
                <th>{t("ledger.code")}</th>
                <th>{t("svo.supplier")}</th>
                <th>{t("svo.category")}</th>
                <th>{t("svo.issueDate")}</th>
                <th>Status</th>
                <th className="text-right">{t("inv.total")}</th>
              </tr>
            </thead>
            <tbody>
              {list.map((svo) => (
                <tr key={svo.id}>
                  <td style={{ fontWeight: 600 }}>
                    <Link
                      href={`/service-orders/${svo.id}`}
                      className="data-row-link"
                      title={svo.notes?.trim() || undefined}
                    >
                      {svo.number}
                    </Link>
                  </td>
                  <td className="muted">{svo.supplier.code ?? "—"}</td>
                  <td>{svo.supplier.name}</td>
                  <td className="muted">{t(`svo.category.${svo.serviceCategory}` as TKey)}</td>
                  <td className="tabular-nums muted">
                    {formatDate(svo.issueDate, lang)}
                  </td>
                  <td>
                    <Badge variant={svoBadgeVariant(svo.status)}>
                      {t(`svo.status.${svo.status}` as TKey)}
                    </Badge>
                  </td>
                  <td className="text-right tabular-nums" style={{ fontWeight: 600 }}>
                    {formatYen(svo.totalAmount, lang)}
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
