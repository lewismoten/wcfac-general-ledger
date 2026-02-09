import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Grid";
import type { FunctionComponent } from "react";
import type { FinancialHealthSnapshotResponse } from "../types";

// helper
const formatMoneyFromCents = (cents: number) =>
  new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(cents / 100);

const formatSignedDelta = (cents: number) => {
  const s = formatMoneyFromCents(Math.abs(cents));
  return cents < 0 ? `−${s}` : `+${s}`;
};

const formatRange = (start: string, endExclusive: string) =>
  `${start} → ${endExclusive}`;

const deltaColor = (cents: number) =>
  cents < 0 ? "success.main" : "error.main";

type SummaryProps = {
  data?: FinancialHealthSnapshotResponse;
};

export const Summary: FunctionComponent<SummaryProps> = ({ data }) => {
  if (!data) return null;
  return (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12, md: 6 }}>
        <Card>
          <CardContent>
            <Typography variant="h6">Current Month</Typography>
            <Typography variant="body2" sx={{ opacity: 0.8 }}>
              {formatRange(data.ranges.month.start, data.ranges.month.end_exclusive)}
            </Typography>

            <Row
              label="Outflow"
              value={formatMoneyFromCents(data.summary.current_month.outflow_cents)}
            />
            <Row
              label="Offsets (credits/reversals)"
              value={formatMoneyFromCents(data.summary.current_month.offset_cents)}
            />
            <Row
              label="Net"
              value={formatMoneyFromCents(data.summary.current_month.net_cents)}
            />
            <Row
              label="YoY Outflow"
              color={deltaColor(data.summary_delta.month_yoy.outflow_cents)}
              value={formatSignedDelta(data.summary_delta.month_yoy.outflow_cents)}
            />
            <Row
              label="YoY Offsets (credits/reversals)"
              color={deltaColor(data.summary_delta.month_yoy.offset_cents)}
              value={formatSignedDelta(data.summary_delta.month_yoy.offset_cents)}
            />
            <Row
              label="YoY Net"
              color={deltaColor(data.summary_delta.month_yoy.net_cents)}
              value={formatSignedDelta(data.summary_delta.month_yoy.net_cents)}
            />
          </CardContent>
        </Card>
      </Grid>

      <Grid size={{ xs: 12, md: 6 }}>
        <Card>
          <CardContent>
            <Typography variant="h6">Fiscal YTD</Typography>
            <Typography variant="body2" sx={{ opacity: 0.8 }}>
              {formatRange(data.ranges.fytd.start, data.ranges.fytd.end_exclusive)}
            </Typography>

            <Row
              label="Outflow"
              value={formatMoneyFromCents(data.summary.fytd.outflow_cents)}
            />
            <Row
              label="Offsets (credits/reversals)"
              value={formatMoneyFromCents(data.summary.fytd.offset_cents)}
            />
            <Row
              label="Net"
              value={formatMoneyFromCents(data.summary.fytd.net_cents)}
            />
            <Row
              label="YoY Outflow"
              value={formatSignedDelta(data.summary_delta.fytd_yoy.outflow_cents)}
              color={deltaColor(data.summary_delta.fytd_yoy.outflow_cents)}
            />
            <Row
              label="YoY Offsets (credits/reversals)"
              value={formatSignedDelta(data.summary_delta.fytd_yoy.offset_cents)}
              color={deltaColor(data.summary_delta.fytd_yoy.offset_cents)}
            />
            <Row
              label="YoY Net"
              value={formatSignedDelta(data.summary_delta.fytd_yoy.net_cents)}
              color={deltaColor(data.summary_delta.fytd_yoy.net_cents)}
            />
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  )

}
const Row = ({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color?: string;
}) => (
  <Grid container>
    <Grid size={8}>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
    </Grid>
    <Grid size={4}>
      <Typography
        variant="body2"
        sx={{
          textAlign: "right",
          fontVariantNumeric: "tabular-nums",
          fontFeatureSettings: '"tnum"',
          color,
        }}
      >
        {value}
      </Typography>
    </Grid>
  </Grid>
);
