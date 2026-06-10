"use client";

import { useState } from "react";
import type { TaxRate } from "@shime/shared";

type Line = { description: string; quantity: number; unitPrice: number; taxRate: TaxRate };

type Props = {
  labels: {
    description: string;
    quantity: string;
    unitPrice: string;
    taxRate?: string;
    add: string;
    remove: string;
    rate10?: string;
    rate8?: string;
    rate0?: string;
  };
  defaults?: (Omit<Line, "taxRate"> & { taxRate?: TaxRate })[];
  taxable?: boolean;
  defaultTaxRate?: TaxRate;
  unitPriceLabel?: string;
};

export function LineItemsEditor({
  labels,
  defaults,
  taxable = false,
  defaultTaxRate = 10,
  unitPriceLabel,
}: Props) {
  const [lines, setLines] = useState<Line[]>(
    defaults?.length
      ? defaults.map((l) => ({
          description: l.description,
          quantity: l.quantity,
          unitPrice: l.unitPrice,
          taxRate: (l.taxRate ?? defaultTaxRate) as TaxRate,
        }))
      : [{ description: "", quantity: 1, unitPrice: 0, taxRate: defaultTaxRate }]
  );

  function update(i: number, field: keyof Line, value: string) {
    setLines((prev) =>
      prev.map((line, idx) =>
        idx === i
          ? {
              ...line,
              [field]:
                field === "description"
                  ? value
                  : field === "taxRate"
                    ? (Number(value) as TaxRate)
                    : Math.round(Number(value)) || 0,
            }
          : line
      )
    );
  }

  return (
    <div className="stack">
      {lines.map((line, i) => (
        <div
          key={i}
          className="form-grid"
          style={{ gridTemplateColumns: "repeat(auto-fit, minmax(8rem, 1fr))" }}
        >
          <input
            name="line_description"
            value={line.description}
            onChange={(e) => update(i, "description", e.target.value)}
            placeholder={labels.description}
            required
            className="input"
            style={{ gridColumn: "span 2" }}
          />
          <input
            name="line_quantity"
            type="number"
            min={1}
            step={1}
            value={line.quantity || ""}
            onChange={(e) => update(i, "quantity", e.target.value)}
            placeholder={labels.quantity}
            required
            className="input"
          />
          <input
            name="line_unitPrice"
            type="number"
            min={0}
            step={1}
            value={line.unitPrice || ""}
            onChange={(e) => update(i, "unitPrice", e.target.value)}
            placeholder={unitPriceLabel ?? labels.unitPrice}
            required
            className="input"
          />
          {taxable && (
            <select
              name="line_taxRate"
              value={line.taxRate}
              onChange={(e) => update(i, "taxRate", e.target.value)}
              className="select"
              aria-label={labels.taxRate}
            >
              <option value={10}>{labels.rate10 ?? "10%"}</option>
              <option value={8}>{labels.rate8 ?? "8%"}</option>
              <option value={0}>{labels.rate0 ?? "0%"}</option>
            </select>
          )}
          {lines.length > 1 && (
            <button
              type="button"
              onClick={() => setLines((prev) => prev.filter((_, idx) => idx !== i))}
              className="btn-link danger"
            >
              {labels.remove}
            </button>
          )}
        </div>
      ))}
      <button
        type="button"
        onClick={() =>
          setLines((prev) => [
            ...prev,
            { description: "", quantity: 1, unitPrice: 0, taxRate: defaultTaxRate },
          ])
        }
        className="btn-link"
      >
        + {labels.add}
      </button>
    </div>
  );
}
