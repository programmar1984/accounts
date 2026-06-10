import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { fetchLedgerEntries, type LedgerDocType } from "@/lib/ledger";
import { getT, type TKey } from "@/lib/i18n";
import { formatDate, formatYen } from "@shime/shared";
import { PageToolbar } from "@/components/ui/PageToolbar";
import { Card } from "@/components/ui/Card";
import { DataTable } from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/Badge";
import { paymentBadgeVariant } from "@/components/TypeBadge";

const DOC_TYPES: LedgerDocType[] = ["PO", "SO", "EXP"];

export default async function LedgerPage({
  searchParams,
}: {
  searchParams: Promise<{
    year?: string;
    type?: string;
    payment?: string;
    q?: string;
  }>;
}) {
  await requireUser();
  const { t, lang } = await getT();
  const params = await searchParams;
  const year = Number(params.year) || new Date().getUTCFullYear();
  const docType = DOC_TYPES.includes(params.type as LedgerDocType)
    ? (params.type as LedgerDocType)
    : undefined;
  const paymentStatus = params.payment?.trim() || undefined;
  const q = params.q?.trim() || undefined;

  const entries = await fetchLedgerEntries({ year, docType, paymentStatus, q });

  return (
    <div className="stack-lg">
      <PageToolbar title={t("ledger.title")} />

      <Card>
        <form method="GET" className="filter-bar">
          <input type="number" name="year" defaultValue={year} className="input" style={{ width: "6rem" }} />
          <select name="type" defaultValue={docType ?? ""} className="select">
            <option value="">{t("ledger.allTypes")}</option>
            {DOC_TYPES.map((ty) => (
              <option key={ty} value={ty}>
                {t(`ledger.type.${ty}` as TKey)}
              </option>
            ))}
          </select>
          <select name="payment" defaultValue={paymentStatus ?? ""} className="select">
            <option value="">{t("ledger.allPayments")}</option>
            {(["UNPAID", "PARTIAL", "PAID"] as const).map((s) => (
              <option key={s} value={s}>
                {t(`pay.${s}` as TKey)}
              </option>
            ))}
          </select>
          <input name="q" type="search" defaultValue={q ?? ""} placeholder={t("ledger.search")} className="input" />
          <button type="submit" className="btn btn-muted">
            {t("ledger.filter")}
          </button>
        </form>
      </Card>

      <DataTable
        empty={
          entries.length === 0 ? (
            <div className="empty-state">{t("ledger.empty")}</div>
          ) : undefined
        }
      >
        {entries.length > 0 ? (
          <>
            <thead>
              <tr>
                <th>{t("ledger.date")}</th>
                <th>{t("ledger.docType")}</th>
                <th>{t("ledger.number")}</th>
                <th>{t("ledger.code")}</th>
                <th>{t("ledger.party")}</th>
                <th className="text-right">{t("ledger.tax")}</th>
                <th className="text-right">{t("ledger.total")}</th>
                <th>{t("ledger.payment")}</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => (
                <tr key={`${e.docType}-${e.id}`}>
                  <td className="tabular-nums muted">{formatDate(e.date, lang)}</td>
                  <td>{t(`ledger.type.${e.docType}` as TKey)}</td>
                  <td style={{ fontWeight: 600 }}>
                    <Link href={e.href} className="data-row-link">
                      {e.number}
                    </Link>
                  </td>
                  <td className="muted">{e.partyCode ?? "—"}</td>
                  <td>{e.partyName}</td>
                  <td className="text-right tabular-nums muted">
                    {formatYen(e.totalTax, lang)}
                  </td>
                  <td className="text-right tabular-nums" style={{ fontWeight: 600 }}>
                    {formatYen(e.totalAmount, lang)}
                  </td>
                  <td>
                    <Badge variant={paymentBadgeVariant(e.paymentStatus)}>
                      {t(`pay.${e.paymentStatus}` as TKey)}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </>
        ) : null}
      </DataTable>
    </div>
  );
}
