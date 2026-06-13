"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  buildFilterQuery,
  COOKIE_MAX_AGE,
  defaultDateRange,
  hasDateParams,
  LEDGER_DOC_TYPES,
  LEDGER_FILTER_COOKIE,
  PO_FILTER_COOKIE,
  SVO_FILTER_COOKIE,
  type LedgerFilterState,
  type PoFilterState,
  type SvoFilterState,
} from "./list-filters";

async function writeCookie(name: string, value: object, path: string) {
  (await cookies()).set(name, encodeURIComponent(JSON.stringify(value)), {
    path,
    maxAge: COOKIE_MAX_AGE,
    sameSite: "lax",
  });
}

async function deleteCookie(name: string, path: string) {
  (await cookies()).delete({ name, path });
}

export async function applyLedgerFilter(formData: FormData) {
  const from = String(formData.get("from") ?? "").trim();
  const to = String(formData.get("to") ?? "").trim();
  const type = String(formData.get("type") ?? "").trim();
  const payment = String(formData.get("payment") ?? "").trim();
  const q = String(formData.get("q") ?? "").trim();

  const range = hasDateParams({ from, to }) ? { from, to } : defaultDateRange();
  const state: LedgerFilterState = {
    from: range.from,
    to: range.to,
    type: LEDGER_DOC_TYPES.includes(type as (typeof LEDGER_DOC_TYPES)[number])
      ? type
      : undefined,
    payment: payment || undefined,
    q: q || undefined,
  };

  await writeCookie(LEDGER_FILTER_COOKIE, state, "/ledger");
  redirect(
    `/ledger${buildFilterQuery({
      from: state.from,
      to: state.to,
      type: state.type,
      payment: state.payment,
      q: state.q,
    })}`
  );
}

export async function clearLedgerFilter() {
  await deleteCookie(LEDGER_FILTER_COOKIE, "/ledger");
  redirect("/ledger");
}

export async function applyPoFilter(formData: FormData) {
  const from = String(formData.get("from") ?? "").trim();
  const to = String(formData.get("to") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim();

  const range = hasDateParams({ from, to }) ? { from, to } : defaultDateRange();
  const state: PoFilterState = {
    from: range.from,
    to: range.to,
    status: status || undefined,
  };

  await writeCookie(PO_FILTER_COOKIE, state, "/purchase-orders");
  redirect(
    `/purchase-orders${buildFilterQuery({
      from: state.from,
      to: state.to,
      status: state.status,
    })}`
  );
}

export async function clearPoFilter() {
  await deleteCookie(PO_FILTER_COOKIE, "/purchase-orders");
  redirect("/purchase-orders");
}

export async function applySvoFilter(formData: FormData) {
  const from = String(formData.get("from") ?? "").trim();
  const to = String(formData.get("to") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim();

  const range = hasDateParams({ from, to }) ? { from, to } : defaultDateRange();
  const state: SvoFilterState = {
    from: range.from,
    to: range.to,
    status: status || undefined,
  };

  await writeCookie(SVO_FILTER_COOKIE, state, "/service-orders");
  redirect(
    `/service-orders${buildFilterQuery({
      from: state.from,
      to: state.to,
      status: state.status,
    })}`
  );
}

export async function clearSvoFilter() {
  await deleteCookie(SVO_FILTER_COOKIE, "/service-orders");
  redirect("/service-orders");
}
