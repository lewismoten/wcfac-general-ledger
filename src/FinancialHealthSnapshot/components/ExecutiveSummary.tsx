import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Divider from "@mui/material/Divider";
import Typography from "@mui/material/Typography";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import type { ReactElement } from "react";
import type { FinancialHealthSnapshotResponse } from "../types";
import { formatPercentDeltaReadable } from "./formatPercentDeltaReadable";

// const NA = "—";

const money = (cents: number, fractions = false) =>
  new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: fractions ? 2 : 0,
  }).format(cents / 100);

const pct = (current: number, prior: number): string => {
  return formatPercentDeltaReadable(current, prior);
  // if (prior === 0) return current === 0 ? "0.0%" : NA;
  // return `${(((current - prior) / prior) * 100).toFixed(1)}%`;
};

const fmtMonthYear = (isoStart: string) => {
  const d = new Date(`${isoStart}T00:00:00`);
  return new Intl.DateTimeFormat(undefined, { month: "long", year: "numeric" }).format(d);
};

const sign = (n: number) => (n < 0 ? "decrease" : n > 0 ? "increase" : "no change");

const offsetsMateriality = (offsetCents: number, outflowCents: number) => {
  if (outflowCents === 0) return { label: "Offsets not applicable", ratio: 0 };
  const ratio = Math.abs(offsetCents) / Math.abs(outflowCents); // 0..1
  if (ratio < 0.001) return { label: "Offsets are negligible", ratio };       // <0.1%
  if (ratio < 0.01) return { label: "Offsets are minor", ratio };             // <1%
  if (ratio < 0.03) return { label: "Offsets are noticeable", ratio };        // <3%
  return { label: "Offsets are material", ratio };                             // >=3%
};


type Insight = {
  headline: string;
  detail?: string;
};

const buildInsights = (data: FinancialHealthSnapshotResponse): Insight[] => {
  const cm = data.summary.current_month;
  const pm = data.summary.prior_year_month;
  const fy = data.summary.fytd;
  const pfy = data.summary.prior_fytd;

  const monthName = fmtMonthYear(data.ranges.month.start);

  const monthDeltaOut = cm.outflow_cents - pm.outflow_cents;
  const monthDeltaNet = cm.net_cents - pm.net_cents;

  const fytdDeltaOut = fy.outflow_cents - pfy.outflow_cents;
  // const fytdDeltaNet = fy.net_cents - pfy.net_cents;

  const monthOffsetNote = offsetsMateriality(cm.offset_cents, cm.outflow_cents);
  const fytdOffsetNote = offsetsMateriality(fy.offset_cents, fy.outflow_cents);

  const movers = [...(data.by_department ?? [])]
    .map(d => ({
      id: d.dept_id,
      dept: d.dept,
      delta: d.delta_outflow_cents ?? (d.current_outflow_cents - d.prior_outflow_cents),
      current: d.current_outflow_cents,
      prior: d.prior_outflow_cents,
    }))
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
    .slice(0, 3);

  const moverText =
    movers.length === 0
      ? undefined
      : movers
          .map(m => `${m.id} ${m.dept}: ${money(m.delta, true)} (${pct(m.current, m.prior)})`)
          .join(" · ");

  const insights: Insight[] = [
    {
      headline: `${monthName} outflow shows a ${sign(monthDeltaOut)} vs prior year: ${money(monthDeltaOut, true)} (${pct(cm.outflow_cents, pm.outflow_cents)}).`,
      detail: `Prior: ${money(pm.outflow_cents)} · Current: ${money(cm.outflow_cents)}.`,
    },
    {
      headline: `${monthName} net shows a ${sign(monthDeltaNet)} vs prior year: ${money(monthDeltaNet, true)} (${pct(cm.net_cents, pm.net_cents)}).`,
      detail: `Prior: ${money(pm.net_cents)} · Current: ${money(cm.net_cents)}.`,
    },
    {
      headline: `FY${data.fy} year-to-date outflow shows a ${sign(fytdDeltaOut)} vs prior FYTD: ${money(fytdDeltaOut, true)} (${pct(fy.outflow_cents, pfy.outflow_cents)}).`,
      detail: `Prior FYTD: ${money(pfy.outflow_cents)} · Current FYTD: ${money(fy.outflow_cents)}.`,
    },
    {
      headline: `Offsets: ${monthOffsetNote.label} for the selected month; ${fytdOffsetNote.label} for FYTD.`,
      detail: `Month offsets: ${money(cm.offset_cents, true)} · FYTD offsets: ${money(fy.offset_cents, true)}.`,
    },
  ];

  if (moverText) {
    insights.push({
      headline: `Largest month-over-month changes by department (YoY outflow Δ):`,
      detail: moverText,
    });
  }

  return insights;
};

type ExecutiveSummaryProps = {
  data?: FinancialHealthSnapshotResponse;
};

export const ExecutiveSummary = ({ data }: ExecutiveSummaryProps): ReactElement | null => {
  if (!data) return null;

  const cm = data.summary.current_month;
  const pm = data.summary.prior_year_month;
  const fy = data.summary.fytd;
  const pfy = data.summary.prior_fytd;

  const monthName = fmtMonthYear(data.ranges.month.start);
  const insights = buildInsights(data);

  return (
    <Card>
      <CardContent>
        <Typography variant="h6">Executive Summary</Typography>
        <Typography variant="body2" sx={{ opacity: 0.8, mb: 1 }}>
          Month: {monthName} · FY{data.fy} (Fiscal Month {data.fm})
        </Typography>

        <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", mb: 1 }}>
          <Box>
            <Typography variant="caption" color="text.secondary">Month Outflow (Current / Prior)</Typography>
            <Typography sx={{ fontVariantNumeric: "tabular-nums", fontFeatureSettings: '"tnum"' }}>
              {money(cm.outflow_cents)} / {money(pm.outflow_cents)}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">FYTD Outflow (Current / Prior)</Typography>
            <Typography sx={{ fontVariantNumeric: "tabular-nums", fontFeatureSettings: '"tnum"' }}>
              {money(fy.outflow_cents)} / {money(pfy.outflow_cents)}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">Month Net (Current / Prior)</Typography>
            <Typography sx={{ fontVariantNumeric: "tabular-nums", fontFeatureSettings: '"tnum"' }}>
              {money(cm.net_cents)} / {money(pm.net_cents)}
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ my: 1 }} />

        <List dense sx={{ m: 0, p: 0 }}>
          {insights.map((i, idx) => (
            <ListItem key={idx} sx={{ display: "block", py: 0.5 }}>
              <Typography variant="body2">{i.headline}</Typography>
              {i.detail && (
                <Typography variant="caption" color="text.secondary">
                  {i.detail}
                </Typography>
              )}
            </ListItem>
          ))}
        </List>
      </CardContent>
    </Card>
  );
};
