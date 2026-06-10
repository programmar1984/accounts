import { asc } from "drizzle-orm";
import { db, users } from "@shime/db";
import { requireAdmin } from "@/lib/auth";
import { getT, type TKey } from "@/lib/i18n";
import { formatDate } from "@shime/shared";
import { createUser, setUserActive } from "@/lib/actions";

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

  const inputCls =
    "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none";

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t("users.title")}</h1>

      {created && (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {t("users.created")}
        </p>
      )}
      {error === "exists" && (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {t("users.error.exists")}
        </p>
      )}
      {error === "required" && (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {t("users.error.required")}
        </p>
      )}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400">
              <th className="px-5 py-3 font-medium">{t("users.name")}</th>
              <th className="px-3 py-3 font-medium">{t("users.email")}</th>
              <th className="px-3 py-3 font-medium">{t("users.role")}</th>
              <th className="px-3 py-3 font-medium">{t("users.status")}</th>
              <th className="px-3 py-3 font-medium">{t("users.createdAt")}</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {usersList.map((user) => (
              <tr key={user.id}>
                <td className="px-5 py-3 font-medium">
                  {user.name}
                  {user.id === session.userId && (
                    <span className="ml-2 text-xs text-slate-400">
                      ({t("users.you")})
                    </span>
                  )}
                </td>
                <td className="px-3 py-3 text-slate-500">{user.email}</td>
                <td className="px-3 py-3">{t(`role.${user.role}` as TKey)}</td>
                <td className="px-3 py-3">
                  <span
                    className={`inline-flex rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${
                      user.active
                        ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20"
                        : "bg-slate-100 text-slate-500 ring-slate-400/20"
                    }`}
                  >
                    {user.active ? t("users.active") : t("users.inactive")}
                  </span>
                </td>
                <td className="px-3 py-3 tabular-nums text-slate-500">
                  {formatDate(user.createdAt, lang)}
                </td>
                <td className="px-5 py-3 text-right">
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
                        className={`text-sm underline-offset-2 hover:underline ${
                          user.active ? "text-rose-600" : "text-emerald-700"
                        }`}
                      >
                        {user.active ? t("users.deactivate") : t("users.activate")}
                      </button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 font-semibold">{t("users.create")}</h2>
        <form
          action={createUser}
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          <div>
            <label className="mb-1 block text-sm font-medium" htmlFor="name">
              {t("users.name")}
            </label>
            <input id="name" name="name" type="text" required className={inputCls} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium" htmlFor="email">
              {t("users.email")}
            </label>
            <input id="email" name="email" type="email" required className={inputCls} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium" htmlFor="password">
              {t("users.password")}
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={8}
              className={inputCls}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium" htmlFor="role">
              {t("users.role")}
            </label>
            <select id="role" name="role" defaultValue="MEMBER" className={inputCls}>
              <option value="MEMBER">{t("role.MEMBER")}</option>
              <option value="ADMIN">{t("role.ADMIN")}</option>
            </select>
          </div>
          <div className="sm:col-span-2 lg:col-span-4">
            <button
              type="submit"
              className="rounded-lg bg-slate-900 px-5 py-2 text-sm font-medium text-white hover:bg-slate-700"
            >
              {t("users.create")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
