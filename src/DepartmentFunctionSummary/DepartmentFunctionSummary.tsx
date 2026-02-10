import { useMemo } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import Stack from "@mui/material/Stack";

import { API_ROOT } from "../utils/API_ROOT";
import { MonthSelect } from "../components/SearchInputs/MonthSelect";
import { YearSelect } from "../components/SearchInputs/YearSelect";
import type { DepartmentFunctionSummaryResponse } from "./types";
import { isApiError } from "../utils/isApiError";
import { subParams } from "../utils/subParams";
import { QueryStatus } from "../components/QueryStatus";

const MONTH_KEY = "fm";
const YEAR_KEY = "fy";
const KEYS = [YEAR_KEY, MONTH_KEY];

async function fetchSnapshot(query: string): Promise<DepartmentFunctionSummaryResponse> {
  const res = await fetch(`${API_ROOT}/reports/department-function-summary.php?${query}`);
  const json = (await res.json()) as unknown;
  if (isApiError(json)) {
    throw new Error(json.error);
  }
  return json as DepartmentFunctionSummaryResponse;
}

export const DepartmentFunctionSummary = () => {

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
  } = useQuery<DepartmentFunctionSummaryResponse, Error>({
    queryKey: ["department-function-summary", query],
    placeholderData: keepPreviousData,
    queryFn: () => fetchSnapshot(query),
  });
  
  return (
    <Stack spacing={2}>
      <Stack direction="row" spacing={2}>
        <MonthSelect id={MONTH_KEY} fiscal />
        <YearSelect id={YEAR_KEY} fiscal />
      </Stack>

      <QueryStatus isFetching={isFetching} isLoading={isLoading} isError={isError} error={error} />
      Hello World.
      <pre>{JSON.stringify(data)}</pre>
    </Stack>
  );
}
