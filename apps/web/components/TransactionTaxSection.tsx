"use client";

import { useMemo, useState } from "react";
import { splitLineAmount, type PriceBasis, type TaxRate } from "@shime/shared";

type Props = {
  priceBasis: PriceBasis;
  defaultTaxRate: TaxRate;
  defaultAmount?: number;
  defaultTaxRateValue?: number | null;
  labels: {
    amount: string;
    taxRate: string;
    taxAmount: string;
    amountExTax: string;
    rate10: string;
    rate8: string;
    rate0: string;
  };
};

export function TransactionTaxSection({
  priceBasis,
  defaultTaxRate,
  defaultAmount,
  defaultTaxRateValue,
  labels,
}: Props) {
  const [amount, setAmount] = useState(defaultAmount ?? "");
  const [taxRate, setTaxRate] = useState<TaxRate>(
    (defaultTaxRateValue as TaxRate) ?? defaultTaxRate
  );

  const preview = useMemo(() => {
    const n = Math.round(Number(amount));
    if (!Number.isFinite(n) || n <= 0) return null;
    return splitLineAmount(n, taxRate, priceBasis, "FLOOR");
  }, [amount, taxRate, priceBasis]);

  return (
    <>
      <div className="form-group">
        <label className="form-label" htmlFor="taxRate">
          {labels.taxRate}
        </label>
        <select
          id="taxRate"
          name="taxRate"
          value={taxRate}
          onChange={(e) => setTaxRate(Number(e.target.value) as TaxRate)}
          className="select"
        >
          <option value={10}>{labels.rate10}</option>
          <option value={8}>{labels.rate8}</option>
          <option value={0}>{labels.rate0}</option>
        </select>
      </div>
      <div className="form-group">
        <label className="form-label" htmlFor="amount">
          {labels.amount}
        </label>
        <input
          id="amount"
          name="amount"
          type="number"
          min={1}
          step={1}
          required
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="input"
        />
      </div>
      {preview && (
        <div className="form-group" style={{ gridColumn: "1 / -1" }}>
          <div className="muted" style={{ fontSize: "0.88rem" }}>
            {labels.amountExTax}: ¥{preview.exTax.toLocaleString()} · {labels.taxAmount}: ¥
            {preview.tax.toLocaleString()}
          </div>
        </div>
      )}
    </>
  );
}
