import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import { useMemo, useState, type FunctionComponent } from "react";
import Table from "@mui/material/Table";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TableCell from "@mui/material/TableCell";
import TableBody from "@mui/material/TableBody";
import type { DeptFunctionSummaryResponse, Flags, ViewMode } from "../types.ts";
import Stack from "@mui/material/Stack";
import { deltaColor, fmtDeltaMoney, fmtMoney } from '../helpers.ts';
import TableSortLabel from "@mui/material/TableSortLabel";

const fmtPct = (pct: number | null) => {
  if (pct === null || Number.isNaN(pct)) return "—";
  return `${pct.toFixed(1)}%`;
};

interface Row {
  flags: Flags;
  func_id: number;
  func: string;
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
  label: string,
  description: string,
  suggested?: string,
  note?: string
}

const Suggested: FunctionComponent<{ value?: string }> = ({ value }) => {
  if (!value) return null;
  return <Typography variant="body2" sx={{ opacity: 0.8, mb: 1 }}>
    <i>Suggested review:</i> {value}
  </Typography>
}
const Note: FunctionComponent<{ value?: string }> = ({ value }) => {
  if (!value) return null;
  return <Typography variant="body2" sx={{ opacity: 0.8, mb: 1 }}>
    {value}
  </Typography>
}

const computeFlags = (
  r: { dept: string; fytd_outflow_cents: number; prior_fytd_outflow_cents: number },
  baseThresholdCents: number
): Flags => {
  const flags: Flags = {};
  if (r.prior_fytd_outflow_cents === 0 && r.fytd_outflow_cents > 0) flags.newNoPrior = true;
  if (r.fytd_outflow_cents === 0 && r.prior_fytd_outflow_cents > 0) flags.noSpendYet = true;
  if (r.prior_fytd_outflow_cents > 0 && r.prior_fytd_outflow_cents < baseThresholdCents) flags.smallBase = true;
  if (/invalid/i.test(r.dept)) flags.mapping = true;
  if (/^expenditures?$/i.test(r.dept)) flags.mapping = true;
  if (/transfers/i.test(r.dept)) flags.mapping = true;
  if (/miscellaneous/i.test(r.dept)) flags.mapping = true;
  if (/misc\./i.test(r.dept)) flags.mapping = true;
  if (/non-departmental/i.test(r.dept)) flags.mapping = true;
  return flags;
};

type SortKey = "dept_id" | "dept" | "func_id" | "func" | "prior" | "current" | "delta" | "pct";
type SortDir = "asc" | "desc";

const baseThresholdCents = 100000;

export const DepartmentComparisonTable: FunctionComponent<TableDataProps> = ({ data, viewMode, label, description, suggested, note }) => {

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
      .filter(({ flags: { noSpendYet, newNoPrior, mapping } }) => {
        switch (viewMode) {
          case "no_spend": return noSpendYet;
          case "new": return newNoPrior;
          case "mapping": return mapping;
          default: return true;
        }
      });
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
        case "func":
          return aa.func.localeCompare(bb.func);
        case "func_id":
          return bb.func_id - aa.func_id;
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

  if (rows.length === 0) return null;

  const printSize = '0.7rem';

  const textStyle = {
    maxWidth: 420,
    alignItems: "center",
    flexWrap: "wrap",
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    '@media print': {
      whiteSpace: 'normal',
      overflow: 'visible',
      textOverflow: 'clip',
      fontSize: printSize,
    }
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6">{label}</Typography>
        <Typography variant="body2" sx={{ opacity: 0.8, mb: 1 }}>
          {description}
        </Typography>
        <Suggested value={suggested} />
        <Note value={note} />

        <Table size="small" sx={{
          tableLayout: 'fixed',
          width: '100%',
          '& th, & td': {
            px: 0.75,
            py: 0.5,
            fontSize: '0.78rem',
            lineHeight: 1.2,
            verticalAlign: 'top'
          },
          '& td .MuiTypography-root, & td .Mui Typography-root': {
            fontSize: 'inherit',
            lineHeight: 'inherit'
          },
          '@media print': {
            "& th, & td": {
              px: 0.5,
              py: 0.35,
              fontSize: printSize,
            },
            '& td .MuiTypography-root, & th .MuiTypograhy-root': {
              fontSize: 'inherit'
            }
          }
        }}>
          <colgroup>
            <col style={{ width: 25 }} />
            <col style={{ width: 120 }} />
            <col style={{ width: 52 }} />
            <col style={{ width: 140 }} />
            <col style={{ width: 110 }} />
            <col style={{ width: 110 }} />
            <col style={{ width: 90 }} />
            <col style={{ width: 70 }} />
          </colgroup>
          <TableHead>
            <TableRow>

              <TableCell sortDirection={sortKey === "func_id" ? sortDir : false}>
                <TableSortLabel active={sortKey === "func_id"} direction={sortDir} onClick={() => requestSort("func_id")}>
                  F.&nbsp;ID
                </TableSortLabel>
              </TableCell>

              <TableCell sortDirection={sortKey === "func" ? sortDir : false}>
                <TableSortLabel active={sortKey === "func"} direction={sortDir} onClick={() => requestSort("func")}>
                  Function
                </TableSortLabel>
              </TableCell>

              <TableCell sortDirection={sortKey === "dept_id" ? sortDir : false}>
                <TableSortLabel active={sortKey === "dept_id"} direction={sortDir} onClick={() => requestSort("dept_id")}>
                  D.&nbsp;ID
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
              const newNoPrior = !!flags?.newNoPrior;

              return (
                <TableRow key={r.dept_id} hover>
                  <TableCell>
                    <Typography variant="body2">{r.func_id}</Typography>
                  </TableCell>

                  <TableCell sx={textStyle}>
                    <Stack direction="row" spacing={1}>
                      <Typography variant="body2">{r.func}</Typography>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{r.dept_id}</Typography>
                  </TableCell>

                  <TableCell sx={textStyle}>
                    <Stack direction="row" spacing={1}>
                      <Typography variant="body2">{r.dept}</Typography>
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