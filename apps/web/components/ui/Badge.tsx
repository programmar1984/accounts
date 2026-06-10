import type { ReactNode } from "react";

export type BadgeVariant =
  | "primary"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "secondary"
  | "light"
  | "dark";

export function Badge({
  variant = "secondary",
  children,
  className = "",
}: {
  variant?: BadgeVariant;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span className={`badge badge-${variant} ${className}`.trim()}>{children}</span>
  );
}
