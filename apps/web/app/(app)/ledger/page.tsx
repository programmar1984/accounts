import Link from "next/link";

import { cookies } from "next/headers";

import { requireUser } from "@/lib/auth";

import {

  fetchLedgerEntries,

  ledgerPurchaseAmount,

  ledgerPurchaseTax,

  ledgerSaleAmount,

  ledgerSaleTax,

  type LedgerDocType,

} from "@/lib/ledger";

import { applyLedgerFilter, clearLedgerFilter } from "@/lib/actions-list-filters";

import { getLedgerFilterFromSources } from "@/lib/list-filters";

import { getT, type TKey } from "@/lib/i18n";

import { formatDate, formatYen } from "@shime/shared";

import { PageToolbar } from "@/components/ui/PageToolbar";

import { Card } from "@/components/ui/Card";

import { DataTable } from "@/components/ui/DataTable";

import { Badge } from "@/components/ui/Badge";

import { paymentBadgeVariant } from "@/components/TypeBadge";



const DOC_TYPES: LedgerDocType[] = ["PO", "SVO", "SO", "EXP"];



function formatLedgerCell(amount: number, lang: Parameters<typeof formatYen>[1]) {

  return amount > 0 ? formatYen(amount, lang) : "—";

}



export default async function LedgerPage({

  searchParams,

}: {

  searchParams: Promise<{

    from?: string;

    to?: string;

    type?: string;

    payment?: string;

    q?: string;

  }>;

}) {

  await requireUser();

  const { t, lang } = await getT();

  const params = await searchParams;

  const filter = getLedgerFilterFromSources(params, await cookies());

  const docType = DOC_TYPES.includes(filter.type as LedgerDocType)

    ? (filter.type as LedgerDocType)

    : undefined;

  const paymentStatus = filter.payment;

  const q = filter.q;



  const entries = await fetchLedgerEntries({

    dateFrom: filter.from,

    dateTo: filter.to,

    docType,

    paymentStatus,

    q,

  });



  const totalPurchase = entries.reduce((s, e) => s + ledgerPurchaseAmount(e), 0);

  const totalSale = entries.reduce((s, e) => s + ledgerSaleAmount(e), 0);

  const totalPurchaseTax = entries.reduce((s, e) => s + ledgerPurchaseTax(e), 0);

  const totalSaleTax = entries.reduce((s, e) => s + ledgerSaleTax(e), 0);

  const balance = totalPurchase - totalSale;

  const balanceTax = totalPurchaseTax - totalSaleTax;



  return (

    <div className="stack-lg">

      <PageToolbar title={t("ledger.title")} />



      <Card>

        <form action={applyLedgerFilter} className="filter-bar">

          <input

            type="date"

            name="from"

            defaultValue={filter.from}

            className="input"

            title={t("filter.dateFrom")}

            aria-label={t("filter.dateFrom")}

          />

          <input

            type="date"

            name="to"

            defaultValue={filter.to}

            className="input"

            title={t("filter.dateTo")}

            aria-label={t("filter.dateTo")}

          />

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

          <input

            name="q"

            type="search"

            defaultValue={q ?? ""}

            placeholder={t("ledger.search")}

            className="input"

          />

          <button type="submit" className="btn btn-muted">

            {t("ledger.filter")}

          </button>

          <button type="submit" formAction={clearLedgerFilter} className="btn btn-muted">

            {t("filter.clear")}

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

                <th className="text-right">{t("ledger.purchase")}</th>

                <th className="text-right">{t("ledger.sale")}</th>

                <th>{t("ledger.status")}</th>

              </tr>

            </thead>

            <tbody>

              {entries.map((e) => {

                const purchase = ledgerPurchaseAmount(e);

                const sale = ledgerSaleAmount(e);

                return (

                  <tr key={`${e.docType}-${e.id}`}>

                    <td className="tabular-nums muted">{formatDate(e.date, lang)}</td>

                    <td>{t(`ledger.type.${e.docType}` as TKey)}</td>

                    <td style={{ fontWeight: 600 }}>

                      <Link

                        href={e.href}

                        className="data-row-link"

                        title={

                          (e.docType === "PO" || e.docType === "SVO") && e.notes?.trim()

                            ? e.notes.trim()

                            : undefined

                        }

                      >

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

                    <td className="text-right tabular-nums">

                      {formatLedgerCell(purchase, lang)}

                    </td>

                    <td className="text-right tabular-nums">

                      {formatLedgerCell(sale, lang)}

                    </td>

                    <td>

                      <Badge variant={paymentBadgeVariant(e.paymentStatus)}>

                        {t(`pay.${e.paymentStatus}` as TKey)}

                      </Badge>

                    </td>

                  </tr>

                );

              })}

            </tbody>

            <tfoot>

              <tr>

                <td colSpan={5} style={{ fontWeight: 600 }}>

                  {t("ledger.balance")}

                </td>

                <td className="text-right tabular-nums" style={{ fontWeight: 600 }}>

                  {formatYen(balanceTax, lang)}

                </td>

                <td className="text-right tabular-nums" style={{ fontWeight: 600 }}>

                  {formatYen(balance, lang)}

                </td>

                <td className="text-right tabular-nums" style={{ fontWeight: 600 }}>

                  {formatYen(totalPurchase, lang)}

                </td>

                <td className="text-right tabular-nums" style={{ fontWeight: 600 }}>

                  {formatYen(totalSale, lang)}

                </td>

                <td />

              </tr>

            </tfoot>

          </>

        ) : null}

      </DataTable>

    </div>

  );

}

