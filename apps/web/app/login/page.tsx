import { redirect } from "next/navigation";
import { login } from "@/lib/actions";
import { getActiveSession } from "@/lib/auth";
import { getT } from "@/lib/i18n";
import { LangToggle } from "@/components/LangToggle";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await getActiveSession();
  if (session) redirect("/");

  const { error } = await searchParams;
  const { t, lang } = await getT();

  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="text-4xl font-bold tracking-tight">
            SHIME <span className="text-slate-400 font-normal">締</span>
          </div>
          <p className="mt-2 text-sm text-slate-500">{t("login.subtitle")}</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="mb-4 text-lg font-semibold">{t("login.title")}</h1>

          {error && (
            <p className="mb-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {t("login.error")}
            </p>
          )}

          <form action={login} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium" htmlFor="email">
                {t("login.email")}
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium" htmlFor="password">
                {t("login.password")}
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
            >
              {t("login.submit")}
            </button>
          </form>
        </div>

        <div className="mt-4 text-center">
          <LangToggle
            label={t("lang.switch")}
            nextLang={lang === "en" ? "ja" : "en"}
            className="text-sm text-slate-500 underline-offset-2 hover:underline"
          />
        </div>
      </div>
    </main>
  );
}
