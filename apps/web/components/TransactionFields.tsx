import { getT, type TKey } from "@/lib/i18n";
import { TransactionTaxSection } from "@/components/TransactionTaxSection";
import type { PriceBasis, TaxRate } from "@shime/shared";

const TYPES = ["SALE", "PURCHASE", "EXPENSE"] as const;

type PartyOption = { id: string; name: string };

type Defaults = {
  type?: string;
  date?: Date;
  counterparty?: string;
  description?: string;
  amount?: number;
  memo?: string | null;
  customerId?: string | null;
  supplierId?: string | null;
  dueDate?: Date | null;
  amountPaid?: number;
  taxRate?: number | null;
};

type TaxConfig = {
  taxable: boolean;
  priceBasis: PriceBasis;
  defaultTaxRate: TaxRate;
};

export async function TransactionFields({
  defaults,
  customers = [],
  suppliers = [],
  taxConfig,
}: {
  defaults?: Defaults;
  customers?: PartyOption[];
  suppliers?: PartyOption[];
  taxConfig?: TaxConfig;
}) {
  const { t } = await getT();
  const taxable = taxConfig?.taxable ?? false;

  const amountLabel =
    taxable && taxConfig?.priceBasis === "TAX_EXCLUSIVE"
      ? t("tax.amountExTax")
      : taxable
        ? t("tax.amountInclusive")
        : t("tx.amount");

  return (
    <div className="form-grid form-grid-2">
      <div className="form-group">
        <label className="form-label" htmlFor="type">
          {t("tx.type")}
        </label>
        <select
          id="type"
          name="type"
          defaultValue={defaults?.type ?? "EXPENSE"}
          className="select"
        >
          {TYPES.map((ty) => (
            <option key={ty} value={ty}>
              {t(`type.${ty}` as TKey)}
            </option>
          ))}
        </select>
      </div>
      <div className="form-group">
        <label className="form-label" htmlFor="date">
          {t("tx.date")}
        </label>
        <input
          id="date"
          name="date"
          type="date"
          required
          defaultValue={(defaults?.date ?? new Date()).toISOString().slice(0, 10)}
          className="input"
        />
      </div>
      {customers.length > 0 && (
        <div className="form-group">
          <label className="form-label" htmlFor="customerId">
            {t("tx.customer")}
          </label>
          <select
            id="customerId"
            name="customerId"
            defaultValue={defaults?.customerId ?? ""}
            className="select"
          >
            <option value="">{t("tx.partyNone")}</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      )}
      {suppliers.length > 0 && (
        <div className="form-group">
          <label className="form-label" htmlFor="supplierId">
            {t("tx.supplier")}
          </label>
          <select
            id="supplierId"
            name="supplierId"
            defaultValue={defaults?.supplierId ?? ""}
            className="select"
          >
            <option value="">{t("tx.partyNone")}</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      )}
      <div className="form-group">
        <label className="form-label" htmlFor="counterparty">
          {t("tx.counterparty")}
        </label>
        <input
          id="counterparty"
          name="counterparty"
          type="text"
          required
          defaultValue={defaults?.counterparty ?? ""}
          placeholder={t("tx.counterparty.hint")}
          className="input"
        />
      </div>
      {taxable && taxConfig ? (
        <TransactionTaxSection
          priceBasis={taxConfig.priceBasis}
          defaultTaxRate={taxConfig.defaultTaxRate}
          defaultAmount={defaults?.amount}
          defaultTaxRateValue={defaults?.taxRate}
          labels={{
            amount: amountLabel,
            taxRate: t("tax.rate"),
            taxAmount: t("tax.amount"),
            amountExTax: t("tax.exTax"),
            rate10: t("tax.rate10"),
            rate8: t("tax.rate8"),
            rate0: t("tax.rate0"),
          }}
        />
      ) : (
        <div className="form-group">
          <label className="form-label" htmlFor="amount">
            {t("tx.amount")}
          </label>
          <input
            id="amount"
            name="amount"
            type="number"
            min={1}
            step={1}
            required
            defaultValue={defaults?.amount ?? ""}
            className="input"
          />
        </div>
      )}
      <div className="form-group">
        <label className="form-label" htmlFor="dueDate">
          {t("tx.dueDate")}
        </label>
        <input
          id="dueDate"
          name="dueDate"
          type="date"
          defaultValue={
            defaults?.dueDate ? defaults.dueDate.toISOString().slice(0, 10) : ""
          }
          className="input"
        />
      </div>
      <div className="form-group">
        <label className="form-label" htmlFor="amountPaid">
          {t("tx.amountPaid")}
        </label>
        <input
          id="amountPaid"
          name="amountPaid"
          type="number"
          min={0}
          step={1}
          defaultValue={defaults?.amountPaid ?? 0}
          className="input"
        />
      </div>
      <div className="form-group" style={{ gridColumn: "1 / -1" }}>
        <label className="form-label" htmlFor="description">
          {t("tx.description")}
        </label>
        <input
          id="description"
          name="description"
          type="text"
          defaultValue={defaults?.description ?? ""}
          className="input"
        />
      </div>
      <div className="form-group" style={{ gridColumn: "1 / -1" }}>
        <label className="form-label" htmlFor="memo">
          {t("tx.memo")}
        </label>
        <textarea
          id="memo"
          name="memo"
          rows={2}
          defaultValue={defaults?.memo ?? ""}
          className="textarea"
        />
      </div>
    </div>
  );
}
