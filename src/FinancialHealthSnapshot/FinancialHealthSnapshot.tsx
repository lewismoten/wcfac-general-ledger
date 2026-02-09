import { useMemo } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import Alert from "@mui/material/Alert";
import Stack from "@mui/material/Stack";
import CircularProgress from "@mui/material/CircularProgress";

import type { ApiError } from "../LedgerPage/ApiError";
import { API_ROOT } from "../utils/API_ROOT";
import { MonthSelect } from "../SearchInputs/MonthSelect";
import { YearSelect } from "../SearchInputs/YearSelect";
import type { FinancialHealthSnapshotResponse } from "./types";
import { Summary } from "./components/Summary";
import { TrendChart } from "./components/TrendChart";
import { DepartmentComparisonTable } from "./components/DepartmentComparisonTable";
import { FyCompareBarChart } from "./components/FyCompareBarChart";

const MONTH_KEY = "fm";
const YEAR_KEY = "fy";
const KEYS = [YEAR_KEY, MONTH_KEY];

const subParams = (params: URLSearchParams, ...ids: string[]) => {
  const subset = new URLSearchParams();
  ids.forEach((id) => {
    const v = params.get(id);
    if (v != null && v !== "") subset.set(id, v);
  });
  return subset.toString();
};

const isApiError = (x: unknown): x is ApiError =>
  typeof x === "object" && x !== null && "error" in x;

async function fetchSnapshot(query: string): Promise<FinancialHealthSnapshotResponse> {
  const res = await fetch(`${API_ROOT}/financial-health-snapshot.php?${query}`);

  // If your API always returns JSON, this is fine.
  // If it might return HTML on fatal error, wrap in try/catch.
  const json = (await res.json()) as unknown;

  if (isApiError(json)) {
    throw new Error(json.error);
  }

  return json as FinancialHealthSnapshotResponse;
}

export const FinancialHealthSnapshot = () => {
  const [searchParams] = useSearchParams();

  const query = useMemo(
    () => subParams(searchParams, ...KEYS),
    [searchParams.toString()]
  );

  const {
    data,
    error,
    isError,
    isLoading,
    isFetching,
  } = useQuery<FinancialHealthSnapshotResponse, Error>({
    queryKey: ["financial-health-snapshot", query],
    placeholderData: keepPreviousData,
    queryFn: () => fetchSnapshot(query),
  });

  return (
    <Stack spacing={2}>
      <Stack direction="row" spacing={2}>
        <MonthSelect id={MONTH_KEY} fiscal />
        <YearSelect id={YEAR_KEY} fiscal />
      </Stack>

      {isError && (
        <Alert severity="error">
          {error.message}
        </Alert>
      )}

      {isLoading && (
        <Stack direction="row" spacing={1} alignItems="center">
          <CircularProgress size={18} />
          <div>Loading snapshot…</div>
        </Stack>
      )}
      {isFetching && !isLoading && (
        <Alert severity="info">Updating…</Alert>
      )}
      <Summary data={data} />
      <TrendChart months={data?.monthly_24.months} title="General Fund Activity" />
      <FyCompareBarChart months={data?.monthly_24.months} fy={data?.fy} fm={data?.fm} />
      <DepartmentComparisonTable rows={data?.by_department} maxRows={25} />
    </Stack>
  );
};
