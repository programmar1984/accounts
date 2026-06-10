import type { ReactNode } from "react";

export type AlertVariant = "success" | "warning" | "danger" | "info";

export function Alert({
  variant,
  children,
  className = "",
}: {
  variant: AlertVariant;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`alert alert-${variant} ${className}`.trim()} role="alert">
      {children}
    </div>
  );
}
