import Link from "next/link";
import { and, desc, eq, gte, lt } from "drizzle-orm";
import { db, expenses } from "@shime/db";
import { requireUser } from "@/lib/auth";
import { getT, type TKey } from "@/lib/i18n";
import { formatDate, formatYen } from "@shime/shared";
import { expenseBadgeVariant } from "@/components/TypeBadge";
import { PageToolbar } from "@/components/ui/PageToolbar";
import { ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { DataTable } from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/Badge";

export default async function ExpensesPage({
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
    gte(expenses.expenseDate, new Date(Date.UTC(year, 0, 1))),
    lt(expenses.expenseDate, new Date(Date.UTC(year + 1, 0, 1))),
  ];
  if (status) conditions.push(eq(expenses.status, status));

  const list = await db.query.expenses.findMany({
    where: and(...conditions),
    orderBy: [desc(expenses.expenseDate)],
    with: { supplier: { columns: { name: true, code: true } } },
  });

  const statuses = ["DRAFT", "POSTED", "VOID"] as const;

  return (
    <div className="stack-lg">
      <PageToolbar
        title={t("exp.title")}
        actions={
          <ButtonLink href="/expenses/new" variant="primary">
            + {t("exp.new")}
          </ButtonLink>
        }
      />

      <Card>
        <form method="GET" className="filter-bar">
          <input type="number" name="year" defaultValue={year} className="input" style={{ width: "6rem" }} />
          <select name="status" defaultValue={status ?? ""} className="select">
            <option value="">{t("ledger.allStatuses")}</option>
            {statuses.map((s) => (
              <option key={s} value={s}>
                {t(`exp.status.${s}` as TKey)}
              </option>
            ))}
          </select>
          <button type="submit" className="btn btn-muted">
            {t("ledger.filter")}
          </button>
        </form>
      </Card>

      <DataTable empty={list.length === 0 ? <div className="empty-state">{t("exp.empty")}</div> : undefined}>
        {list.length > 0 ? (
          <>
            <thead>
              <tr>
                <th>{t("exp.number")}</th>
                <th>{t("ledger.code")}</th>
                <th>{t("exp.description")}</th>
                <th>{t("exp.date")}</th>
                <th>{t("exp.statusLabel")}</th>
                <th className="text-right">{t("exp.total")}</th>
              </tr>
            </thead>
            <tbody>
              {list.map((exp) => (
                <tr key={exp.id}>
                  <td style={{ fontWeight: 600 }}>
                    <Link href={`/expenses/${exp.id}`} className="data-row-link">
                      {exp.number}
                    </Link>
                  </td>
                  <td className="muted">{exp.supplier?.code ?? "—"}</td>
                  <td>{exp.description || exp.supplier?.name || "—"}</td>
                  <td className="tabular-nums muted">{formatDate(exp.expenseDate, lang)}</td>
                  <td>
                    <Badge variant={expenseBadgeVariant(exp.status)}>
                      {t(`exp.status.${exp.status}` as TKey)}
                    </Badge>
                  </td>
                  <td className="text-right tabular-nums" style={{ fontWeight: 600 }}>
                    {formatYen(exp.totalAmount, lang)}
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
