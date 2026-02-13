export type VendorTopRow = {
  vendor_id: number;
  vendor: string;
  fytd_outflow_cents: number;
  pct_of_total: number | null;
};

export type PaymentRow = {
  vendor_id: number;
  vendor: string;
  amount_cents: number;
  date: string; // YYYY-MM-DD
  dept_id: number;
  dept: string | null;
  check_no: number;
  description: string;
};

export type VendorConcentrationResponse = {
  fy: number;
  fm: number;
  threshold: number;

  ranges: {
    month: { start: string; end_exclusive: string };
    fytd: { start: string; end_exclusive: string };
  };

  hhi_fytd: null | {
    hhi: number | null;              // 0..10000
    vendor_count: number;
    total_outflow_cents: number;
    top_vendor_pct: number | null;   // %
  };

  top10_vendors_fytd: VendorTopRow[];

  payments_over_threshold: {
    month: PaymentRow[];
    fytd: PaymentRow[];
  };
};
