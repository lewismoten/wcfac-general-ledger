import { useEffect, useMemo } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import Stack from "@mui/material/Stack";

import { API_ROOT } from "../utils/API_ROOT";
import { MonthSelect } from "../components/SearchInputs/MonthSelect";
import { YearSelect } from "../components/SearchInputs/YearSelect";
import type { DeptFunctionSummaryResponse } from "./types";
import { isApiError } from "../utils/isApiError";
import { subParams } from "../utils/subParams";
import { QueryStatus } from "../components/QueryStatus";
import { ExecutiveSummary } from "./components/ExecutiveSummary";
import { ContextHeader } from "./components/ContextHeader";
import { DepartmentComparisonTable } from "./components/DepartmentComparisonTable";
import Typography from "@mui/material/Typography";
import List from "@mui/material/List";
import ListItemText from "@mui/material/ListItemText";
import ListItem from "@mui/material/ListItem";
import { formatFiscalTitle } from "./helpers";

const MONTH_KEY = "fm";
const YEAR_KEY = "fy";
const KEYS = [YEAR_KEY, MONTH_KEY] as const;
const baseThresholdCents = 100000;

async function fetchSnapshot(query: string): Promise<DeptFunctionSummaryResponse> {
  const res = await fetch(`${API_ROOT}/reports/department-function-summary.php?${query}`);
  const json = (await res.json()) as unknown;
  if (isApiError(json)) throw new Error(json.error);
  return json as DeptFunctionSummaryResponse;
}

export const DepartmentFunctionSummary = () => {
  const [searchParams] = useSearchParams();
  const query = useMemo(() => subParams(searchParams, ...KEYS), [searchParams.toString()]);

  const fy = Number(searchParams.get('fy'));
  const fm = Number(searchParams.get('fm'));
  
  useEffect(() => {
    document.title = formatFiscalTitle("Department Function Summary", fy, fm);
  }, [fy, fm]);

  const { data, error, isError, isLoading, isFetching } = useQuery<DeptFunctionSummaryResponse, Error>({
    queryKey: ["department-function-summary", query],
    placeholderData: keepPreviousData,
    queryFn: () => fetchSnapshot(query),
  });

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
  }, [data]);

  return (
    <Stack spacing={2} sx={{
      '@media print': {
        gap: 0.25
      }
    }}>
      <Stack direction="row" spacing={2} sx={{'@media print': {
          display: 'none'
        }}}>
        <MonthSelect id={MONTH_KEY} fiscal />
        <YearSelect id={YEAR_KEY} fiscal />
      </Stack>
      <QueryStatus isFetching={isFetching} isLoading={isLoading} isError={isError} error={error} />

      {data && (
        <>
          <ContextHeader data={data} />
          <ExecutiveSummary summary={summary} />
          <Typography variant="h6">How to read this page</Typography>
          <Typography variant="body2" sx={{ opacity: 0.8, mb: 1 }}>
            Departments are grouped by spending behavior to help identify where review or follow-up may be useful. Changes are not inherently positive or negative.
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.8, mb: 1 }}>
            Δ % may appear large when prior-year spending was minimal or zero.
          </Typography>

          <DepartmentComparisonTable
            label="Largest FYTD Spending Variances"
            description="Departments with the biggest increases or decreases in spending compared to the same point last fiscal year. These entries deserve review because they represent the most significant movement in dollars."
            suggested="confirm cause (timing, reclassification, one-time expense, structural change)."
            data={data}
            viewMode={"top10"} />
          <DepartmentComparisonTable
            label="New or Reactivated Spending Lines"
            description="Departments that show spending this fiscal year but had no recorded expenditures during the same period last year. This may reflect new programs, reclassification, or timing differences."
            suggested="verify authorization, funding source, and budget alignment."
            data={data}
            viewMode={"new"} />
          <DepartmentComparisonTable
            label="Inactive Departments With Prior Spending"
            description="Departments that have not recorded any expenditures so far this fiscal year but had spending during the same period last year. This may indicate delayed activity, seasonal timing, or pending obligations."
            suggested="confirm whether activity is expected later in the fiscal year."
            data={data}
            viewMode={"no_spend"} />
          <DepartmentComparisonTable
            label="Unmapped or Non-Standard Department Codes"
            description="Transactions recorded outside standard department codes, including non-departmental, transfers, and invalid or placeholder accounts."
            suggested="Confirm proper classification, ensure consistency with chart-of-accounts standards, and determine whether remapping is required for accurate reporting."
            data={data}
            viewMode={"mapping"} />
          <DepartmentComparisonTable
            label="Full Departmental FYTD Comparison"
            description="A complete list of departments showing fiscal-year-to-date spending compared to the same months last fiscal year. Percentage changes may appear large when prior-year spending was minimal."
            note="Reference list; no action implied."
            data={data}
            viewMode={"all"} />
        </>
      )}
      <Typography variant="h6">Questions for Finance/Audit Review</Typography>
      <List>
        <ListItem>
          <ListItemText>
            Are any large variances caused by reclassification rather than spending?
          </ListItemText>
        </ListItem>
        <ListItem>
          <ListItemText>
            Which zero-spend departments expect activity later this FY?
          </ListItemText>
        </ListItem>
        <ListItem>
          <ListItemText>
            Are “New or Reactivated” lines tied to approved budget actions?
          </ListItemText>
        </ListItem>
        <ListItem>
          <ListItemText>
            Are any variances driven by one-time or capital expenditures?
          </ListItemText>
        </ListItem>
        <ListItem>
          <ListItemText>
            Do any unmapped or invalid accounts appear repeatedly across months?
          </ListItemText>
        </ListItem>
      </List>
    </Stack>
  );
};
