export type NavIconId =
  | "dashboard"
  | "ledger"
  | "customers"
  | "suppliers"
  | "salesOrders"
  | "purchaseOrders"
  | "expenses"
  | "users"
  | "settings";

export type AppNavItem = {
  href: string;
  labelKey: string;
  icon: NavIconId;
  adminOnly?: boolean;
};

export const APP_NAV_ITEMS: AppNavItem[] = [
  { href: "/", labelKey: "nav.dashboard", icon: "dashboard" },
  { href: "/ledger", labelKey: "nav.ledger", icon: "ledger" },
  { href: "/purchase-orders", labelKey: "nav.purchaseOrders", icon: "purchaseOrders" },
  { href: "/sales-orders", labelKey: "nav.salesOrders", icon: "salesOrders" },
  { href: "/expenses", labelKey: "nav.expenses", icon: "expenses" },
  { href: "/customers", labelKey: "nav.customers", icon: "customers" },
  { href: "/suppliers", labelKey: "nav.suppliers", icon: "suppliers" },
  { href: "/users", labelKey: "nav.users", icon: "users", adminOnly: true },
  {
    href: "/settings/tax",
    labelKey: "nav.settings",
    icon: "settings",
    adminOnly: true,
  },
];

export function getVisibleNavItems(role: string): AppNavItem[] {
  return APP_NAV_ITEMS.filter((item) => !item.adminOnly || role === "ADMIN");
}

export function getNavLabel(pathname: string, items: AppNavItem[], labels: Record<string, string>): string {
  const sorted = [...items].sort((a, b) => b.href.length - a.href.length);
  const match =
    sorted.find(
      (item) =>
        item.href === "/" ? pathname === "/" : pathname.startsWith(item.href)
    ) ?? items[0];
  return labels[match.labelKey] ?? match.labelKey;
}

export function isNavActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}
