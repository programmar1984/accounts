import { requireUser } from "@/lib/auth";
import { getT, type TKey } from "@/lib/i18n";
import { logout } from "@/lib/actions";
import { AppShell } from "@/components/layout/AppShell";
import { APP_NAV_ITEMS } from "@/components/layout/app-nav";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireUser();
  const { t, lang } = await getT();

  const labels: Record<string, string> = {
    "app.brandSubtitle": "締",
    "nav.portalNav": t("nav.portalNav"),
    "nav.toggleNav": t("nav.toggleNav"),
    "nav.closeNav": t("nav.closeNav"),
    "nav.logout": t("nav.logout"),
    "lang.switch": t("lang.switch"),
    "theme.toLight": t("theme.toLight"),
    "theme.toDark": t("theme.toDark"),
  };

  for (const item of APP_NAV_ITEMS) {
    labels[item.labelKey] = t(item.labelKey as TKey);
  }

  return (
    <AppShell
      userRole={session.role}
      userName={session.name}
      labels={labels}
      nextLang={lang === "en" ? "ja" : "en"}
      logoutAction={logout}
    >
      {children}
    </AppShell>
  );
}
