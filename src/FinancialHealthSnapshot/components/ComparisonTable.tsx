import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import type { ReactElement } from "react";
import { formatPercentDeltaReadable } from "./formatPercentDeltaReadable";

const NA = '—';
const NA_ARIA = 'Not applicable';

const formatMoneyFromCents = (cents: number) =>
  new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(cents / 100);

const ariaMoney = (cents: number) => formatMoneyFromCents(cents);


const ariaPercent = (current: number, prior: number): string => {
  const p = formatPercentDeltaReadable(current, prior);
  return p === NA ? NA_ARIA : p;
};

const formatSignedDelta = (cents: number) => {
  const s = formatMoneyFromCents(Math.abs(cents));
  if(cents === 0 || s === NA) return s;
  return cents < 0 ? `−${s}` : `+${s}`;
};

// const formatPercentDelta = (current: number, prior: number): string => {
//   if (prior === 0) return current === 0 ? "0.0%" : NA;
//   return `${(((current - prior) / prior) * 100).toFixed(1)}%`;
// };

const deltaColor = (cents: number) => {
  if(cents === 0) return;
  return cents < 0 ? "success.main" : "error.main";
}

type RowSpec = {
  label: string;
  prior: number;
  current: number;
};

type ComparisonTableProps = {
  rows: RowSpec[];
};

export const ComparisonTable = ({ rows }: ComparisonTableProps): ReactElement => {
  return (
    <Table size="small">
      <TableHead>
        <TableRow>
          <TableCell>Type</TableCell>
          <TableCell align="right">Prior Year</TableCell>
          <TableCell align="right">Current</TableCell>
          <TableCell align="right">Δ</TableCell>
          <TableCell align="right">Δ %</TableCell>
        </TableRow>
      </TableHead>

      <TableBody>
        {rows.map(r => {
          const delta = r.current - r.prior;
          const pct = formatPercentDeltaReadable(r.current, r.prior);
          const pctColor = pct === NA ? 'text.secondary' : deltaColor(delta);
          return (
            <TableRow key={r.label}>
              <TableCell>
                <Typography variant="body2">{r.label}</Typography>
              </TableCell>

              <TableCell align="right" sx={{ fontVariantNumeric: "tabular-nums" }} aria-label={ariaMoney(r.prior)}>
                {formatMoneyFromCents(r.prior)}
              </TableCell>

              <TableCell align="right" sx={{ fontVariantNumeric: "tabular-nums" }} aria-label={ariaMoney(r.current)}>
                {formatMoneyFromCents(r.current)}
              </TableCell>

              <TableCell
                align="right"
                sx={{
                  fontVariantNumeric: "tabular-nums",
                  color: deltaColor(delta),
                  fontWeight: 500,
                }}
                 aria-label={ariaMoney(delta)}
              >
                {formatSignedDelta(delta)}
              </TableCell>

              <TableCell
                align="right"
                sx={{
                  fontVariantNumeric: "tabular-nums",
                  color: pctColor,
                }}
                 aria-label={ariaPercent(r.current, r.prior)}
              >
                {pct}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
};
