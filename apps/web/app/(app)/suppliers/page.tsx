import Link from "next/link";
import { asc } from "drizzle-orm";
import { db, suppliers } from "@shime/db";
import { requireUser } from "@/lib/auth";
import { getT } from "@/lib/i18n";
import { setSupplierActive } from "@/lib/actions-counterparties";
import { PageToolbar } from "@/components/ui/PageToolbar";
import { ButtonLink } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { DataTable } from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/Badge";

export default async function SuppliersPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; created?: string }>;
}) {
  await requireUser();
  const { t } = await getT();
  const { error, created } = await searchParams;

  const list = await db.query.suppliers.findMany({ orderBy: asc(suppliers.name) });

  return (
    <div className="stack-lg">
      <PageToolbar
        title={t("supp.title")}
        actions={
          <ButtonLink href="/suppliers/new" variant="primary">
            + {t("supp.new")}
          </ButtonLink>
        }
      />

      {created && <Alert variant="success">{t("supp.created")}</Alert>}
      {error === "required" && (
        <Alert variant="danger">{t("supp.error.required")}</Alert>
      )}

      <DataTable
        empty={
          list.length === 0 ? (
            <div className="empty-state">{t("supp.empty")}</div>
          ) : undefined
        }
      >
        {list.length > 0 ? (
          <>
            <thead>
              <tr>
                <th>{t("supp.name")}</th>
                <th>{t("supp.code")}</th>
                <th>{t("supp.email")}</th>
                <th>{t("supp.status")}</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {list.map((s) => (
                <tr key={s.id}>
                  <td style={{ fontWeight: 600 }}>
                    <Link href={`/suppliers/${s.id}`} className="data-row-link">
                      {s.name}
                    </Link>
                  </td>
                  <td className="muted">{s.code ?? "—"}</td>
                  <td className="muted">{s.email ?? "—"}</td>
                  <td>
                    <Badge variant={s.active ? "success" : "secondary"}>
                      {s.active ? t("supp.active") : t("supp.inactive")}
                    </Badge>
                  </td>
                  <td className="text-right">
                    <form action={setSupplierActive}>
                      <input type="hidden" name="id" value={s.id} />
                      <input type="hidden" name="active" value={s.active ? "false" : "true"} />
                      <button
                        type="submit"
                        className={`btn-link ${s.active ? "danger" : ""}`}
                      >
                        {s.active ? t("supp.deactivate") : t("supp.activate")}
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
