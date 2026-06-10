import { Badge, type BadgeVariant } from "@/components/ui/Badge";

const VARIANTS: Record<string, BadgeVariant> = {
  SALE: "success",
  PURCHASE: "info",
  EXPENSE: "warning",
};

export function TypeBadge({ type, label }: { type: string; label: string }) {
  return <Badge variant={VARIANTS[type] ?? "secondary"}>{label}</Badge>;
}

export function paymentBadgeVariant(status: string): BadgeVariant {
  if (status === "PAID") return "success";
  if (status === "PARTIAL") return "warning";
  if (status === "UNPAID") return "danger";
  return "secondary";
}

export function poBadgeVariant(status: string): BadgeVariant {
  if (status === "POSTED") return "success";
  if (status === "VOID") return "danger";
  if (status === "CANCELLED") return "danger";
  return "secondary";
}

export function expenseBadgeVariant(status: string): BadgeVariant {
  if (status === "POSTED") return "success";
  if (status === "VOID") return "danger";
  return "secondary";
}
