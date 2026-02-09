import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";

type MonthPoint = {
  ym: string;          // YYYY-MM
  net_cents: number;
};

type NetTrendChartProps = {
  months?: MonthPoint[];
};

const formatMoneyFromCents = (cents: number) =>
  new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(cents / 100);

const formatMonthLabel = (ym: string) => {
  const d = new Date(`${ym}-01T00:00:00`);
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    year: "2-digit",
  }).format(d);
};

export const NetTrendChart = ({ months }: NetTrendChartProps) => {
  if(months === null) return;
  return (
    <Box sx={{ width: "100%", height: 260 }}>
      <Typography variant="subtitle2" sx={{ mb: 1 }}>
        Net Spend · Last 24 Months
      </Typography>

      <ResponsiveContainer>
        <LineChart data={months}>
          <XAxis
            dataKey="ym"
            tickFormatter={formatMonthLabel}
            interval={2}
            tick={{ fontSize: 12 }}
          />

          <YAxis
            tickFormatter={formatMoneyFromCents}
            width={80}
            tick={{ fontSize: 12 }}
          />

          <Tooltip
            formatter={(value: number) => formatMoneyFromCents(value)}
            labelFormatter={(label: string) =>
              formatMonthLabel(label)
            }
          />

          <Line
            type="monotone"
            dataKey="net_cents"
            stroke="#1976d2"
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </Box>
  );
};
