type IsoDate = string;      // "YYYY-MM-DD"
type YearMonth = string;    // "YYYY-MM"

interface DateRange {
  start: IsoDate;
  end_exclusive: IsoDate;
}

interface SnapshotSemantics {
  net_cents: string;
  outflow_cents: string;
}

interface NetOutflow {
  net_cents: number;        // signed cents
  outflow_cents: number;    // >= 0
}

interface SummaryBlock {
  current_month: NetOutflow;
  fytd: NetOutflow;
  prior_year_month: NetOutflow;
  prior_fytd: NetOutflow;
}

interface SummaryDeltaBlock {
  month_yoy: NetOutflow; // delta cents (signed)
  fytd_yoy: NetOutflow;
}

interface DepartmentRow {
  dept_id: number;
  dept: string;

  current_net_cents: number;
  prior_net_cents: number;
  current_outflow_cents: number;
  prior_outflow_cents: number;

  delta_net_cents: number;
  delta_outflow_cents: number;
}

interface MonthlyPoint {
  fy: number;
  fm: number; // 1..12, July=1
  ym: YearMonth; // calendar year-month for debugging / keys
  net_cents: number;
  outflow_cents: number;
}

interface Monthly24Block {
  start: IsoDate;
  end_exclusive: IsoDate;
  months: MonthlyPoint[];
}

export interface FinancialHealthSnapshotResponse {
  fy: number;
  fm: number;

  ranges: {
    month: DateRange;
    fytd: DateRange;
    prior_month: DateRange;
    prior_fytd: DateRange;
  };

  semantics: SnapshotSemantics;

  summary: SummaryBlock;
  summary_delta: SummaryDeltaBlock;

  by_department: DepartmentRow[];

  monthly_24: Monthly24Block;
}

export interface FinancialHealthSnapshotViewModel {
  fy: number;
  fm: number;
  ranges: FinancialHealthSnapshotResponse['ranges'];
  summary: FinancialHealthSnapshotResponse['summary'];
  summary_delta: FinancialHealthSnapshotResponse['summary_delta'];
  departments: FinancialHealthSnapshotResponse['by_department'];
  monthly: FinancialHealthSnapshotResponse['monthly_24']['months'];
}
