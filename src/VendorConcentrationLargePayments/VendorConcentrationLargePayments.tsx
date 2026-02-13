import { useEffect, useMemo } from "react";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import { useSearchParams } from "react-router-dom";
import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { API_ROOT } from "../utils/API_ROOT";
import { subParams } from "../utils/subParams";
import { isApiError } from "../utils/isApiError";
import { QueryStatus } from "../components/QueryStatus";
import { MonthSelect } from "../components/SearchInputs/MonthSelect";
import { YearSelect } from "../components/SearchInputs/YearSelect";
import { useSearchParamInt } from "../utils/useSearchParamInt";
import type { VendorConcentrationResponse } from "./types";
import { formatFiscalTitle } from "../DepartmentFunctionSummary/helpers";

import { HhiSummaryCard } from "./components/HhiSummaryCard";
import { TopVendorsBarChart } from "./components/TopVendorsBarChart";
import { LargePaymentsTable } from "./components/LargePaymentsTable";
import { AtAGlanceCard } from "./components/AtAGlanceCard";
import { Typography } from "@mui/material";
import { ExecutiveSummary } from "./components/ExecutiveSummary";

const YEAR_KEY = "fy";
const MONTH_KEY = "fm";
const THRESHOLD_KEY = "threshold";
const KEYS = [YEAR_KEY, MONTH_KEY, THRESHOLD_KEY] as const;

async function fetchReport(query: string): Promise<VendorConcentrationResponse> {
  const res = await fetch(`${API_ROOT}/reports/vendor-concentration-large-payments.php?${query}`);
  const json = (await res.json()) as unknown;
  if (isApiError(json)) throw new Error(json.error);
  return json as VendorConcentrationResponse;
}

export const VendorConcentrationLargePayments = () => {
  const [searchParams] = useSearchParams();

  const [threshold, setThreshold] = useSearchParamInt(THRESHOLD_KEY, {
    defaultValue: 25000,
    min: 0,
    max: 1000000000,
  });

  const query = useMemo(() => subParams(searchParams, ...KEYS), [searchParams.toString()]);

  const fy = Number(searchParams.get("fy"));
  const fm = Number(searchParams.get("fm"));

  useEffect(() => {
    document.title = formatFiscalTitle("Vendor Concentration", fy, fm);
  }, [fy, fm]);

  const { data, error, isError, isLoading, isFetching } = useQuery<VendorConcentrationResponse, Error>({
    queryKey: ["vendor-concentration-large-payments", query],
    placeholderData: keepPreviousData,
    queryFn: () => fetchReport(query),
  });

  return (
    <Stack spacing={2} className="report-page">
      <Stack direction="row" spacing={2} sx={{ "@media print": { display: "none" } }}>
        <MonthSelect id={MONTH_KEY} fiscal />
        <YearSelect id={YEAR_KEY} fiscal />
        <TextField
          fullWidth
          label="Threshold"
          value={threshold}
          onChange={(e) => setThreshold(Number((e.target as any).value))}
          InputProps={{
            startAdornment: <InputAdornment position="start">$</InputAdornment>,
            inputMode: "numeric",
          }}
        />
      </Stack>

      <QueryStatus isFetching={isFetching} isLoading={isLoading} isError={isError} error={error} />

      {data && (
        <>
          <ExecutiveSummary data={data} />
          <AtAGlanceCard data={data} />
          <HhiSummaryCard data={data} />
          <TopVendorsBarChart rows={data.top10_vendors_fytd} />
          <LargePaymentsTable
            monthRows={data.payments_over_threshold.month}
            fytdRows={data.payments_over_threshold.fytd}
            threshold={data.threshold}
          />
          <Typography variant="body2" sx={{ opacity: 0.8 }}>
            Prepared from General Ledger expenditures (ACCOUNT_RE=4).
            Does not include encumbrances or outstanding POs.
            This report is intended to prompt questions about concentration and unusually large payments.
            Vendor count includes one-time and recurring vendors.
            Vendor concentration is calculated by VENDOR_ID. If the same vendor exists under multiple IDs or name variants in the ledger, concentration may be understated.
          </Typography>        </>
      )}
    </Stack>
  );
};
