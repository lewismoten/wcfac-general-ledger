import type { FunctionComponent } from "react";
import type { DeptOutflowRow } from "../types";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import { deltaColor, fmtDeltaMoney, fmtMoney } from "../helpers";

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
  summary: Summary | null;
}> = ({ summary }) => {
  if (!summary) return null;

  const narrative = buildExecutiveNarrative(summary);

  return (
    <Card>
      <CardContent>
        <Typography variant="h6">Executive Summary</Typography>

        <Typography variant="body2" sx={{ mt: 1, opacity: 0.9 }}>
          {narrative}
        </Typography>

        <Stack direction="row" spacing={2} sx={{ flexWrap: "wrap", mt: 1.5 }}>
          <SummaryStat label="Total FYTD (Current)" value={fmtMoney(summary.totalCurrent)} />
          <SummaryStat label="Total FYTD (Prior)" value={fmtMoney(summary.totalPrior)} />
          <SummaryStat
            label="Δ FYTD"
            value={fmtDeltaMoney(summary.totalDelta)}
            color={deltaColor(summary.totalDelta)}
          />
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
  );
};

function buildExecutiveNarrative(s: Summary): string {
  if(s.totalDelta === 0) {
    return "Net FYTD outflow is consistent with the same period last fiscal year.";

  }
  const absDelta = Math.abs(s.totalDelta);

  const direction =
    s.totalDelta < 0 ? "down" : s.totalDelta > 0 ? "up" : "flat";

  const vsPrior = `Net FYTD outflow is ${direction} ${fmtDeltaMoney(absDelta, true)} compared to the same period last year.`;

  const primaryDrivers =
    s.totalDelta < 0 ? s.topDown : s.totalDelta > 0 ? s.topUp : [];

  const driverNames = primaryDrivers
    .slice(0, 3)
    .map((r) => r.dept)
    .filter(Boolean);

  const driversClause =
    driverNames.length > 0
      ? ` Primary drivers: movement in ${joinAsSentence(driverNames)}.`
      : "";

  const contextBits: string[] = [];
  if (s.newNoPriorCount > 0) contextBits.push(`${s.newNoPriorCount} new/re-activated line(s)`);
  if (s.noSpendYetCount > 0) contextBits.push(`${s.noSpendYetCount} department(s) with no spend yet`);
  if (s.smallBaseCount >= 5) contextBits.push(`${s.smallBaseCount} small-base variance(s)`);

  const contextClause =
    contextBits.length > 0
      ? ` Oversight notes: ${joinAsSentence(contextBits)}.`
      : "";

  return `${vsPrior}${driversClause}${contextClause}`;
}

function joinAsSentence(items: string[]): string {
  if (items.length === 0) return "";
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
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
