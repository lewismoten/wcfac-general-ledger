import { useMemo, useState } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import Stack from "@mui/material/Stack";

import { API_ROOT } from "../utils/API_ROOT";
import { MonthSelect } from "../components/SearchInputs/MonthSelect";
import { YearSelect } from "../components/SearchInputs/YearSelect";
import type { DeptFunctionSummaryResponse, ViewMode } from "./types";
import { isApiError } from "../utils/isApiError";
import { subParams } from "../utils/subParams";
import { QueryStatus } from "../components/QueryStatus";
import { baseOptions } from "./helpers";
import { ExecutiveSummary } from "./ExecutiveSummary";
import { ContextHeader } from "./ContextHeader";
import { TableOptions } from "./TableOptions";
import { TableData } from "./TableData";

const MONTH_KEY = "fm";
const YEAR_KEY = "fy";
const KEYS = [YEAR_KEY, MONTH_KEY] as const;

async function fetchSnapshot(query: string): Promise<DeptFunctionSummaryResponse> {
  const res = await fetch(`${API_ROOT}/reports/department-function-summary.php?${query}`);
  const json = (await res.json()) as unknown;
  if (isApiError(json)) throw new Error(json.error);
  return json as DeptFunctionSummaryResponse;
}

export const DepartmentFunctionSummary = () => {
  const [searchParams] = useSearchParams();
  const query = useMemo(() => subParams(searchParams, ...KEYS), [searchParams.toString()]);

  const { data, error, isError, isLoading, isFetching } = useQuery<DeptFunctionSummaryResponse, Error>({
    queryKey: ["department-function-summary", query],
    placeholderData: keepPreviousData,
    queryFn: () => fetchSnapshot(query),
  });

  const [viewMode, setViewMode] = useState<ViewMode>("top10");
  const [baseThresholdCents, setBaseThresholdCents] = useState<number>(baseOptions[1].cents); // default: $1k

  const summary = useMemo(() => {
    if (!data) return null;

    const all = data.by_department;

    const totalCurrent = all.reduce((s, r) => s + r.fytd_outflow_cents, 0);
    const totalPrior = all.reduce((s, r) => s + r.prior_fytd_outflow_cents, 0);
    const totalDelta = totalCurrent - totalPrior;

    const newNoPriorCount = all.filter((r) => r.prior_fytd_outflow_cents === 0 && r.fytd_outflow_cents > 0).length;
    const noSpendYetCount = all.filter((r) => r.fytd_outflow_cents === 0 && r.prior_fytd_outflow_cents > 0).length;
    const smallBaseCount = all.filter((r) => r.prior_fytd_outflow_cents > 0 && r.prior_fytd_outflow_cents < baseThresholdCents).length;

    const topUp = [...all].sort((a, b) => b.variance_cents - a.variance_cents).slice(0, 3);
    const topDown = [...all].sort((a, b) => a.variance_cents - b.variance_cents).slice(0, 3);

    return {
      totalCurrent,
      totalPrior,
      totalDelta,
      newNoPriorCount,
      noSpendYetCount,
      smallBaseCount,
      topUp,
      topDown,
    };
  }, [data, baseThresholdCents]);

  return (
    <Stack spacing={2}>
      <Stack direction="row" spacing={2} sx={{ flexWrap: "wrap" }}>
        <MonthSelect id={MONTH_KEY} fiscal />
        <YearSelect id={YEAR_KEY} fiscal />
      </Stack>
      <QueryStatus isFetching={isFetching} isLoading={isLoading} isError={isError} error={error} />

      {data && (
        <>
          <ContextHeader data={data} />
          <ExecutiveSummary summary={summary} />
          <TableOptions
            viewMode={viewMode}
            setViewMode={setViewMode}
            baseThresholdCents={baseThresholdCents}
            setBaseThresholdCents={setBaseThresholdCents}
          />
          <TableData data={data} viewMode={viewMode} baseThresholdCents={baseThresholdCents} />
        </>
      )}
    </Stack>
  );
};
