import type { FunctionComponent } from "react"
import type { DeptOutflowRow } from "./types";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import { deltaColor, fmtDeltaMoney, fmtMoney } from "./helpers";

interface Summary {
  totalCurrent: number;
  totalPrior: number;
  totalDelta: number;
  newNoPriorCount: number;
  noSpendYetCount: number;
  smallBaseCount: number;
  topUp: DeptOutflowRow[];
  topDown: DeptOutflowRow[];
}

export const ExecutiveSummary: FunctionComponent<{
  summary: Summary | null
}> = ({ summary }) => {
  if (!summary) return null;
  return (
    <Card>
      <CardContent>
        <Typography variant="h6">Executive Summary</Typography>

        <Stack direction="row" spacing={2} sx={{ flexWrap: "wrap", mt: 1 }}>
          <SummaryStat label="Total FYTD (Current)" value={fmtMoney(summary.totalCurrent)} />
          <SummaryStat label="Total FYTD (Prior)" value={fmtMoney(summary.totalPrior)} />
          <SummaryStat label="Δ FYTD" value={fmtDeltaMoney(summary.totalDelta)} color={deltaColor(summary.totalDelta)} />
          <SummaryStat label="New / no prior" value={`${summary.newNoPriorCount}`} />
          <SummaryStat label="No spend yet" value={`${summary.noSpendYetCount}`} />
        </Stack>

        <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ mt: 2 }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle2">Top increases by Δ$</Typography>
            {summary.topUp.map((r) => (
              <Typography key={r.dept_id} variant="body2" sx={{ mt: 0.5 }}>
                {r.dept}:{" "}
                <Box component="span" sx={{ color: deltaColor(r.variance_cents), fontVariantNumeric: "tabular-nums" }}>
                  {fmtDeltaMoney(r.variance_cents)}
                </Box>
              </Typography>
            ))}
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle2">Top decreases by Δ$</Typography>
            {summary.topDown.map((r) => (
              <Typography key={r.dept_id} variant="body2" sx={{ mt: 0.5 }}>
                {r.dept}:{" "}
                <Box component="span" sx={{ color: deltaColor(r.variance_cents), fontVariantNumeric: "tabular-nums" }}>
                  {fmtDeltaMoney(r.variance_cents)}
                </Box>
              </Typography>
            ))}
          </Box>
        </Stack>
      </CardContent>
    </Card>
  )
}

const SummaryStat = ({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color?: string;
}) => (
  <Box sx={{ minWidth: 180 }}>
    <Typography variant="body2" sx={{ opacity: 0.75 }}>
      {label}
    </Typography>
    <Typography
      variant="body1"
      sx={{ fontVariantNumeric: "tabular-nums", fontWeight: 600, color }}
    >
      {value}
    </Typography>
  </Box>
);
