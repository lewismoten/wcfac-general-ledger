import {
  Card,
  CardContent,
  Typography,
  Tabs,
  Tab,
  Box,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Stack,
} from "@mui/material";
import { useMemo, useState } from "react";
import type { PaymentRow } from "../types";
import { fmtMoney } from "../../DepartmentFunctionSummary/helpers";

const fmtDate = (iso: string) =>
  new Intl.DateTimeFormat(undefined, { year: "numeric", month: "short", day: "2-digit" })
    .format(new Date(`${iso}T00:00:00`));

export const LargePaymentsTable = ({
  monthRows,
  fytdRows,
  threshold,
}: {
  monthRows: PaymentRow[];
  fytdRows: PaymentRow[];
  threshold: number;
}) => {
  const [tab, setTab] = useState<0 | 1>(0);

  const rows = useMemo(() => (tab === 0 ? monthRows : fytdRows), [tab, monthRows, fytdRows]);

  return (
    <Card variant="outlined">
      <CardContent>
        <Stack spacing={1}>
          <Typography variant="h6">Payments Over Threshold</Typography>
          <Typography variant="body2" sx={{ opacity: 0.8 }}>
            Threshold: {new Intl.NumberFormat(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(threshold)}
          </Typography>

          <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 1 }}>
            <Tab label="This Fiscal Month" />
            <Tab label="FYTD" />
          </Tabs>

          <ScreenOnly rows={rows} />
          <Printable rows={rows} />
        </Stack>
      </CardContent>
    </Card>
  );
};

const ScreenOnly = ({rows}: {rows:PaymentRow[]}) => {
  return (<Box sx={{ overflowX: "auto" }} className="screen-only">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>D. ID</TableCell>
                  <TableCell>Dept</TableCell>
                  <TableCell>V. ID</TableCell>
                  <TableCell>Vendor</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Check #</TableCell>
                  <TableCell align="right">Amount</TableCell>
                  <TableCell>Description</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((r, i) => (
                  <TableRow key={`${r.check_no}-${i}`}>
                    <TableCell sx={{ minWidth: 100 }}>{r.dept_id}</TableCell>
                    <TableCell sx={{ whiteSpace: "nowrap" }}>
                      {r.dept ?? ''}
                    </TableCell>
                    <TableCell sx={{ minWidth: 100 }}>{r.vendor_id}</TableCell>
                    <TableCell sx={{ minWidth: 220 }}>{r.vendor}</TableCell>
                    <TableCell sx={{ whiteSpace: "nowrap" }}>{fmtDate(r.date)}</TableCell>
                    <TableCell sx={{ whiteSpace: "nowrap" }}>{r.check_no}</TableCell>
                    <TableCell align="right">{fmtMoney(r.amount_cents)}</TableCell>
                    <TableCell sx={{ minWidth: 240 }}>{r.description}</TableCell>
                  </TableRow>
                ))}
                {rows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6}>
                      <Typography variant="body2" sx={{ opacity: 0.8 }}>
                        No payments found above the threshold for this view.
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Box>);
};

const Printable = ({rows}: {rows:PaymentRow[]}) => {
  return (<Box className="print-only">
  <Table size="small">
    <TableHead>
      <TableRow>
        <TableCell valign="bottom">Dept</TableCell>
        <TableCell valign="bottom">Vendor</TableCell>
        <TableCell valign="bottom">Date<br />Description</TableCell>
        <TableCell valign="bottom">Check #<br />Amount</TableCell>
      </TableRow>
    </TableHead>
    <TableBody>
      {rows.map((r, i) => (
        <TableRow key={`print-${r.check_no}-${i}`}>
          <TableCell sx={{ width: "30%" }}>
            <DualType topText={r.dept_id.toString()} bottomText={r.dept ?? ''} />
          </TableCell>
          <TableCell sx={{ width: "30%" }}>
            <DualType topText={r.vendor_id.toString()} bottomText={r.vendor} />
          </TableCell>
          <TableCell>
            <DualType sx={{ width: "30%" }} topText={fmtDate(r.date)} bottomText={r.description} />
          </TableCell>
          <TableCell sx={{ whiteSpace: "nowrap" }}>
            <DualType topText={r.check_no.toString()} bottomText={fmtMoney(r.amount_cents)} />
          </TableCell>
        </TableRow>
      ))}

      {rows.length === 0 && (
        <TableRow>
          <TableCell colSpan={5}>
            <Typography variant="body2" sx={{ opacity: 0.8 }}>
              No payments found above the threshold for this view.
            </Typography>
          </TableCell>
        </TableRow>
      )}
    </TableBody>
  </Table>
</Box>)
}

const DualType = ({topText, bottomText}: {topText: string, bottomText: string}) => {
  return (<><Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.15 }}>
              {topText}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.85, lineHeight: 1.15 }}>
              {bottomText}
            </Typography></>);
}