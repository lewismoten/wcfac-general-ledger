import { Card, CardContent, Typography } from "@mui/material";
import type { VendorTopRow } from "../types";
import { fmtMoney } from "../../DepartmentFunctionSummary/helpers";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from "recharts";
import useTheme from "@mui/system/useTheme";
import type { FunctionComponent } from "react";

const tooltipFormatter = (value: any) => fmtMoney(Number(value));
const truncate = (s: string, n = 28) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);

export const TopVendorsBarChart = ({ rows }: { rows: VendorTopRow[] }) => {

  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="h6">Top 10 Vendors – FYTD</Typography>
        <Typography variant="body2" sx={{ opacity: 0.8, mb: 1 }}>
          Sorted by FYTD expenditure. Percent is share of total FYTD outflow.
        </Typography>

        <div style={{ width: "100%", height: 420 }} className="chart-container">
          <ResponsiveContainer className="screen-only">
            <MyChart rows={rows}  height={420} />
          </ResponsiveContainer>
          <div className="print-only">
            <MyChart rows={rows} width={1050} height={420} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

interface MyChartProps {
  rows: VendorTopRow[] ,
  width?: number,
  height: number
}

const MyChart: FunctionComponent<MyChartProps> = ({ rows, width, height }) => {
  const { palette } = useTheme();
  const fills = [
    palette.primary.main,
    palette.secondary.main,
    palette.success.main,
    palette.warning.main,
    palette.info.main,
    palette.error.main
  ]

  const data = rows.map((r) => ({
    vendor: truncate(r.vendor),
    fytd_outflow_cents: r.fytd_outflow_cents,
    pct: r.pct_of_total,
  }));

  return (
  <BarChart data={data} width={width} height={height} layout="vertical" margin={{ left: 10, right: 30 }}>
    <CartesianGrid strokeDasharray="3 3" />
    <XAxis
      type="number"
      tickFormatter={(v) => fmtMoney(Number(v))}
    />
    <YAxis
      type="category"
      dataKey="vendor"
      width={160}
      tick={{ fontSize: 12 }}
    />
    <Tooltip formatter={tooltipFormatter} />
    <Bar dataKey="fytd_outflow_cents">
      {data.map((_, i) => (<Cell key={i} fill={fills[i % fills.length]} />))}
    </Bar>
  </BarChart>)
}