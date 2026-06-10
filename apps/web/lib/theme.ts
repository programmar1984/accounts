export const THEME_COOKIE = "shime_theme";
export type Theme = "light" | "dark";

export function resolveTheme(cookieValue: string | undefined): Theme {
  if (cookieValue === "dark" || cookieValue === "light") return cookieValue;
  return "light";
}

export function themeCookieScript(): string {
  return `(function(){try{var m=document.cookie.match(/(?:^|; )shime_theme=([^;]*)/);var t=m?decodeURIComponent(m[1]):null;if(t!=="light"&&t!=="dark"){t="light";}document.documentElement.dataset.theme=t;}catch(e){document.documentElement.dataset.theme="light";}})();`;
}
