"use client";

import { ThemeToggle } from "@/components/theme/theme-toggle";
import { LangToggle } from "@/components/LangToggle";

function BurgerIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 7h16M4 12h16M4 17h16"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function AppTopbar({
  pageLabel,
  userName,
  sidebarOpen,
  sidebarCollapsed,
  toggleNavLabel,
  langSwitchLabel,
  nextLang,
  themeToLight,
  themeToDark,
  onToggleSidebar,
}: {
  pageLabel: string;
  userName: string;
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  toggleNavLabel: string;
  langSwitchLabel: string;
  nextLang: "en" | "ja";
  themeToLight: string;
  themeToDark: string;
  onToggleSidebar: () => void;
}) {
  const expanded = sidebarOpen || !sidebarCollapsed;

  return (
    <header className="admin-topbar">
      <div className="admin-topbar-start">
        <button
          type="button"
          className="admin-sidebar-toggle"
          onClick={onToggleSidebar}
          aria-label={toggleNavLabel}
          aria-controls="admin-sidebar"
          aria-expanded={expanded}
        >
          <BurgerIcon />
        </button>
        <div className="admin-topbar-breadcrumb">
          <span className="admin-topbar-crumb-muted">SHIME</span>
          <span className="admin-topbar-crumb-sep" aria-hidden>
            /
          </span>
          <span className="admin-topbar-crumb-current">{pageLabel}</span>
        </div>
      </div>

      <div className="admin-topbar-actions">
        <LangToggle label={langSwitchLabel} nextLang={nextLang} className="btn-link btn-sm" />
        <ThemeToggle labelLight={themeToLight} labelDark={themeToDark} />
        <span className="admin-topbar-user-name">{userName}</span>
      </div>
    </header>
  );
}
