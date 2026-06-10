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

  return (
    <div className="form-grid form-grid-2">
      <div className="form-group">
        <label className="form-label" htmlFor="name">
          {t(`${prefix}.name` as "cust.name")}
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          defaultValue={defaults?.name ?? ""}
          className="input"
        />
      </div>
      <div className="form-group">
        <label className="form-label" htmlFor="code">
          {t(`${prefix}.code` as "cust.code")}
        </label>
        <input
          id="code"
          name="code"
          type="text"
          defaultValue={defaults?.code ?? ""}
          className="input"
        />
      </div>
      <div className="form-group">
        <label className="form-label" htmlFor="email">
          {t(`${prefix}.email` as "cust.email")}
        </label>
        <input
          id="email"
          name="email"
          type="email"
          defaultValue={defaults?.email ?? ""}
          className="input"
        />
      </div>
      <div className="form-group">
        <label className="form-label" htmlFor="phone">
          {t(`${prefix}.phone` as "cust.phone")}
        </label>
        <input
          id="phone"
          name="phone"
          type="text"
          defaultValue={defaults?.phone ?? ""}
          className="input"
        />
      </div>
      <div className="form-group" style={{ gridColumn: "1 / -1" }}>
        <label className="form-label" htmlFor="address">
          {t(`${prefix}.address` as "cust.address")}
        </label>
        <textarea
          id="address"
          name="address"
          rows={2}
          defaultValue={defaults?.address ?? ""}
          className="textarea"
        />
      </div>
      <div className="form-group">
        <label className="form-label" htmlFor="taxId">
          {t(`${prefix}.taxId` as "cust.taxId")}
        </label>
        <input
          id="taxId"
          name="taxId"
          type="text"
          defaultValue={defaults?.taxId ?? ""}
          className="input"
        />
      </div>
      <div className="form-group">
        <label className="form-label" htmlFor="paymentTermsDays">
          {t(`${prefix}.paymentTerms` as "cust.paymentTerms")}
        </label>
        <input
          id="paymentTermsDays"
          name="paymentTermsDays"
          type="number"
          min={0}
          defaultValue={defaults?.paymentTermsDays ?? 30}
          className="input"
        />
      </div>
    </div>
  );
}
