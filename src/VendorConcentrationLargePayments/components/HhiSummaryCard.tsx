import { Card, CardContent, Typography, Stack } from "@mui/material";
import type { VendorConcentrationResponse } from "../types";
import { fmtMoney } from "../../DepartmentFunctionSummary/helpers";

const hhiBand = (hhi: number | null) => {
  if (hhi === null) return "—";
  if (hhi < 1500) return "Low concentration";
  if (hhi < 2500) return "Moderate concentration";
  return "High concentration";
};

export const HhiSummaryCard = ({ data }: { data: VendorConcentrationResponse }) => {
  const hhi = data.hhi_fytd;

  return (
    <Card variant="outlined" className="no-break">
      <CardContent>
        <Typography variant="h6">Vendor Concentration (FYTD)</Typography>
        <Typography variant="body2" sx={{ opacity: 0.8, mb: 1 }}>
          HHI is the sum of squared vendor spend shares (0–10,000). It’s a signal, not a verdict.
        </Typography>

        {!hhi ? (
          <Typography variant="body2">No data available for this period.</Typography>
        ) : (
          <Stack direction={{ xs: "column", md: "row" }} spacing={3}>
            <div>
              <Typography variant="overline">HHI</Typography>
              <Typography variant="h5">{hhi.hhi ?? "—"}</Typography>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>
                {hhiBand(hhi.hhi)}
              </Typography>
            </div>

            <div>
              <Typography variant="overline">Top Vendor Share</Typography>
              <Typography variant="h5">
                {hhi.top_vendor_pct == null ? "—" : `${hhi.top_vendor_pct.toFixed(1)}%`}
              </Typography>
            </div>

            <div>
              <Typography variant="overline">Vendors Paid (FYTD)</Typography>
              <Typography variant="h5">{hhi.vendor_count}</Typography>
            </div>

            <div>
              <Typography variant="overline">Total Outflow (FYTD)</Typography>
              <Typography variant="h5">{fmtMoney(hhi.total_outflow_cents)}</Typography>
            </div>
          </Stack>
        )}
      </CardContent>
    </Card>
  );
};
