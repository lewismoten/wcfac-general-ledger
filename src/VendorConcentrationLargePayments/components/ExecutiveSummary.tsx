import { Card, CardContent, Typography, Box } from "@mui/material";
import type { VendorConcentrationResponse } from "../types";
import { fmtMoney } from "../../DepartmentFunctionSummary/helpers";

const hhiBand = (hhi: number | null) => {
  if (hhi === null) return null;
  if (hhi < 1500) return "low";
  if (hhi < 2500) return "moderate";
  return "high";
};

const fmtDate = (iso: string) =>
  new Intl.DateTimeFormat(undefined, { year: "numeric", month: "short", day: "2-digit" }).format(
    new Date(`${iso}T00:00:00`)
  );

export const ExecutiveSummary = ({ data }: { data: VendorConcentrationResponse }) => {
  const hhi = data.hhi_fytd;
  const totalOutflow = hhi?.total_outflow_cents ?? 0;

  const top10Sum = data.top10_vendors_fytd.reduce((acc, r) => acc + (r.fytd_outflow_cents || 0), 0);
  const top10Share = totalOutflow > 0 ? (top10Sum / totalOutflow) * 100 : null;

  const topVendorPct = hhi?.top_vendor_pct ?? null;
  const band = hhiBand(hhi?.hhi ?? null);

  const monthRows = data.payments_over_threshold.month ?? [];
  const fytdRows = data.payments_over_threshold.fytd ?? [];

  const maxMonth =
    monthRows.length === 0
      ? null
      : monthRows.reduce((best, r) => (r.amount_cents > best.amount_cents ? r : best), monthRows[0]);

  const followups: string[] = [];
  if (topVendorPct != null && topVendorPct >= 20) {
    followups.push("Top vendor share is relatively high—worth confirming contract scope, pricing terms, and whether spend is expected this fiscal year.");
  }
  if (top10Share != null && top10Share >= 60) {
    followups.push("A large share of FYTD spend sits with the top vendors—worth confirming whether this reflects normal operations or timing (e.g., annual renewals, capital projects).");
  }
  if (maxMonth && maxMonth.amount_cents >= data.threshold * 100 * 2) {
    followups.push("The largest payment this month is well above the review threshold—worth confirming the invoice/PO context and approval trail.");
  }
  if (monthRows.length === 0) {
    followups.push("No payments exceeded the review threshold this fiscal month.");
  }

  const lines: string[] = [];

  if (hhi?.hhi != null) {
    lines.push(
      `FYTD vendor concentration is ${band ?? "—"} (HHI ${hhi.hhi.toFixed(2)}).`
    );
  } else {
    lines.push("FYTD vendor concentration is not available for this period.");
  }

  if (topVendorPct != null) {
    lines.push(`The top vendor represents ${topVendorPct.toFixed(1)}% of FYTD outflow.`);
  }

  if (top10Share != null) {
    lines.push(`The top 10 vendors represent ${top10Share.toFixed(1)}% of FYTD outflow (${fmtMoney(top10Sum)} of ${fmtMoney(totalOutflow)}).`);
  }

  lines.push(`Payments ≥ threshold: ${monthRows.length} this fiscal month and ${fytdRows.length} FYTD (threshold ${new Intl.NumberFormat(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(data.threshold)}).`);

  if (maxMonth) {
    lines.push(`Largest threshold payment this month: ${fmtMoney(maxMonth.amount_cents)} to ${maxMonth.vendor} (${maxMonth.dept ?? maxMonth.dept_id}) on ${fmtDate(maxMonth.date)}.`);
  }

  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="h6" sx={{ mb: 1 }}>
          Executive Summary
        </Typography>

        <Typography variant="body1" sx={{ mb: 2 }}>
          {lines.join(" ")}
        </Typography>

        {followups.length > 0 && (
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Suggested follow-ups
            </Typography>
            <Box component="ul" sx={{ m: 0, pl: 2 }}>
              {followups.slice(0, 4).map((t, i) => (
                <li key={i}>
                  <Typography variant="body2">{t}</Typography>
                </li>
              ))}
            </Box>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};
