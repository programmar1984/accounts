import { getT, type TKey } from "@/lib/i18n";

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
};

export async function TransactionFields({
  defaults,
  customers = [],
  suppliers = [],
}: {
  defaults?: Defaults;
  customers?: PartyOption[];
  suppliers?: PartyOption[];
}) {
  const { t } = await getT();
  const inputCls =
    "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none";

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div>
        <label className="mb-1 block text-sm font-medium" htmlFor="type">
          {t("tx.type")}
        </label>
        <select
          id="type"
          name="type"
          defaultValue={defaults?.type ?? "EXPENSE"}
          className={inputCls}
        >
          {TYPES.map((ty) => (
            <option key={ty} value={ty}>
              {t(`type.${ty}` as TKey)}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium" htmlFor="date">
          {t("tx.date")}
        </label>
        <input
          id="date"
          name="date"
          type="date"
          required
          defaultValue={
            (defaults?.date ?? new Date()).toISOString().slice(0, 10)
          }
          className={inputCls}
        />
      </div>
      {customers.length > 0 && (
        <div>
          <label className="mb-1 block text-sm font-medium" htmlFor="customerId">
            {t("tx.customer")}
          </label>
          <select
            id="customerId"
            name="customerId"
            defaultValue={defaults?.customerId ?? ""}
            className={inputCls}
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
        <div>
          <label className="mb-1 block text-sm font-medium" htmlFor="supplierId">
            {t("tx.supplier")}
          </label>
          <select
            id="supplierId"
            name="supplierId"
            defaultValue={defaults?.supplierId ?? ""}
            className={inputCls}
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
      <div>
        <label className="mb-1 block text-sm font-medium" htmlFor="counterparty">
          {t("tx.counterparty")}
        </label>
        <input
          id="counterparty"
          name="counterparty"
          type="text"
          required
          defaultValue={defaults?.counterparty ?? ""}
          placeholder={t("tx.counterparty.hint")}
          className={inputCls}
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium" htmlFor="amount">
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
          className={inputCls}
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium" htmlFor="dueDate">
          {t("tx.dueDate")}
        </label>
        <input
          id="dueDate"
          name="dueDate"
          type="date"
          defaultValue={
            defaults?.dueDate
              ? defaults.dueDate.toISOString().slice(0, 10)
              : ""
          }
          className={inputCls}
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium" htmlFor="amountPaid">
          {t("tx.amountPaid")}
        </label>
        <input
          id="amountPaid"
          name="amountPaid"
          type="number"
          min={0}
          step={1}
          defaultValue={defaults?.amountPaid ?? 0}
          className={inputCls}
        />
      </div>
      <div className="sm:col-span-2">
        <label className="mb-1 block text-sm font-medium" htmlFor="description">
          {t("tx.description")}
        </label>
        <input
          id="description"
          name="description"
          type="text"
          defaultValue={defaults?.description ?? ""}
          className={inputCls}
        />
      </div>
      <div className="sm:col-span-2">
        <label className="mb-1 block text-sm font-medium" htmlFor="memo">
          {t("tx.memo")}
        </label>
        <textarea
          id="memo"
          name="memo"
          rows={2}
          defaultValue={defaults?.memo ?? ""}
          className={inputCls}
        />
      </div>
    </div>
  );
}
