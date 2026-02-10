import { useState, type FunctionComponent } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine
} from "recharts";

type MetricKey = "net_cents" | "outflow_cents" | "offset_cents";

type MonthPoint = {
  ym: string; // YYYY-MM
  net_cents: number;
  outflow_cents: number;
  offset_cents: number;
};

type TrendChartProps = {
  months?: MonthPoint[];
  title?: string;
  defaultMetric?: MetricKey; // net by default
};

const formatMoneyFromCents = (cents: number, fractions: boolean = false) =>
  new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: fractions ? 2 : 0,
  }).format(cents / 100);

const formatMonthLabel = (ym: string, long: boolean = false) => {
  const d = new Date(`${ym}-01T00:00:00`);
  return new Intl.DateTimeFormat(undefined, {
    month: long ? 'long' : "short",
    year: long ? 'numeric' : "2-digit",
  }).format(d);
};

const metricLabel = (k: MetricKey) => {
  switch (k) {
    case "net_cents":
      return "Net";
    case "outflow_cents":
      return "Outflow";
    case "offset_cents":
      return "Offsets";
  }
};
const niceCeiling = (value: number): number => {
  if (value <= 0 || !Number.isFinite(value)) return 0;
  const magnitude = Math.pow(10, Math.floor(Math.log10(value)));
  const leading = Math.ceil(value / magnitude);
  return leading * magnitude;
};
const formatCompactMoney = (value: number) =>
  new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    notation: "compact",
    compactDisplay: "short",
    maximumFractionDigits: 1,
  }).format(value / 100);

export const TrendChart: FunctionComponent<TrendChartProps> = ({
  months = [],
  title = "Trend · Last 24 Months",
  defaultMetric = "net_cents",
}) => {
  const [metric, setMetric] = useState<MetricKey>(defaultMetric);

  const handleMetric = (_: unknown, next: MetricKey | null) => {
    if (!next) return; // keep one selected
    setMetric(next);
  };

  if(!months?.length) return null;

  return (
    <Box sx={{ width: "100%" }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          gap: 2,
          mb: 1,
          flexWrap: "wrap",
        }}
      >
        <Typography variant="subtitle2">
          {title} · {metricLabel(metric)}
        </Typography>

        <ToggleButtonGroup
          size="small"
          exclusive
          value={metric}
          onChange={handleMetric}
          aria-label="Select metric"
        >
          <ToggleButton value="net_cents" aria-label="Net">
            Net
          </ToggleButton>
          <ToggleButton value="outflow_cents" aria-label="Outflow">
            Outflow
          </ToggleButton>
          <ToggleButton value="offset_cents" aria-label="Offsets">
            Offsets
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      <Box sx={{ width: "100%", height: 280 }}>
        <ResponsiveContainer>
          <LineChart data={months}>
            <CartesianGrid strokeDasharray="3 3" />
            <ReferenceLine y={0} strokeDasharray="3 3" />
            <XAxis
              dataKey="ym"
              tickFormatter={ym => formatMonthLabel(ym, false)}
              interval={2}
              tick={{ fontSize: 12 }}
            />

            <YAxis
              domain={[0, niceCeiling]}
              tickCount={5}
              tickFormatter={formatCompactMoney}
              width={84}
              tick={{ fontSize: 12 }}
            />

            <Tooltip
              formatter={(value: number) => formatMoneyFromCents(value, true)}
              labelFormatter={(label: string) => formatMonthLabel(label, true)}
              cursor={{ strokeDasharray: "3 3" }}
            />

            <Line
              type="monotone"
              dataKey={metric}
              name={metricLabel(metric)}
              stroke="#1976d2"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </Box>
      <Typography variant="body2" sx={{ opacity: 0.8 }}>
        Values reflect check date; offsets = outflow - net.
      </Typography>
    </Box>
  );
};
