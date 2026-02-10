export type DeptOutflowRow = {
  dept_id: number;
  dept: string;
  current_month_outflow_cents: number;
  fytd_outflow_cents: number;
  prior_fytd_outflow_cents: number;
  variance_cents: number;
  variance_pct: number | null;
};
export type DeptFunctionSummaryResponse = {
  fy: number;
  fm: number;

  ranges: {
    month: { start: string; end_exclusive: string };
    fytd: { start: string; end_exclusive: string };
    prior_fytd: { start: string; end_exclusive: string };
  };

  semantics: {
    outflow_cents: string;
  };

  by_department: DeptOutflowRow[];
  top10_by_fytd: DeptOutflowRow[];
};
