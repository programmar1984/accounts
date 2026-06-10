import { asc } from "drizzle-orm";
import { db, users } from "@shime/db";
import { requireAdmin } from "@/lib/auth";
import { getT, type TKey } from "@/lib/i18n";
import { formatDate } from "@shime/shared";
import { createUser, setUserActive } from "@/lib/actions";
import { PageToolbar } from "@/components/ui/PageToolbar";
import { Alert } from "@/components/ui/Alert";
import { DataTable } from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/Badge";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; created?: string }>;
}) {
  const session = await requireAdmin();
  const { t, lang } = await getT();
  const { error, created } = await searchParams;

  const usersList = await db.query.users.findMany({
    orderBy: asc(users.createdAt),
  });

  return (
    <div className="stack-lg">
      <PageToolbar title={t("users.title")} />

      {created && <Alert variant="success">{t("users.created")}</Alert>}
      {error === "exists" && (
        <Alert variant="danger">{t("users.error.exists")}</Alert>
      )}
      {error === "required" && (
        <Alert variant="danger">{t("users.error.required")}</Alert>
      )}

      <DataTable>
        <thead>
          <tr>
            <th>{t("users.name")}</th>
            <th>{t("users.email")}</th>
            <th>{t("users.role")}</th>
            <th>{t("users.status")}</th>
            <th>{t("users.createdAt")}</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {usersList.map((user) => (
            <tr key={user.id}>
              <td style={{ fontWeight: 600 }}>
                {user.name}
                {user.id === session.userId && (
                  <span className="muted" style={{ marginLeft: "0.5rem", fontSize: "0.75rem" }}>
                    ({t("users.you")})
                  </span>
                )}
              </td>
              <td className="muted">{user.email}</td>
              <td>{t(`role.${user.role}` as TKey)}</td>
              <td>
                <Badge variant={user.active ? "success" : "secondary"}>
                  {user.active ? t("users.active") : t("users.inactive")}
                </Badge>
              </td>
              <td className="tabular-nums muted">
                {formatDate(user.createdAt, lang)}
              </td>
              <td className="text-right">
                {user.id !== session.userId && (
                  <form action={setUserActive}>
                    <input type="hidden" name="id" value={user.id} />
                    <input
                      type="hidden"
                      name="active"
                      value={user.active ? "false" : "true"}
                    />
                    <button
                      type="submit"
                      className={`btn-link ${user.active ? "danger" : ""}`}
                    >
                      {user.active ? t("users.deactivate") : t("users.activate")}
                    </button>
                  </form>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </DataTable>

      <Card>
        <CardHeader>{t("users.create")}</CardHeader>
        <CardBody>
          <form action={createUser} className="form-grid form-grid-2">
            <div className="form-group">
              <label className="form-label" htmlFor="name">
                {t("users.name")}
              </label>
              <input id="name" name="name" type="text" required className="input" />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="email">
                {t("users.email")}
              </label>
              <input id="email" name="email" type="email" required className="input" />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="password">
                {t("users.password")}
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                minLength={8}
                className="input"
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="role">
                {t("users.role")}
              </label>
              <select id="role" name="role" defaultValue="MEMBER" className="select">
                <option value="MEMBER">{t("role.MEMBER")}</option>
                <option value="ADMIN">{t("role.ADMIN")}</option>
              </select>
            </div>
            <div className="form-group" style={{ gridColumn: "1 / -1" }}>
              <button type="submit" className="btn btn-primary">
                {t("users.create")}
              </button>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
