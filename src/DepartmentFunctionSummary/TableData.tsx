import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import { useMemo, useState, type FunctionComponent } from "react";
import Chip from "@mui/material/Chip";
import Table from "@mui/material/Table";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TableCell from "@mui/material/TableCell";
import TableBody from "@mui/material/TableBody";
import Tooltip from "@mui/material/Tooltip";
import type { DeptFunctionSummaryResponse, Flags, ViewMode } from "./types";
import Stack from "@mui/material/Stack";
import { deltaColor, fmtDeltaMoney, fmtMoney } from './helpers.ts';
import TableSortLabel from "@mui/material/TableSortLabel";

const fmtPct = (pct: number | null) => {
  if (pct === null || Number.isNaN(pct)) return "—";
  return `${pct.toFixed(1)}%`;
};

interface Row {
  flags: Flags;
  dept_id: number;
  dept: string;
  current_month_outflow_cents: number;
  fytd_outflow_cents: number;
  prior_fytd_outflow_cents: number;
  variance_cents: number;
  variance_pct: number | null;
}

interface TableDataProps {
  data: DeptFunctionSummaryResponse,
  viewMode: ViewMode,
  baseThresholdCents: number
}


const computeFlags = (
  r: { dept: string; fytd_outflow_cents: number; prior_fytd_outflow_cents: number },
  baseThresholdCents: number
): Flags => {
  const flags: Flags = {};
  if (r.prior_fytd_outflow_cents === 0 && r.fytd_outflow_cents > 0) flags.newNoPrior = true;
  if (r.fytd_outflow_cents === 0 && r.prior_fytd_outflow_cents > 0) flags.noSpendYet = true;
  if (r.prior_fytd_outflow_cents > 0 && r.prior_fytd_outflow_cents < baseThresholdCents) flags.smallBase = true;
  return flags;
};

type SortKey = "dept_id" | "dept" | "prior" | "current" | "delta" | "pct";
type SortDir = "asc" | "desc";

export const TableData: FunctionComponent<TableDataProps> = ({ data, viewMode, baseThresholdCents }) => {

  const [sortKey, setSortKey] = useState<SortKey>("delta");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const rows = useMemo<Row[]>(() => {
    if (!data) return [];

    const src = viewMode === "top10" ? data.top10_by_fytd : data.by_department;

    const norm = src.map((r) => {
      const flags = computeFlags(r, baseThresholdCents);
      return { ...r, flags };
    });

    const filtered = norm
      .filter((r) => (baseThresholdCents > 0 ? r.prior_fytd_outflow_cents >= baseThresholdCents : true));
    const sorted = [...filtered].sort((a, b) => {
      const aa = sortDir === 'asc' ? a : b;
      const bb = sortDir === 'asc' ? b : a;
      switch (sortKey) {
        case "current":
          return bb.fytd_outflow_cents - aa.fytd_outflow_cents;
        case "delta":
          return bb.variance_cents - aa.variance_cents;
        case "pct": {
          const ap = aa.variance_pct ?? Number.NEGATIVE_INFINITY;
          const bp = bb.variance_pct ?? Number.NEGATIVE_INFINITY;
          return bp - ap;
        }
        case "dept":
          return aa.dept.localeCompare(bb.dept);
        case "dept_id":
          return bb.dept_id - aa.dept_id;
        case "prior":
          return bb.prior_fytd_outflow_cents - aa.prior_fytd_outflow_cents;
      }
    });

    return sorted;
  }, [data, viewMode, sortKey, sortDir, baseThresholdCents]);


  const requestSort = (k: SortKey) => {
    if (k === sortKey) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else {
      setSortKey(k);
      setSortDir(k === "dept" ? "asc" : "desc");
    }
  };
  return (
    <Card>
      <CardContent>
        <Typography variant="h6">Departments</Typography>
        <Typography variant="body2" sx={{ opacity: 0.8, mb: 1 }}>
          FYTD outflow compared to prior FYTD (same FYTD months). Percent may be muted when prior base is small.
        </Typography>

        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sortDirection={sortKey === "dept_id" ? sortDir : false}>
                <TableSortLabel active={sortKey === "dept_id"} direction={sortDir} onClick={() => requestSort("dept_id")}>
                  ID
                </TableSortLabel>
              </TableCell>

              <TableCell sortDirection={sortKey === "dept" ? sortDir : false}>
                <TableSortLabel active={sortKey === "dept"} direction={sortDir} onClick={() => requestSort("dept")}>
                  Department
                </TableSortLabel>
              </TableCell>

              <TableCell align="right" sortDirection={sortKey === "prior" ? sortDir : false}>
                <TableSortLabel active={sortKey === "prior"} direction={sortDir} onClick={() => requestSort("prior")}>
                  Prior FYTD
                </TableSortLabel>
              </TableCell>

              <TableCell align="right" sortDirection={sortKey === "current" ? sortDir : false}>
                <TableSortLabel
                  active={sortKey === "current"}
                  direction={sortDir}
                  onClick={() => requestSort("current")}
                >
                  Current FYTD
                </TableSortLabel>
              </TableCell>

              <TableCell align="right" sortDirection={sortKey === "delta" ? sortDir : false}>
                <TableSortLabel active={sortKey === "delta"} direction={sortDir} onClick={() => requestSort("delta")}>
                  Δ $
                </TableSortLabel>
              </TableCell>

              <TableCell align="right" sortDirection={sortKey === "pct" ? sortDir : false}>
                <TableSortLabel active={sortKey === "pct"} direction={sortDir} onClick={() => requestSort("pct")}>
                  Δ %
                </TableSortLabel>
              </TableCell>

            </TableRow>
          </TableHead>

          <TableBody>
            {rows.map((r) => {
              const flags = (r as any).flags as Flags | undefined;
              const pctText = fmtPct(r.variance_pct);
              const smallBase = !!flags?.smallBase;
              const newNoPrior = !!flags?.newNoPrior;

              return (
                <TableRow key={r.dept_id} hover>
                <TableCell>
                  <Typography variant="body2">{r.dept_id}</Typography>
                </TableCell>

                  <TableCell sx={{ maxWidth: 420 }}>
                    <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap" }}>
                      <Typography variant="body2">{r.dept}</Typography>

                      {newNoPrior && <Chip size="small" label="New" />}
                      {flags?.noSpendYet && <Chip size="small" label="No spend yet" />}
                      {smallBase && (
                        <Tooltip title={`Prior FYTD is small (${fmtMoney(r.prior_fytd_outflow_cents)}). Percent can look exaggerated.`}>
                          <Chip size="small" label="Small base" />
                        </Tooltip>
                      )}
                    </Stack>
                  </TableCell>

                  <TableCell align="right" sx={{ fontVariantNumeric: "tabular-nums" }}>
                    {fmtMoney(r.prior_fytd_outflow_cents)}
                  </TableCell>
                  <TableCell align="right" sx={{ fontVariantNumeric: "tabular-nums" }}>
                    {fmtMoney(r.fytd_outflow_cents)}
                  </TableCell>

                  <TableCell
                    align="right"
                    sx={{ fontVariantNumeric: "tabular-nums", color: deltaColor(r.variance_cents), fontWeight: 600 }}
                  >
                    {fmtDeltaMoney(r.variance_cents)}
                  </TableCell>

                  <TableCell
                    align="right"
                    sx={{ fontVariantNumeric: "tabular-nums", color: deltaColor(r.variance_cents) }}
                  >
                    {newNoPrior ? "—" : pctText}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>

  )
}