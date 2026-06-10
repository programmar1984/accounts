import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { getT } from "@/lib/i18n";
import { logout } from "@/lib/actions";
import { LangToggle } from "@/components/LangToggle";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireUser();
  const { t, lang } = await getT();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-14 max-w-5xl items-center gap-6 px-4">
          <Link href="/" className="text-lg font-bold tracking-tight">
            SHIME <span className="font-normal text-slate-400">締</span>
          </Link>
          <nav className="flex items-center gap-4 text-sm font-medium text-slate-600">
            <Link href="/" className="hover:text-slate-900">
              {t("nav.dashboard")}
            </Link>
            <Link href="/transactions" className="hover:text-slate-900">
              {t("nav.transactions")}
            </Link>
            <Link href="/customers" className="hover:text-slate-900">
              {t("nav.customers")}
            </Link>
            <Link href="/suppliers" className="hover:text-slate-900">
              {t("nav.suppliers")}
            </Link>
            <Link href="/invoices" className="hover:text-slate-900">
              {t("nav.invoices")}
            </Link>
            <Link href="/purchase-orders" className="hover:text-slate-900">
              {t("nav.purchaseOrders")}
            </Link>
            {session.role === "ADMIN" && (
              <Link href="/users" className="hover:text-slate-900">
                {t("nav.users")}
              </Link>
            )}
          </nav>
          <div className="ml-auto flex items-center gap-4 text-sm">
            <LangToggle
              label={t("lang.switch")}
              nextLang={lang === "en" ? "ja" : "en"}
              className="text-slate-500 underline-offset-2 hover:underline"
            />
            <span className="hidden text-slate-500 sm:inline">{session.name}</span>
            <form action={logout}>
              <button
                type="submit"
                className="rounded-lg border border-slate-300 px-3 py-1.5 font-medium text-slate-600 hover:bg-slate-50"
              >
                {t("nav.logout")}
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">{children}</main>
    </div>
  );
}
