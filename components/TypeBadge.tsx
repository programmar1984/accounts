const STYLES: Record<string, string> = {
  SALE: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  PURCHASE: "bg-sky-50 text-sky-700 ring-sky-600/20",
  EXPENSE: "bg-rose-50 text-rose-700 ring-rose-600/20",
};

export function TypeBadge({ type, label }: { type: string; label: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${
        STYLES[type] ?? "bg-slate-50 text-slate-700 ring-slate-600/20"
      }`}
    >
      {label}
    </span>
  );
}
