import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { getCompanySettings } from "@/lib/company-settings";
import { fetchLedgerEntries, sumLedgerAmounts, sumLedgerTax } from "@/lib/ledger";
import { getT, type TKey } from "@/lib/i18n";
import { formatDate, formatYen } from "@shime/shared";
import { PageToolbar } from "@/components/ui/PageToolbar";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { ButtonLink } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { paymentBadgeVariant } from "@/components/TypeBadge";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>;
}) {
  await requireUser();
  const { t, lang } = await getT();
  const settings = await getCompanySettings();

  const currentYear = new Date().getUTCFullYear();
  const params = await searchParams;
  const year = Number(params.year) || currentYear;

  const [amounts, tax, recent] = await Promise.all([
    sumLedgerAmounts(year),
    sumLedgerTax(year),
    fetchLedgerEntries({ year }),
  ]);

  const recentEntries = recent.slice(0, 6);
  const years: number[] = [];
  for (let y = currentYear - 10; y <= currentYear + 1; y++) {
    years.push(y);
  }

  const cards: { label: TKey; value: number; accent: string }[] = [
    { label: "dashboard.sales", value: amounts.sales, accent: "metric-value--success" },
    { label: "dashboard.purchases", value: amounts.purchases, accent: "metric-value--info" },
    { label: "dashboard.expenses", value: amounts.expenses, accent: "metric-value--warning" },
    {
      label: "dashboard.net",
      value: amounts.net,
      accent: amounts.net >= 0 ? "metric-value--primary" : "metric-value--danger",
    },
  ];

  return (
    <div className="stack-lg">
      <PageToolbar
        title={t("dashboard.title")}
        actions={
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span className="muted" style={{ fontSize: "0.88rem" }}>
              {t("dashboard.year")}:
            </span>
            <div className="year-pills">
              {years.map((y) => (
                <Link
                  key={y}
                  href={`/?year=${y}`}
                  className={`year-pill${y === year ? " year-pill--active" : ""}`}
                >
                  {y}
                </Link>
              ))}
            </div>
          </div>
        }
      />

      <div className="metrics-grid">
        {cards.map((card) => (
          <Card key={card.label}>
            <CardBody>
              <div className="muted" style={{ fontSize: "0.88rem" }}>
                {t(card.label)}
              </div>
              <div className={`metric-value ${card.accent}`}>
                {formatYen(card.value, lang)}
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      {settings.jctStatus === "TAXABLE" && (
        <Card>
          <CardHeader variant="info">{t("tax.jctSummary")}</CardHeader>
          <CardBody>
            <Alert variant="warning" className="mb-4">
              {t("tax.draftDisclaimer")}
            </Alert>
            <div className="metrics-grid">
              <div>
                <div className="muted" style={{ fontSize: "0.88rem" }}>
                  {t("tax.outputTax")}
                </div>
                <div className="metric-value metric-value--success">
                  {formatYen(tax.outputTax, lang)}
                </div>
              </div>
              <div>
                <div className="muted" style={{ fontSize: "0.88rem" }}>
                  {t("tax.inputTax")}
                </div>
                <div className="metric-value metric-value--info">
                  {formatYen(tax.inputTax, lang)}
                </div>
              </div>
              <div>
                <div className="muted" style={{ fontSize: "0.88rem" }}>
                  {t("tax.netJct")}
                </div>
                <div
                  className={`metric-value ${tax.netJct >= 0 ? "metric-value--primary" : "metric-value--danger"}`}
                >
                  {formatYen(tax.netJct, lang)}
                </div>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      <Card>
        <CardHeader variant="primary">
          {t("ledger.recent")}{" "}
          <span style={{ fontWeight: 400, opacity: 0.85, fontSize: "0.88rem" }}>
            {recent.length} {t("ledger.count")}
          </span>
        </CardHeader>
        {recentEntries.length === 0 ? (
          <div className="empty-state">
            {t("ledger.empty")}{" "}
            <ButtonLink href="/purchase-orders/new" variant="primary" size="sm">
              {t("po.new")}
            </ButtonLink>
          </div>
        ) : (
          <ul className="list-divider" style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {recentEntries.map((e) => (
              <li key={`${e.docType}-${e.id}`}>
                <Link href={e.href} className="list-row">
                  <span className="tabular-nums muted" style={{ width: "6rem", flexShrink: 0 }}>
                    {formatDate(e.date, lang)}
                  </span>
                  <span className="muted" style={{ width: "2.5rem" }}>
                    {t(`ledger.type.${e.docType}` as TKey)}
                  </span>
                  <span className="muted" style={{ width: "4rem" }}>
                    {e.partyCode ?? "—"}
                  </span>
                  <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    <strong>{e.partyName}</strong>
                    <span className="muted"> · {e.number}</span>
                  </span>
                  <Badge variant={paymentBadgeVariant(e.paymentStatus)}>
                    {t(`pay.${e.paymentStatus}` as TKey)}
                  </Badge>
                  <span className="tabular-nums" style={{ fontWeight: 600 }}>
                    {formatYen(e.totalAmount, lang)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
        <div className="card-footer" style={{ textAlign: "right" }}>
          <ButtonLink href={`/ledger?year=${year}`} variant="muted" size="sm">
            {t("ledger.viewAll")} →
          </ButtonLink>
        </div>
      </Card>
    </div>
  );
}
