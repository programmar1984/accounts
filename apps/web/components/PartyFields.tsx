import { getT } from "@/lib/i18n";

type PartyDefaults = {
  code?: string | null;
  name?: string;
  email?: string | null;
  address?: string | null;
  phone?: string | null;
  taxId?: string | null;
  paymentTermsDays?: number;
};

export async function PartyFields({
  kind,
  defaults,
}: {
  kind: "customer" | "supplier";
  defaults?: PartyDefaults;
}) {
  const { t } = await getT();
  const prefix = kind === "customer" ? "cust" : "supp";
  const inputCls =
    "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none";

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div>
        <label className="mb-1 block text-sm font-medium" htmlFor="name">
          {t(`${prefix}.name` as "cust.name")}
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          defaultValue={defaults?.name ?? ""}
          className={inputCls}
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium" htmlFor="code">
          {t(`${prefix}.code` as "cust.code")}
        </label>
        <input
          id="code"
          name="code"
          type="text"
          defaultValue={defaults?.code ?? ""}
          className={inputCls}
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium" htmlFor="email">
          {t(`${prefix}.email` as "cust.email")}
        </label>
        <input
          id="email"
          name="email"
          type="email"
          defaultValue={defaults?.email ?? ""}
          className={inputCls}
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium" htmlFor="phone">
          {t(`${prefix}.phone` as "cust.phone")}
        </label>
        <input
          id="phone"
          name="phone"
          type="text"
          defaultValue={defaults?.phone ?? ""}
          className={inputCls}
        />
      </div>
      <div className="sm:col-span-2">
        <label className="mb-1 block text-sm font-medium" htmlFor="address">
          {t(`${prefix}.address` as "cust.address")}
        </label>
        <textarea
          id="address"
          name="address"
          rows={2}
          defaultValue={defaults?.address ?? ""}
          className={inputCls}
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium" htmlFor="taxId">
          {t(`${prefix}.taxId` as "cust.taxId")}
        </label>
        <input
          id="taxId"
          name="taxId"
          type="text"
          defaultValue={defaults?.taxId ?? ""}
          className={inputCls}
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium" htmlFor="paymentTermsDays">
          {t(`${prefix}.paymentTerms` as "cust.paymentTerms")}
        </label>
        <input
          id="paymentTermsDays"
          name="paymentTermsDays"
          type="number"
          min={0}
          defaultValue={defaults?.paymentTermsDays ?? 30}
          className={inputCls}
        />
      </div>
    </div>
  );
}
