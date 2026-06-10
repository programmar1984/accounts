import Link from "next/link";
import { asc } from "drizzle-orm";
import { customers, db } from "@shime/db";
import { requireUser } from "@/lib/auth";
import { getT } from "@/lib/i18n";
import { setCustomerActive } from "@/lib/actions-counterparties";
import { PageToolbar } from "@/components/ui/PageToolbar";
import { ButtonLink } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { DataTable } from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/Badge";

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; created?: string }>;
}) {
  await requireUser();
  const { t } = await getT();
  const { error, created } = await searchParams;

  const list = await db.query.customers.findMany({ orderBy: asc(customers.name) });

  return (
    <div className="stack-lg">
      <PageToolbar
        title={t("cust.title")}
        actions={
          <ButtonLink href="/customers/new" variant="primary">
            + {t("cust.new")}
          </ButtonLink>
        }
      />

      {created && <Alert variant="success">{t("cust.created")}</Alert>}
      {error === "required" && (
        <Alert variant="danger">{t("cust.error.required")}</Alert>
      )}

      <DataTable
        empty={
          list.length === 0 ? (
            <div className="empty-state">{t("cust.empty")}</div>
          ) : undefined
        }
      >
        {list.length > 0 ? (
          <>
            <thead>
              <tr>
                <th>{t("cust.name")}</th>
                <th>{t("cust.code")}</th>
                <th>{t("cust.email")}</th>
                <th>{t("cust.status")}</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {list.map((c) => (
                <tr key={c.id}>
                  <td style={{ fontWeight: 600 }}>
                    <Link href={`/customers/${c.id}`} className="data-row-link">
                      {c.name}
                    </Link>
                  </td>
                  <td className="muted">{c.code ?? "—"}</td>
                  <td className="muted">{c.email ?? "—"}</td>
                  <td>
                    <Badge variant={c.active ? "success" : "secondary"}>
                      {c.active ? t("cust.active") : t("cust.inactive")}
                    </Badge>
                  </td>
                  <td className="text-right">
                    <form action={setCustomerActive}>
                      <input type="hidden" name="id" value={c.id} />
                      <input type="hidden" name="active" value={c.active ? "false" : "true"} />
                      <button
                        type="submit"
                        className={`btn-link ${c.active ? "danger" : ""}`}
                      >
                        {c.active ? t("cust.deactivate") : t("cust.activate")}
                      </button>
                    </form>
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
