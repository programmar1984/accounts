import type { Lang } from "./lang";

export function formatYen(amount: number, lang: Lang = "en"): string {
  const formatted = new Intl.NumberFormat(lang === "ja" ? "ja-JP" : "en-US", {
    maximumFractionDigits: 0,
  }).format(amount);
  return lang === "ja" ? `${formatted}円` : `¥${formatted}`;
}

export function formatDate(date: Date, lang: Lang = "en"): string {
  return new Intl.DateTimeFormat(lang === "ja" ? "ja-JP" : "en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "UTC",
  }).format(date);
}

export function formatBytes(size: number): string {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}
