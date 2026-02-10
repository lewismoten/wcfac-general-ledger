import { useMemo } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import Stack from "@mui/material/Stack";

import { API_ROOT } from "../utils/API_ROOT";
import { MonthSelect } from "../components/SearchInputs/MonthSelect";
import { YearSelect } from "../components/SearchInputs/YearSelect";
import type { FinancialHealthSnapshotResponse } from "./types";
import { Summary } from "./components/Summary";
import { TrendChart } from "./components/TrendChart";
import { DepartmentComparisonTable } from "./components/DepartmentComparisonTable";
import { FyCompareBarChart } from "./components/FyCompareBarChart";
import { ExecutiveSummary } from "./components/ExecutiveSummary";
import { isApiError } from "../utils/isApiError";
import { subParams } from "../utils/subParams";
import { QueryStatus } from "../components/QueryStatus";

const MONTH_KEY = "fm";
const YEAR_KEY = "fy";
const KEYS = [YEAR_KEY, MONTH_KEY];

async function fetchSnapshot(query: string): Promise<FinancialHealthSnapshotResponse> {
  const res = await fetch(`${API_ROOT}/reports/financial-health-snapshot.php?${query}`);
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
      <QueryStatus isError={isError} error={error} isLoading={isLoading} isFetching={isFetching} />
      <ExecutiveSummary data={data} />
      <Summary data={data} />
      <TrendChart months={data?.monthly_24.months} title="General Fund Activity" />
      <FyCompareBarChart months={data?.monthly_24.months} fy={data?.fy} fm={data?.fm} />
      <DepartmentComparisonTable rows={data?.by_department} maxRows={25} />
    </Stack>
  );
};
