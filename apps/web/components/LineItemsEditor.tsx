"use client";

import { useState } from "react";

type Line = { description: string; quantity: number; unitPrice: number };

type Props = {
  labels: {
    description: string;
    quantity: string;
    unitPrice: string;
    add: string;
    remove: string;
  };
  defaults?: Line[];
};

export function LineItemsEditor({ labels, defaults }: Props) {
  const [lines, setLines] = useState<Line[]>(
    defaults?.length
      ? defaults
      : [{ description: "", quantity: 1, unitPrice: 0 }]
  );

  function update(i: number, field: keyof Line, value: string) {
    setLines((prev) =>
      prev.map((line, idx) =>
        idx === i
          ? {
              ...line,
              [field]:
                field === "description" ? value : Math.round(Number(value)) || 0,
            }
          : line
      )
    );
  }

  return (
    <div className="space-y-3">
      {lines.map((line, i) => (
        <div key={i} className="grid grid-cols-1 gap-2 sm:grid-cols-12">
          <input
            name="line_description"
            value={line.description}
            onChange={(e) => update(i, "description", e.target.value)}
            placeholder={labels.description}
            required
            className="sm:col-span-6 rounded-lg border border-slate-300 px-3 py-2 text-sm"
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
            className="sm:col-span-2 rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <input
            name="line_unitPrice"
            type="number"
            min={0}
            step={1}
            value={line.unitPrice || ""}
            onChange={(e) => update(i, "unitPrice", e.target.value)}
            placeholder={labels.unitPrice}
            required
            className="sm:col-span-3 rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          {lines.length > 1 && (
            <button
              type="button"
              onClick={() => setLines((prev) => prev.filter((_, idx) => idx !== i))}
              className="sm:col-span-1 text-sm text-rose-600 hover:underline"
            >
              {labels.remove}
            </button>
          )}
        </div>
      ))}
      <button
        type="button"
        onClick={() =>
          setLines((prev) => [...prev, { description: "", quantity: 1, unitPrice: 0 }])
        }
        className="text-sm font-medium text-slate-600 underline-offset-2 hover:underline"
      >
        + {labels.add}
      </button>
    </div>
  );
}
