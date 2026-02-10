import { useMemo, useState, type ReactElement } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
  ReferenceLine,
} from "recharts";
import { currentFiscalMonth, currentFiscalYear } from "../../utils/fiscal";

type MetricKey = "net_cents" | "outflow_cents" | "offset_cents";

type MonthPoint = {
  fy: number;
  fm: number; // 1..12 fiscal month
  ym: string; // YYYY-MM
  net_cents: number;
  outflow_cents: number;
  offset_cents: number;
};

type FyCompareBarChartProps = {
  months?: MonthPoint[];     // monthly_24.months
  fy?: number;               // selected fiscal year (e.g. 2025)
  fm?: number;               // selected fiscal month (e.g. 9)
  title?: string;
  defaultMetric?: MetricKey;
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

const fiscalMonthName = (fm: number): string => {
  // FY month 1 = Jul
  const monthIndex = (6 + (fm - 1)) % 12; // 0=Jan ... 6=Jul
  const d = new Date(2000, monthIndex, 1);
  return new Intl.DateTimeFormat(undefined, { month: "short" }).format(d);
};

// Round ceiling like you described: leading digit up, rest zeros.
// e.g. 6,270,852 -> 7,000,000
const niceCeiling = (value: number): number => {
  if (!Number.isFinite(value) || value <= 0) return 0;
  const magnitude = Math.pow(10, Math.floor(Math.log10(value)));
  const leading = Math.ceil(value / magnitude);
  return leading * magnitude;
};

// cents -> compact currency string, e.g. $1.1M, $11K
const formatCompactMoneyFromCents = (cents: number) =>
  new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    notation: "compact",
    compactDisplay: "short",
    maximumFractionDigits: 1,
  }).format(cents / 100);

const formatMoneyFromCents = (cents: number, fractions = false) =>
  new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: fractions ? 2 : 0,
  }).format(cents / 100);

type Row = {
  fm: number;
  label: string; // Jul, Aug...
  prior: number; // cents
  current: number; // cents
};

export const FyCompareBarChart = ({
  months = [],
  fy = currentFiscalYear(new Date()),
  fm = currentFiscalMonth(new Date()),
  title = "FY vs Prior FY · Same Months",
  defaultMetric = "net_cents",
}: FyCompareBarChartProps): ReactElement => {
  const [metric, setMetric] = useState<MetricKey>(defaultMetric);

  const data: Row[] = useMemo(() => {
    // Only months 1..fm, and only fy and fy-1
    const currentFy = fy;
    const priorFy = fy - 1;

    const getVal = (targetFy: number, targetFm: number): number => {
      const found = months.find((m) => m.fy === targetFy && m.fm === targetFm);
      return found ? (found[metric] ?? 0) : 0;
    };

    const rows: Row[] = [];
    for (let i = 1; i <= fm; i++) {
      rows.push({
        fm: i,
        label: fiscalMonthName(i),
        prior: getVal(priorFy, i),
        current: getVal(currentFy, i),
      });
    }
    return rows;
  }, [months, fy, fm, metric]);

  const yMax = useMemo(() => {
    let max = 0;
    for (const r of data) {
      if (r.prior > max) max = r.prior;
      if (r.current > max) max = r.current;
    }
    return niceCeiling(max);
  }, [data]);

  const handleMetric = (_: unknown, next: MetricKey | null) => {
    if (!next) return;
    setMetric(next);
  };

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
          {title} · {metricLabel(metric)} · FY{fy} vs FY{fy - 1}
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

      <Box sx={{ width: "100%", height: 300 }}>
        <ResponsiveContainer>
          <BarChart data={data} barCategoryGap="20%">
            <CartesianGrid strokeDasharray="3 3" />
            <ReferenceLine y={0} />
            <XAxis dataKey="label" tick={{ fontSize: 12 }} />
            <YAxis
              domain={[0, yMax]}
              tickCount={5}
              tickFormatter={formatCompactMoneyFromCents}
              width={84}
              tick={{ fontSize: 12 }}
            />
            <Tooltip
              formatter={(value: number) => formatMoneyFromCents(value, true)}
              labelFormatter={(label: string) => `Fiscal Month: ${label}`}
              cursor={{ strokeDasharray: "3 3" }}
            />
            <Legend />
            <Bar
              dataKey="prior"
              name={`FY${fy - 1}`}
              fill="#9e9e9e"   // gray for prior year
            />

            <Bar
              dataKey="current"
              name={`FY${fy}`}
              fill="#1976d2"   // MUI primary blue
            />
          </BarChart>
        </ResponsiveContainer>
      </Box>

      <Typography variant="body2" sx={{ opacity: 0.8 }}>
        Same fiscal months (FM 1–{fm}). Values reflect check date.
      </Typography>
    </Box>
  );
};
