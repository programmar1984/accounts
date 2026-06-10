"use client";

import {
  useCallback,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import { AppSidebar, type SidebarNavItem } from "./AppSidebar";
import { AppTopbar } from "./AppTopbar";
import { getNavLabel } from "./app-nav";
import { APP_NAV_ITEMS } from "./app-nav";
import type { logout } from "@/lib/actions";

const DESKTOP_BREAKPOINT = 992;

export type ShellLabels = Record<string, string>;

export function AppShell({
  children,
  userRole,
  userName,
  labels,
  nextLang,
  logoutAction,
}: {
  children: ReactNode;
  userRole: string;
  userName: string;
  labels: ShellLabels;
  nextLang: "en" | "ja";
  logoutAction: typeof logout;
}) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  const navItems: SidebarNavItem[] = APP_NAV_ITEMS.filter(
    (item) => !item.adminOnly || userRole === "ADMIN"
  ).map((item) => ({
    href: item.href,
    label: labels[item.labelKey] ?? item.labelKey,
    icon: item.icon,
  }));

  const pageLabel = getNavLabel(pathname, APP_NAV_ITEMS.filter(
    (item) => !item.adminOnly || userRole === "ADMIN"
  ), labels);

  useEffect(() => {
    const mq = window.matchMedia(`(min-width: ${DESKTOP_BREAKPOINT}px)`);
    const sync = () => {
      const desktop = mq.matches;
      setIsDesktop(desktop);
      if (desktop) setSidebarOpen(false);
    };
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    document.body.classList.toggle("admin-sidebar-body-lock", sidebarOpen && !isDesktop);
    return () => document.body.classList.remove("admin-sidebar-body-lock");
  }, [sidebarOpen, isDesktop]);

  useEffect(() => {
    if (!sidebarOpen || isDesktop) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setSidebarOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [sidebarOpen, isDesktop]);

  const closeMobileSidebar = useCallback(() => {
    if (!isDesktop) setSidebarOpen(false);
  }, [isDesktop]);

  const toggleSidebar = useCallback(() => {
    if (window.matchMedia(`(min-width: ${DESKTOP_BREAKPOINT}px)`).matches) {
      setSidebarCollapsed((c) => !c);
      return;
    }
    setSidebarOpen((o) => !o);
  }, []);

  return (
    <div
      className="admin-wrapper"
      data-sidebar-open={sidebarOpen && !isDesktop ? "true" : undefined}
      data-sidebar-collapsed={sidebarCollapsed && isDesktop ? "true" : undefined}
    >
      <AppSidebar
        items={navItems}
        collapsed={isDesktop && sidebarCollapsed}
        brandSubtitle={labels["app.brandSubtitle"] ?? "締"}
        logoutLabel={labels["nav.logout"] ?? "Sign out"}
        themeToLight={labels["theme.toLight"] ?? "Light mode"}
        themeToDark={labels["theme.toDark"] ?? "Dark mode"}
        portalNavLabel={labels["nav.portalNav"] ?? "Main navigation"}
        onNavigate={closeMobileSidebar}
        logoutAction={logoutAction}
      />

      <button
        type="button"
        className="admin-sidebar-overlay"
        aria-label={labels["nav.closeNav"] ?? "Close menu"}
        aria-hidden={!(sidebarOpen && !isDesktop)}
        tabIndex={sidebarOpen && !isDesktop ? 0 : -1}
        onClick={closeMobileSidebar}
      />

      <div className="admin-main">
        <AppTopbar
          pageLabel={pageLabel}
          userName={userName}
          sidebarOpen={sidebarOpen}
          sidebarCollapsed={sidebarCollapsed}
          toggleNavLabel={labels["nav.toggleNav"] ?? "Toggle menu"}
          langSwitchLabel={labels["lang.switch"] ?? "Language"}
          nextLang={nextLang}
          themeToLight={labels["theme.toLight"] ?? "Light mode"}
          themeToDark={labels["theme.toDark"] ?? "Dark mode"}
          onToggleSidebar={toggleSidebar}
        />
        <main className="admin-content">
          <div className="admin-content-inner">{children}</div>
        </main>
      </div>
    </div>
  );
}
