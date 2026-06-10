"use client";

import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import type { Theme } from "@/lib/theme";
import { THEME_COOKIE } from "@/lib/theme";

type ThemeContextValue = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function readDomTheme(): Theme {
  if (typeof document === "undefined") return "light";
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

export function ThemeProvider({
  children,
  initialTheme,
}: {
  children: ReactNode;
  initialTheme: Theme;
}) {
  const router = useRouter();
  const [theme, setThemeState] = useState<Theme>(initialTheme);

  useLayoutEffect(() => {
    const domTheme = readDomTheme();
    if (domTheme !== initialTheme) {
      setThemeState(domTheme);
    }
  }, [initialTheme]);

  const setTheme = useCallback(
    (next: Theme) => {
      document.documentElement.dataset.theme = next;
      document.cookie = `${THEME_COOKIE}=${next};path=/;max-age=31536000;samesite=lax`;
      setThemeState(next);
      router.refresh();
    },
    [router]
  );

  const toggleTheme = useCallback(() => {
    const next = (readDomTheme() === "dark" ? "light" : "dark") as Theme;
    setTheme(next);
  }, [setTheme]);

  const value = useMemo(
    () => ({ theme, setTheme, toggleTheme }),
    [theme, setTheme, toggleTheme]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
