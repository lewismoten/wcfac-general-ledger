<?php
/*
Fields:
NET AMOUNT
CHECK DATE
ACCOUNT NO. (mapped to department/function)

Show:
Total Spend – Current Month
Total Spend – Fiscal YTD
Prior Year Same Month (YoY comparison)
Fiscal YTD vs Prior Fiscal YTD

Charts:

Line: Monthly total spend (last 12–24 months)
Bar: Current FY vs prior FY (same months)

Purpose:
Are we spending more or less than last year?
*/

require_once __DIR__ . '/utils/bootstrap.php';

json_headers();

$fiscalYear  = fiscal_year_from_query('fy');
$fiscalMonth = fiscal_month_from_query('fm');

$fyStart = fiscal_year_month_to_bom($fiscalYear, 1);
$priorFy = $fiscalYear - 1;
$priorFyStart = fiscal_year_month_to_bom($priorFy, 1);

$start = fiscal_year_month_to_bom($fiscalYear, $fiscalMonth);
$end   = fiscal_year_month_to_next_bom($fiscalYear, $fiscalMonth);

$endDt = new DateTimeImmutable($end);
$seriesStartDt = $endDt->modify('-24 months');
$seriesStart = $seriesStartDt->format('Y-m-d');

$priorMonthStart = fiscal_year_month_to_bom($priorFy, $fiscalMonth);
$priorMonthEnd   = fiscal_year_month_to_next_bom($priorFy, $fiscalMonth);

$config = require __DIR__ . "/config.php";
$conn = db_connect($config["db"]);

$sql = "SELECT 
    COA_DEPT.ID, 
    COA_DEPT.Name, 
    CAST(SUM(CASE 
      WHEN LEDGER.CHECK_DATE >= ? 
      AND LEDGER.CHECK_DATE < ? 
      THEN LEDGER.NET_AMOUNT 
      ELSE 0 END) * 100 AS SIGNED
    ) AS current_net_cents,
    CAST(SUM(CASE 
      WHEN LEDGER.CHECK_DATE >= ? 
      AND LEDGER.CHECK_DATE < ? 
      AND LEDGER.NET_AMOUNT > 0 
      THEN LEDGER.NET_AMOUNT 
      ELSE 0 END) * 100 AS SIGNED
    ) AS current_outflow_cents,
    CAST(SUM(CASE 
      WHEN LEDGER.CHECK_DATE >= ? 
      AND LEDGER.CHECK_DATE < ?
      THEN LEDGER.NET_AMOUNT 
      ELSE 0 END) * 100 AS SIGNED
      ) AS prior_net_cents,
    CAST(SUM(CASE 
      WHEN LEDGER.CHECK_DATE >= ? 
      AND LEDGER.CHECK_DATE < ?
      AND LEDGER.NET_AMOUNT > 0 
      THEN LEDGER.NET_AMOUNT 
      ELSE 0 END) * 100 AS SIGNED
      ) AS prior_outflow_cents
  FROM LEDGER
  INNER JOIN COA_DEPT ON LEDGER.ACCOUNT_DEPT = COA_DEPT.ID
  WHERE LEDGER.ACCOUNT_RE = 4
    AND (
      (LEDGER.CHECK_DATE >= ? AND LEDGER.CHECK_DATE < ?)
      OR
      (LEDGER.CHECK_DATE >= ? AND LEDGER.CHECK_DATE < ?)
    )
  GROUP BY COA_DEPT.ID, COA_DEPT.Name
  ORDER BY current_outflow_cents DESC
  ";

$stmt = $conn->prepare($sql);
$stmt->bind_param(
  'ssssssssssss', 
  $start, $end, // current_net
  $start, $end, // current_outflow
  $priorMonthStart, $priorMonthEnd, // prior_net
  $priorMonthStart, $priorMonthEnd, // prior_outflow
  // where
  $start, $end, // current
  $priorMonthStart, $priorMonthEnd // prior
);
$stmt->execute();
$result = $stmt->get_result();
$rows = [];
while ($row = $result->fetch_assoc()) {
  $currentNet = (int)$row['current_net_cents'];
  $priorNet   = (int)$row['prior_net_cents'];
  $currentOut = (int)$row['current_outflow_cents'];
  $priorOut   = (int)$row['prior_outflow_cents'];

  $rows[] = [
    'dept_id' => (int)$row['ID'],
    'dept' => $row['Name'],
    'current_net_cents' => $currentNet,
    'prior_net_cents' => $priorNet,
    'current_outflow_cents' => $currentOut,
    'prior_outflow_cents' => $priorOut,
    'delta_net_cents' => $currentNet - $priorNet,
    'delta_outflow_cents' => $currentOut - $priorOut,
  ];

}
$result->free();
$stmt->close();

$summarySql = "SELECT
  CAST(SUM(CASE
    WHEN CHECK_DATE >= ? 
      AND CHECK_DATE < ? 
    THEN NET_AMOUNT ELSE 0 END) * 100 AS SIGNED) AS current_month_net_cents,
  CAST(SUM(CASE
    WHEN CHECK_DATE >= ? 
      AND CHECK_DATE < ? 
      AND NET_AMOUNT > 0
    THEN NET_AMOUNT ELSE 0 END) * 100 AS SIGNED) AS current_month_outflow_cents,
  CAST(SUM(CASE 
    WHEN CHECK_DATE >= ? 
      AND CHECK_DATE < ? 
    THEN NET_AMOUNT ELSE 0 END) * 100 AS SIGNED) AS fytd_net_cents,
  CAST(SUM(CASE 
    WHEN CHECK_DATE >= ? 
      AND CHECK_DATE < ? 
      AND NET_AMOUNT > 0
    THEN NET_AMOUNT ELSE 0 END) * 100 AS SIGNED) AS fytd_outflow_cents,

  CAST(SUM(CASE 
    WHEN CHECK_DATE >= ? 
      AND CHECK_DATE < ? 
    THEN NET_AMOUNT ELSE 0 END) * 100 AS SIGNED) AS prior_year_month_net_cents,

  CAST(SUM(CASE 
    WHEN CHECK_DATE >= ? 
      AND CHECK_DATE < ? 
      AND NET_AMOUNT > 0
    THEN NET_AMOUNT ELSE 0 END) * 100 AS SIGNED) AS prior_year_month_outflow_cents,

  CAST(SUM(CASE 
    WHEN CHECK_DATE >= ? 
    AND CHECK_DATE < ? 
    THEN NET_AMOUNT ELSE 0 END) * 100 AS SIGNED) AS prior_fytd_net_cents,

  CAST(SUM(CASE 
    WHEN CHECK_DATE >= ? 
    AND CHECK_DATE < ? 
    AND NET_AMOUNT > 0
    THEN NET_AMOUNT ELSE 0 END) * 100 AS SIGNED) AS prior_fytd_outflow_cents

FROM LEDGER
WHERE ACCOUNT_RE = 4
AND CHECK_DATE >= ? AND CHECK_DATE < ?
";
$summaryStmt = $conn->prepare($summarySql);
$summaryStmt->bind_param(
  'ssssssssssssssssss',
  $start, $end, // current month: net
  $start, $end, // current month: outflow
  $fyStart, $end, // fytd: net
  $fyStart, $end, // fytd: outflow
  $priorMonthStart, $priorMonthEnd, // prior month: net
  $priorMonthStart, $priorMonthEnd, // prior month: outflow
  $priorFyStart, $priorMonthEnd, // prior fytd: net
  $priorFyStart, $priorMonthEnd, // prior fytd: outflow
  // where
  $priorFyStart, $end // prior year to current year end
);
$summaryStmt->execute();
$summary = $summaryStmt->get_result()->fetch_assoc();
$summaryStmt->close();

$summaryOut = [
  'current_month' => [
    'net_cents' => (int)$summary['current_month_net_cents'],
    'outflow_cents' => (int)$summary['current_month_outflow_cents'],
  ],
  'fytd' => [
    'net_cents' => (int)$summary['fytd_net_cents'],
    'outflow_cents' => (int)$summary['fytd_outflow_cents'],
  ],
  'prior_year_month' => [
    'net_cents' => (int)$summary['prior_year_month_net_cents'],
    'outflow_cents' => (int)$summary['prior_year_month_outflow_cents'],
  ],
  'prior_fytd' => [
    'net_cents' => (int)$summary['prior_fytd_net_cents'],
    'outflow_cents' => (int)$summary['prior_fytd_outflow_cents'],
  ],
];
$summaryDelta = [
  'month_yoy' => [
    'net_cents' => $summaryOut['current_month']['net_cents'] - $summaryOut['prior_year_month']['net_cents'],
    'outflow_cents' => $summaryOut['current_month']['outflow_cents'] - $summaryOut['prior_year_month']['outflow_cents'],
  ],
  'fytd_yoy' => [
    'net_cents' => $summaryOut['fytd']['net_cents'] - $summaryOut['prior_fytd']['net_cents'],
    'outflow_cents' => $summaryOut['fytd']['outflow_cents'] - $summaryOut['prior_fytd']['outflow_cents'],
  ],
];

$monthlySql = "SELECT
    YEAR(CHECK_DATE)  AS y,
    MONTH(CHECK_DATE) AS m,
    CAST(SUM(NET_AMOUNT) * 100 AS SIGNED) AS net_cents,
    CAST(SUM(CASE WHEN NET_AMOUNT > 0 THEN NET_AMOUNT ELSE 0 END) * 100 AS SIGNED) AS outflow_cents
  FROM LEDGER
  WHERE ACCOUNT_RE = 4
    AND CHECK_DATE >= ? AND CHECK_DATE < ?
  GROUP BY YEAR(CHECK_DATE), MONTH(CHECK_DATE)
  ORDER BY y ASC, m ASC
";
$monthlyStmt = $conn->prepare($monthlySql);
$monthlyStmt->bind_param('ss', $seriesStart, $end);
$monthlyStmt->execute();
$monthlyResult = $monthlyStmt->get_result();

$monthly = [];
$byYm = [];
while ($r = $monthlyResult->fetch_assoc()) {
  $ym = sprintf('%04d-%02d', (int)$r['y'], (int)$r['m']);
  $byYm[$ym] = [
    'net_cents' => (int)$r['net_cents'],
    'outflow_cents' => (int)$r['outflow_cents'],
  ];
}

$monthlyResult->free();
$monthlyStmt->close();

$monthly24 = [];
$cursor = $seriesStartDt;

while ($cursor < $endDt) {
  $y = (int)$cursor->format('Y');
  $m = (int)$cursor->format('n');
  $ym = $cursor->format('Y-m');
  [$fy, $fm] = calendar_year_month_to_fiscal($y, $m);
  $vals = $byYm[$ym] ?? ['net_cents' => 0, 'outflow_cents' => 0];

  $monthly24[] = [
    'fy' => $fy,
    'fm' => $fm,
    'ym' => $ym,
    'net_cents' => $vals['net_cents'],
    'outflow_cents' => $vals['outflow_cents'],
  ];

  $cursor = $cursor->modify('first day of next month');
}

echo json_encode([
  'fy' => $fiscalYear,
  'fm' => $fiscalMonth,
  'ranges' => [
    'month' => ['start' => $start, 'end_exclusive' => $end],
    'fytd'  => ['start' => $fyStart, 'end_exclusive' => $end],
    'prior_month' => ['start' => $priorMonthStart, 'end_exclusive' => $priorMonthEnd],
    'prior_fytd'  => ['start' => $priorFyStart, 'end_exclusive' => $priorMonthEnd],
  ],
  'semantics' => [
    'net_cents' => 'Sum of NET_AMOUNT including negatives (credits/reversals).',
    'outflow_cents' => 'Sum of positive NET_AMOUNT only (spend/outflows).',
  ],
  'summary' => $summaryOut,
  'summary_delta' => $summaryDelta,
  'by_department' => $rows,
  'monthly_24' => [
    'start' => $seriesStart,
    'end_exclusive' => $end,
    'months' => $monthly24,
  ],
], JSON_PRETTY_PRINT);