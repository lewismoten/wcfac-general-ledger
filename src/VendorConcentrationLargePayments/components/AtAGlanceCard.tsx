import { Card, CardContent, Typography, Box } from "@mui/material";
import type { VendorConcentrationResponse } from "../types";
import { fmtMoney } from "../../DepartmentFunctionSummary/helpers";

const hhiBand = (hhi: number | null) => {
  if (hhi === null) return "—";
  if (hhi < 1500) return "Low";
  if (hhi < 2500) return "Moderate";
  return "High";
};

const fmtDate = (iso: string) =>
  new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(new Date(`${iso}T00:00:00`));

const fmtUsd0 = (n: number) =>
  new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);

export const AtAGlanceCard = ({ data }: { data: VendorConcentrationResponse }) => {
  const hhi = data.hhi_fytd;

  const top10Sum = data.top10_vendors_fytd.reduce(
    (acc, r) => acc + (r.fytd_outflow_cents || 0),
    0
  );

  const totalOutflow = hhi?.total_outflow_cents ?? 0;

  const top10SharePct =
    totalOutflow > 0 ? (top10Sum / totalOutflow) * 100 : null;

  const monthRows = data.payments_over_threshold.month ?? [];
  const fytdRows = data.payments_over_threshold.fytd ?? [];

  const maxMonthPayment =
    monthRows.length === 0
      ? null
      : monthRows.reduce((best, r) =>
          r.amount_cents > best.amount_cents ? r : best
        , monthRows[0]);

  return (
    <Card variant="outlined" className="no-break">
      <CardContent>
        <Typography variant="h6" sx={{ mb: 2 }}>
          At a Glance
        </Typography>

        <Box
        className="report-grid"
          sx={{
            display: "grid",
            gap: 2,
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, 1fr)",
              md: "repeat(4, 1fr)",
            },
          }}
        >
          <Metric
            label="HHI (FYTD)"
            value={hhi?.hhi ?? "—"}
            sub={`${hhiBand(hhi?.hhi ?? null)} concentration`}
          />

          <Metric
            label="Top Vendor Share (FYTD)"
            value={
              hhi?.top_vendor_pct == null
                ? "—"
                : `${hhi.top_vendor_pct.toFixed(1)}%`
            }
            sub="Largest vendor’s share"
          />

          <Metric
            label="Top 10 Share (FYTD)"
            value={
              top10SharePct == null
                ? "—"
                : `${top10SharePct.toFixed(1)}%`
            }
            sub={
              totalOutflow > 0
                ? `${fmtMoney(top10Sum)} of ${fmtMoney(totalOutflow)}`
                : "—"
            }
          />

          <Metric
            label="Payments ≥ Threshold"
            value={`${monthRows.length} / ${fytdRows.length}`}
            sub={`Month / FYTD @ ${fmtUsd0(data.threshold)}`}
          />

          <Box sx={{ gridColumn: "1 / -1" }}>
            <Typography variant="overline">
              Largest Payment This Fiscal Month
            </Typography>
            <Typography variant="h5" className="large-text">
              {maxMonthPayment
                ? fmtMoney(maxMonthPayment.amount_cents)
                : "—"}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.8 }}>
              {maxMonthPayment
                ? `${maxMonthPayment.vendor} • ${fmtDate(
                    maxMonthPayment.date
                  )} • ${maxMonthPayment.dept ?? maxMonthPayment.dept_id}`
                : "No payments above threshold this month."}
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

const Metric = ({
  label,
  value,
  sub,
}: {
  label: string;
  value: string | number;
  sub?: string;
}) => (
  <Box>
    <Typography variant="overline">{label}</Typography>
    <Typography variant="h5">{value}</Typography>
    {sub && (
      <Typography variant="body2" sx={{ opacity: 0.8 }}>
        {sub}
      </Typography>
    )}
  </Box>
);
