import type { ReactNode } from "react";

export type CardHeaderVariant =
  | "primary"
  | "success"
  | "info"
  | "warning"
  | "danger"
  | "secondary"
  | "dark";

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`card ${className}`.trim()}>{children}</div>;
}

export function CardHeader({
  children,
  variant,
  className = "",
}: {
  children: ReactNode;
  variant?: CardHeaderVariant;
  className?: string;
}) {
  const variantClass = variant ? `card-header--${variant}` : "";
  return (
    <div className={`card-header ${variantClass} ${className}`.trim()}>
      {children}
    </div>
  );
}

export function CardBody({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`card-body ${className}`.trim()}>{children}</div>;
}

export function CardFooter({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`card-footer ${className}`.trim()}>{children}</div>;
}
