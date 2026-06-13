"use client";

import { useEffect, useMemo, useState } from "react";
import { LineItemsEditor } from "@/components/LineItemsEditor";
import type { PoLineDescriptionSuggestion } from "@/lib/po-line-suggestions";

type LineItemsEditorProps = React.ComponentProps<typeof LineItemsEditor>;

type Props = Omit<LineItemsEditorProps, "descriptionSuggestions"> & {
  allSuggestions: PoLineDescriptionSuggestion[];
  supplierSelectId?: string;
  fixedSupplierId?: string;
  pickSupplierHint?: string;
  suggestionsLabel?: string;
};

export function PoLineItemsEditor({
  allSuggestions,
  supplierSelectId = "supplierId",
  fixedSupplierId,
  pickSupplierHint,
  suggestionsLabel,
  ...lineItemsProps
}: Props) {
  const [supplierId, setSupplierId] = useState<string | null>(
    fixedSupplierId ?? null
  );

  useEffect(() => {
    if (fixedSupplierId) {
      setSupplierId(fixedSupplierId);
      return;
    }

    const select = document.getElementById(supplierSelectId) as HTMLSelectElement | null;
    if (!select) return;

    function sync() {
      setSupplierId(select!.value || null);
    }

    sync();
    select.addEventListener("change", sync);
    return () => select.removeEventListener("change", sync);
  }, [fixedSupplierId, supplierSelectId]);

  const descriptionSuggestions = useMemo(() => {
    if (!supplierId) return [];
    const seen = new Set<string>();
    const result: string[] = [];
    for (const s of allSuggestions) {
      if (s.supplierId !== supplierId) continue;
      const key = s.description.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      result.push(s.description);
    }
    return result;
  }, [allSuggestions, supplierId]);

  return (
    <>
      {!supplierId && pickSupplierHint ? (
        <p className="muted" style={{ marginBottom: "0.5rem", fontSize: "0.88rem" }}>
          {pickSupplierHint}
        </p>
      ) : null}
      <LineItemsEditor
        {...lineItemsProps}
        descriptionSuggestions={descriptionSuggestions}
        suggestionsLabel={suggestionsLabel}
      />
    </>
  );
}
