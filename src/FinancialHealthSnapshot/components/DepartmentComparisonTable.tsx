import { useMemo, useState, type ReactElement } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TableSortLabel from "@mui/material/TableSortLabel";

type MetricKey = "net" | "outflow" | "offset";

export type DeptRow = {
  dept_id: number;
  dept: string;

  current_net_cents: number;
  prior_net_cents: number;

  current_outflow_cents: number;
  prior_outflow_cents: number;

  current_offset_cents: number;
  prior_offset_cents: number;

  delta_net_cents: number;
  delta_outflow_cents: number;
  delta_offset_cents: number;
};

type Props = {
  rows?: DeptRow[];
  title?: string;
  defaultMetric?: MetricKey; // net by default
  maxRows?: number; // e.g. 25
};

const NA = "—";
const NA_ARIA = "Not applicable";

const formatMoneyFromCents = (cents: number) => {
  if (cents === 0) return NA;
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(cents / 100);
};

const formatSignedDelta = (cents: number) => {
  if (cents === 0 || cents === void 0) return NA;
  const abs = Math.abs(cents);
  const s = new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(abs / 100);
  return cents < 0 ? `−${s}` : `+${s}`;
};

const formatPercentDelta = (current: number, prior: number): string => {
  if(prior === 0 && current === 0) return NA;
  if (prior === 0) return current === 0 ? "0.0%" : NA;
  return `${(((current - prior) / prior) * 100).toFixed(1)}%`;
};

const ariaMoney = (cents: number) => (cents === 0 ? NA_ARIA : formatMoneyFromCents(cents));
const ariaPercent = (current: number, prior: number) => {
  const p = formatPercentDelta(current, prior);
  return p === NA ? NA_ARIA : p;
};

const deltaColor = (cents: number) => {
  if (cents === 0 || cents === void 0) return undefined;
  return cents < 0 ? "success.main" : "error.main";
};

const metricLabel = (m: MetricKey) => (m === "net" ? "Net" : m === "outflow" ? "Outflow" : "Offsets");

type SortKey = "dept_id" | "dept" | "prior" | "current" | "delta" | "pct";
type SortDir = "asc" | "desc";

export const DepartmentComparisonTable = ({
  rows = [],
  title = "By Department",
  defaultMetric = "net",
  maxRows = 25,
}: Props): ReactElement => {
  const [metric, setMetric] = useState<MetricKey>(defaultMetric);
  const [sortKey, setSortKey] = useState<SortKey>("delta");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const handleMetric = (_: unknown, next: MetricKey | null) => {
    if (!next) return;
    setMetric(next);
  };

  const pick = (r: DeptRow) => {
    const prior =
      metric === "net" ? r.prior_net_cents : metric === "outflow" ? r.prior_outflow_cents : r.prior_offset_cents;
    const current =
      metric === "net"
        ? r.current_net_cents
        : metric === "outflow"
        ? r.current_outflow_cents
        : r.current_offset_cents;
    const delta =
      metric === "net" ? r.delta_net_cents : metric === "outflow" ? r.delta_outflow_cents : r.delta_offset_cents;
    const pct = prior === 0 ? (current === 0 ? 0 : Number.POSITIVE_INFINITY) : (current - prior) / prior;
    return { prior, current, delta, pct };
  };

  const sorted = useMemo(() => {
    const out = [...rows];
    out.sort((a, b) => {
      const av = pick(a);
      const bv = pick(b);

      const cmp = (x: number | string, y: number | string) => (x < y ? -1 : x > y ? 1 : 0);

      let c = 0;
      switch (sortKey) {
        case "dept_id":
          c = cmp(a.dept_id, b.dept_id);
          break;
        case "dept":
          c = cmp(a.dept.toLowerCase(), b.dept.toLowerCase());
          break;
        case "prior":
          c = cmp(av.prior, bv.prior);
          break;
        case "current":
          c = cmp(av.current, bv.current);
          break;
        case "delta":
          c = cmp(av.delta, bv.delta);
          break;
        case "pct":
          c = cmp(av.pct, bv.pct);
          break;
      }
      return sortDir === "asc" ? c : -c;
    });
    return out.slice(0, maxRows);
  }, [rows, metric, sortKey, sortDir, maxRows]);

  const requestSort = (k: SortKey) => {
    if (k === sortKey) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else {
      setSortKey(k);
      setSortDir(k === "dept" ? "asc" : "desc");
    }
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
        <Typography variant="h6">
          {title} · {metricLabel(metric)}
        </Typography>

        <ToggleButtonGroup size="small" exclusive value={metric} onChange={handleMetric} aria-label="Select metric">
          <ToggleButton value="net" aria-label="Net">
            Net
          </ToggleButton>
          <ToggleButton value="outflow" aria-label="Outflow">
            Outflow
          </ToggleButton>
          <ToggleButton value="offset" aria-label="Offsets">
            Offsets
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      <Table size="small" stickyHeader>
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
                Prior
              </TableSortLabel>
            </TableCell>

            <TableCell align="right" sortDirection={sortKey === "current" ? sortDir : false}>
              <TableSortLabel
                active={sortKey === "current"}
                direction={sortDir}
                onClick={() => requestSort("current")}
              >
                Current
              </TableSortLabel>
            </TableCell>

            <TableCell align="right" sortDirection={sortKey === "delta" ? sortDir : false}>
              <TableSortLabel active={sortKey === "delta"} direction={sortDir} onClick={() => requestSort("delta")}>
                Δ
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
          {sorted.map((r) => {
            const { prior, current, delta } = pick(r);
            return (
              <TableRow key={r.dept_id} hover>
                <TableCell>
                  <Typography variant="body2">{r.dept_id}</Typography>
                </TableCell>

                <TableCell>
                  <Typography variant="body2">{r.dept}</Typography>
                </TableCell>

                <TableCell align="right" sx={{ fontVariantNumeric: "tabular-nums" }} aria-label={ariaMoney(prior)}>
                  {formatMoneyFromCents(prior)}
                </TableCell>

                <TableCell align="right" sx={{ fontVariantNumeric: "tabular-nums" }} aria-label={ariaMoney(current)}>
                  {formatMoneyFromCents(current)}
                </TableCell>

                <TableCell
                  align="right"
                  sx={{ fontVariantNumeric: "tabular-nums", color: deltaColor(delta), fontWeight: 600 }}
                  aria-label={ariaMoney(delta)}
                >
                  {formatSignedDelta(delta)}
                </TableCell>

                <TableCell
                  align="right"
                  sx={{ fontVariantNumeric: "tabular-nums", color: deltaColor(delta) }}
                  aria-label={ariaPercent(current, prior)}
                >
                  {formatPercentDelta(current, prior)}
                </TableCell>
              </TableRow>
            );
          })}

          {sorted.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5}>
                <Typography variant="body2" sx={{ opacity: 0.7 }}>
                  No department rows available.
                </Typography>
              </TableCell>
            </TableRow>
          ) : null}
        </TableBody>
      </Table>

      <Typography variant="body2" sx={{ opacity: 0.8, mt: 1 }}>
        Showing top {Math.min(maxRows, rows.length)} departments by {sortKey}.
      </Typography>
    </Box>
  );
};
