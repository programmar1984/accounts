import type { LedgerDocType } from "./ledger";

type CookieJar = {
  get: (name: string) => { value: string } | undefined;
};

export const LEDGER_FILTER_COOKIE = "shime_ledger_filter";
export const PO_FILTER_COOKIE = "shime_po_filter";
export const SVO_FILTER_COOKIE = "shime_svo_filter";
export const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export type DateRangeStrings = {
  from: string;
  to: string;
};

export type LedgerFilterState = DateRangeStrings & {
  type?: string;
  payment?: string;
  q?: string;
};

export type PoFilterState = DateRangeStrings & {
  status?: string;
};

export type SvoFilterState = DateRangeStrings & {
  status?: string;
};

export const LEDGER_DOC_TYPES: LedgerDocType[] = ["PO", "SVO", "SO", "EXP"];

export function defaultDateRange(): DateRangeStrings {
  const year = new Date().getUTCFullYear();
  return {
    from: `${year}-01-01`,
    to: `${year}-12-31`,
  };
}

export function parseDateRange(fromStr: string, toStr: string) {
  const start = new Date(`${fromStr}T00:00:00.000Z`);
  const endDay = new Date(`${toStr}T00:00:00.000Z`);
  const endExclusive = new Date(endDay.getTime() + 86400000);
  const valid =
    !Number.isNaN(start.getTime()) &&
    !Number.isNaN(endDay.getTime()) &&
    start.getTime() <= endDay.getTime();
  return { start, endExclusive, valid };
}

export function readCookieJson<T>(jar: CookieJar, name: string): T | null {
  try {
    const raw = jar.get(name)?.value;
    if (!raw) return null;
    return JSON.parse(decodeURIComponent(raw)) as T;
  } catch {
    return null;
  }
}

export function hasDateParams(params: { from?: string; to?: string }) {
  return Boolean(params.from?.trim() && params.to?.trim());
}

export function getLedgerFilterFromSources(
  params: {
    from?: string;
    to?: string;
    type?: string;
    payment?: string;
    q?: string;
  },
  jar: CookieJar
): LedgerFilterState {
  const defaults = defaultDateRange();

  if (hasDateParams(params)) {
    return {
      from: params.from!.trim(),
      to: params.to!.trim(),
      type: params.type?.trim() || undefined,
      payment: params.payment?.trim() || undefined,
      q: params.q?.trim() || undefined,
    };
  }

  const saved = readCookieJson<LedgerFilterState>(jar, LEDGER_FILTER_COOKIE);
  if (saved?.from && saved?.to) {
    return {
      from: saved.from,
      to: saved.to,
      type: saved.type,
      payment: saved.payment,
      q: saved.q,
    };
  }

  return defaults;
}

export function getPoFilterFromSources(
  params: { from?: string; to?: string; status?: string },
  jar: CookieJar
): PoFilterState {
  const defaults = defaultDateRange();

  if (hasDateParams(params)) {
    return {
      from: params.from!.trim(),
      to: params.to!.trim(),
      status: params.status?.trim() || undefined,
    };
  }

  const saved = readCookieJson<PoFilterState>(jar, PO_FILTER_COOKIE);
  if (saved?.from && saved?.to) {
    return {
      from: saved.from,
      to: saved.to,
      status: saved.status,
    };
  }

  return defaults;
}

export function getSvoFilterFromSources(
  params: { from?: string; to?: string; status?: string },
  jar: CookieJar
): SvoFilterState {
  const defaults = defaultDateRange();

  if (hasDateParams(params)) {
    return {
      from: params.from!.trim(),
      to: params.to!.trim(),
      status: params.status?.trim() || undefined,
    };
  }

  const saved = readCookieJson<SvoFilterState>(jar, SVO_FILTER_COOKIE);
  if (saved?.from && saved?.to) {
    return {
      from: saved.from,
      to: saved.to,
      status: saved.status,
    };
  }

  return defaults;
}

export function buildFilterQuery(parts: Record<string, string | undefined>) {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(parts)) {
    if (v) sp.set(k, v);
  }
  const qs = sp.toString();
  return qs ? `?${qs}` : "";
}
