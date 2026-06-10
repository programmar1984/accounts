"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { isNavActive } from "./app-nav";
import { NavIcon } from "./nav-icons";
import type { NavIconId } from "./app-nav";
import type { logout } from "@/lib/actions";

export type SidebarNavItem = {
  href: string;
  label: string;
  icon: NavIconId;
};

export function AppSidebar({
  items,
  collapsed,
  brandSubtitle,
  logoutLabel,
  themeToLight,
  themeToDark,
  portalNavLabel,
  onNavigate,
  logoutAction,
}: {
  items: SidebarNavItem[];
  collapsed?: boolean;
  brandSubtitle: string;
  logoutLabel: string;
  themeToLight: string;
  themeToDark: string;
  portalNavLabel: string;
  onNavigate?: () => void;
  logoutAction: typeof logout;
}) {
  const pathname = usePathname();

  return (
    <aside
      id="admin-sidebar"
      className="admin-sidebar"
      role="navigation"
      aria-label={portalNavLabel}
      data-collapsed={collapsed ? "true" : undefined}
    >
      <div className="admin-sidebar-brand">
        <Link
          href="/"
          className="admin-sidebar-brand-link"
          onClick={onNavigate}
          title="SHIME"
        >
          <span className="admin-sidebar-brand-title">SHIME</span>
          <span className="admin-sidebar-brand-mark">SM</span>
          {!collapsed ? (
            <span className="admin-sidebar-brand-sub">{brandSubtitle}</span>
          ) : null}
        </Link>
      </div>

      <nav className="admin-sidebar-nav">
        <ul className="admin-sidebar-menu">
          {items.map((item) => {
            const active = isNavActive(pathname, item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`admin-sidebar-link${active ? " admin-sidebar-link--active" : ""}`}
                  onClick={onNavigate}
                  title={collapsed ? item.label : undefined}
                >
                  <NavIcon id={item.icon} />
                  <span className="admin-sidebar-link-label">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="admin-sidebar-footer">
        <div className="admin-sidebar-footer-actions" style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <ThemeToggle labelLight={themeToLight} labelDark={themeToDark} />
          <form action={logoutAction}>
            <button type="submit" className="btn btn-muted btn-sm btn-block">
              {logoutLabel}
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}
