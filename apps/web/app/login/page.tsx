import { redirect } from "next/navigation";
import { login } from "@/lib/actions";
import { getActiveSession } from "@/lib/auth";
import { getT } from "@/lib/i18n";
import { LangToggle } from "@/components/LangToggle";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Alert } from "@/components/ui/Alert";

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
      <main className="login-page">
        <div className="login-box">
          <div className="login-brand">
            <div className="login-brand-title">
              SHIME <span className="muted">締</span>
            </div>
            <p className="login-brand-sub">{t("login.subtitle")}</p>
          </div>

          <div className="card">
            <div className="card-body">
              <h1 className="page-title" style={{ fontSize: "1.1rem", marginBottom: "1rem" }}>
                {t("login.title")}
              </h1>

              {error ? <Alert variant="danger">{t("login.error")}</Alert> : null}

              <form action={login} className="form-grid" style={{ marginTop: "1rem" }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="email">
                    {t("login.email")}
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    className="input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="password">
                    {t("login.password")}
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    autoComplete="current-password"
                    className="input"
                  />
                </div>
                <button type="submit" className="btn btn-primary btn-block">
                  {t("login.submit")}
                </button>
              </form>
            </div>
          </div>

          <div
            className="login-brand-sub"
            style={{
              marginTop: "1rem",
              display: "flex",
              justifyContent: "center",
              gap: "0.75rem",
              alignItems: "center",
            }}
          >
            <LangToggle
              label={t("lang.switch")}
              nextLang={lang === "en" ? "ja" : "en"}
              className="btn-link btn-sm"
            />
            <ThemeToggle
              labelLight={t("theme.toLight")}
              labelDark={t("theme.toDark")}
            />
          </div>
        </div>
      </main>
  );
}
