import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Grid";
import type { FunctionComponent } from "react";
import type { FinancialHealthSnapshotResponse } from "../types";
import { ComparisonTable } from "./ComparisonTable";

const formatFiscalMonthHeader = (isoDate: string, fy: number) => {
  const d = new Date(`${isoDate}T00:00:00`);
  const monthYear = new Intl.DateTimeFormat(undefined, {
    month: "long",
    year: "numeric",
  }).format(d);

  return `${monthYear} · FY${fy}`;
};
const formatFytdHeader = (
  startIso: string,
  endExclusiveIso: string,
  fy: number
) => {
  const start = new Date(`${startIso}T00:00:00`);
  const end = new Date(`${endExclusiveIso}T00:00:00`);
  end.setMonth(end.getMonth() - 1); // inclusive month

  const fmt = new Intl.DateTimeFormat(undefined, {
    month: "long",
    year: "numeric",
  });

  return `${fmt.format(start)} – ${fmt.format(end)} · FY${fy} YTD`;
};
const formatMonthYear = (isoDate: string) => {
  const d = new Date(`${isoDate}T00:00:00`);
  return new Intl.DateTimeFormat(undefined, { month: "long", year: "numeric" }).format(d);
};

const formatFytdComparedTo = (fytdStartIso: string, fytdEndExclusiveIso: string) => {
  const start = new Date(`${fytdStartIso}T00:00:00`);
  const end = new Date(`${fytdEndExclusiveIso}T00:00:00`);
  end.setMonth(end.getMonth() - 1); // inclusive month

  const fmt = new Intl.DateTimeFormat(undefined, { month: "long", year: "numeric" });
  return `${fmt.format(start)} – ${fmt.format(end)}`;
};
type SummaryProps = {
  data?: FinancialHealthSnapshotResponse;
};

export const Summary: FunctionComponent<SummaryProps> = ({ data }) => {
  if (!data) return null;

  const monthHeader = formatFiscalMonthHeader(
    data.ranges.month.start,
    data.fy
  );
  const fytdHeader = formatFytdHeader(
    data.ranges.fytd.start,
    data.ranges.fytd.end_exclusive,
    data.fy
  );

  const monthComparedTo = formatMonthYear(data.ranges.prior_month.start);
  const fytdComparedTo = formatFytdComparedTo(data.ranges.prior_fytd.start, data.ranges.prior_fytd.end_exclusive);

  return (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12, md: 6 }}>
        <Card>
          <CardContent>
            <Typography variant="h6">{monthHeader}</Typography>
            <Typography variant="body2" sx={{ opacity: 0.8 }}>
              Compared to {monthComparedTo}
            </Typography>
            <ComparisonTable
              rows={[
                {
                  label: "Outflow",
                  prior: data.summary.prior_year_month.outflow_cents,
                  current: data.summary.current_month.outflow_cents,
                },
                {
                  label: "Offsets (credits / reversals)",
                  prior: data.summary.prior_year_month.offset_cents,
                  current: data.summary.current_month.offset_cents,
                },
                {
                  label: "Net",
                  prior: data.summary.prior_year_month.net_cents,
                  current: data.summary.current_month.net_cents,
                },
              ]}
            />
          </CardContent>
        </Card>
      </Grid>

      <Grid size={{ xs: 12, md: 6 }}>
        <Card>
          <CardContent>
            <Typography variant="h6">{fytdHeader}</Typography>

            <Typography variant="body2" sx={{ opacity: 0.8 }}>
              Compared to FYTD through {fytdComparedTo}
            </Typography>
            <ComparisonTable
              rows={[
                {
                  label: "Outflow",
                  prior: data.summary.prior_fytd.outflow_cents,
                  current: data.summary.fytd.outflow_cents,
                },
                {
                  label: "Offsets (credits / reversals)",
                  prior: data.summary.prior_fytd.offset_cents,
                  current: data.summary.fytd.offset_cents,
                },
                {
                  label: "Net",
                  prior: data.summary.prior_fytd.net_cents,
                  current: data.summary.fytd.net_cents,
                },
              ]}
            />
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};
