import type { ReactNode } from "react";

export function DataTable({
  children,
  empty,
  className = "",
}: {
  children: ReactNode;
  empty?: ReactNode;
  className?: string;
}) {
  return (
    <section className={`card table-wrap ${className}`.trim()}>
      {empty ?? <table className="data-table">{children}</table>}
    </section>
  );
}
