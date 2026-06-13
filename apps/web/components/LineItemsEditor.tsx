"use client";

import { useState } from "react";
import type { TaxRate } from "@shime/shared";
import { LineDescriptionAutocomplete } from "@/components/LineDescriptionAutocomplete";

type Line = { description: string; quantity: number; unitPrice: number; taxRate: TaxRate };

type Props = {
  labels: {
    description: string;
    quantity: string;
    unitPrice: string;
    taxRate?: string;
    taxable?: string;
    nonTaxable?: string;
    rate?: string;
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
  descriptionSuggestions?: string[];
  suggestionsLabel?: string;
};

function isLineTaxable(taxRate: TaxRate): boolean {
  return taxRate !== 0;
}

export function LineItemsEditor({
  labels,
  defaults,
  taxable = false,
  defaultTaxRate = 10,
  unitPriceLabel,
  descriptionSuggestions,
  suggestionsLabel,
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

  function toggleTaxable(i: number, checked: boolean) {
    setLines((prev) =>
      prev.map((line, idx) => {
        if (idx !== i) return line;
        if (checked) {
          const restored =
            line.taxRate === 0
              ? (defaultTaxRate === 8 ? 8 : 10)
              : line.taxRate;
          return { ...line, taxRate: restored as TaxRate };
        }
        return { ...line, taxRate: 0 };
      })
    );
  }

  const gridClass = taxable
    ? "line-items-table__row line-items-table__row--taxable"
    : "line-items-table__row";

  return (
    <div className="line-items-table">
      {taxable && (
        <div className="line-items-table__head line-items-table__row--taxable" role="row">
          <span role="columnheader">{labels.description}</span>
          <span role="columnheader">{labels.quantity}</span>
          <span role="columnheader">{unitPriceLabel ?? labels.unitPrice}</span>
          <span role="columnheader">{labels.taxable ?? "Taxable"}</span>
          <span role="columnheader">{labels.rate ?? labels.taxRate ?? "Rate"}</span>
          <span role="columnheader" className="line-items-table__actions-head" aria-hidden />
        </div>
      )}
      {lines.map((line, i) => {
        const lineTaxable = isLineTaxable(line.taxRate);
        return (
          <div key={i} className={gridClass} role="row">
            {descriptionSuggestions ? (
              <LineDescriptionAutocomplete
                name="line_description"
                value={line.description}
                onChange={(v) => update(i, "description", v)}
                suggestions={descriptionSuggestions}
                placeholder={labels.description}
                required
                aria-label={labels.description}
                suggestionsLabel={suggestionsLabel}
              />
            ) : (
              <input
                name="line_description"
                value={line.description}
                onChange={(e) => update(i, "description", e.target.value)}
                placeholder={labels.description}
                required
                className="input"
                aria-label={labels.description}
              />
            )}
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
              aria-label={labels.quantity}
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
              aria-label={unitPriceLabel ?? labels.unitPrice}
            />
            {taxable && (
              <>
                <label className="line-items-table__taxable">
                  <input
                    type="checkbox"
                    checked={lineTaxable}
                    onChange={(e) => toggleTaxable(i, e.target.checked)}
                    aria-label={
                      lineTaxable
                        ? labels.taxable ?? "Taxable"
                        : labels.nonTaxable ?? "Non-taxable"
                    }
                  />
                  <span className="line-items-table__taxable-label">
                    {labels.taxable ?? "Taxable"}
                  </span>
                </label>
                {lineTaxable ? (
                  <select
                    name="line_taxRate"
                    value={line.taxRate}
                    onChange={(e) => update(i, "taxRate", e.target.value)}
                    className="select"
                    aria-label={labels.rate ?? labels.taxRate}
                  >
                    <option value={10}>{labels.rate10 ?? "10%"}</option>
                    <option value={8}>{labels.rate8 ?? "8%"}</option>
                  </select>
                ) : (
                  <input type="hidden" name="line_taxRate" value={0} />
                )}
              </>
            )}
            {lines.length > 1 ? (
              <button
                type="button"
                onClick={() => setLines((prev) => prev.filter((_, idx) => idx !== i))}
                className="btn-link danger line-items-table__remove"
              >
                {labels.remove}
              </button>
            ) : (
              taxable && <span className="line-items-table__actions-head" aria-hidden />
            )}
          </div>
        );
      })}
      <button
        type="button"
        onClick={() =>
          setLines((prev) => [
            ...prev,
            { description: "", quantity: 1, unitPrice: 0, taxRate: defaultTaxRate },
          ])
        }
        className="btn-link line-items-table__add"
      >
        + {labels.add}
      </button>
    </div>
  );
}
