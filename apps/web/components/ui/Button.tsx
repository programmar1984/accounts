import Link from "next/link";
import type { ComponentProps } from "react";

export type ButtonVariant =
  | "primary"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "secondary"
  | "light"
  | "dark"
  | "muted";

type BaseProps = {
  variant?: ButtonVariant;
  size?: "default" | "sm";
  block?: boolean;
  className?: string;
};

export function Button({
  variant = "primary",
  size = "default",
  block,
  className = "",
  ...props
}: BaseProps & ComponentProps<"button">) {
  const classes = [
    "btn",
    `btn-${variant}`,
    size === "sm" ? "btn-sm" : "",
    block ? "btn-block" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");
  return <button className={classes} {...props} />;
}

export function ButtonLink({
  variant = "primary",
  size = "default",
  block,
  className = "",
  href,
  ...props
}: BaseProps & ComponentProps<typeof Link>) {
  const classes = [
    "btn",
    `btn-${variant}`,
    size === "sm" ? "btn-sm" : "",
    block ? "btn-block" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");
  return <Link href={href} className={classes} {...props} />;
}
