<?php
require_once __DIR__ . '/../utils/bootstrap.php';
json_headers();

$fiscalYear  = fiscal_year_from_query('fy');
$fiscalMonth = fiscal_month_from_query('fm');

$fyStart = fiscal_year_month_to_bom($fiscalYear, 1);
$monthStart = fiscal_year_month_to_bom($fiscalYear, $fiscalMonth);
$monthEnd   = fiscal_year_month_to_next_bom($fiscalYear, $fiscalMonth);

$priorFy = $fiscalYear - 1;
$priorFyStart = fiscal_year_month_to_bom($priorFy, 1);
$priorFytdEnd = fiscal_year_month_to_next_bom($priorFy, $fiscalMonth);

$config = require __DIR__ . "/../config.php";
$conn = db_connect($config["db"]);

$sql = sql('department_function_summary', 'department_function_outflow');

$stmt = $conn->prepare($sql);

$whereStart = $priorFyStart;
$whereEnd   = $monthEnd;

$stmt->bind_param(
  'ssssssss',
  $monthStart, $monthEnd,      // current month
  $fyStart, $monthEnd,         // fytd
  $priorFyStart, $priorFytdEnd,// prior fytd
  $whereStart, $whereEnd       // where
);

$stmt->execute();
$res = $stmt->get_result();

$rows = [];
while ($r = $res->fetch_assoc()) {
  $current = (int)$r['current_month_outflow_cents'];
  $fytd    = (int)$r['fytd_outflow_cents'];
  $prior   = (int)$r['prior_fytd_outflow_cents'];

  $variance = $fytd - $prior;

  // Percent: avoid infinity noise; null is better than “17276%” unless you explicitly want flags.
  $variancePct = null;
  if ($prior !== 0) {
    $variancePct = ($variance / $prior) * 100.0;
  }

  $rows[] = [
    'dept_id' => (int)$r['dept_id'],
    'dept' => $r['dept'],
    'current_month_outflow_cents' => $current,
    'fytd_outflow_cents' => $fytd,
    'prior_fytd_outflow_cents' => $prior,
    'variance_cents' => $variance,
    'variance_pct' => $variancePct,
  ];
}

$res->free();
$stmt->close();

$top10 = array_slice($rows, 0, 10);

echo json_encode([
  'fy' => $fiscalYear,
  'fm' => $fiscalMonth,
  'ranges' => [
    'month' => ['start' => $monthStart, 'end_exclusive' => $monthEnd],
    'fytd' => ['start' => $fyStart, 'end_exclusive' => $monthEnd],
    'prior_fytd' => ['start' => $priorFyStart, 'end_exclusive' => $priorFytdEnd],
  ],
  'semantics' => [
    'outflow_cents' => 'Sum of NET_AMOUNT where NET_AMOUNT > 0 (spend/outflows), in cents.',
  ],
  'by_department' => $rows,
  'top10_by_fytd' => $top10,
], JSON_PRETTY_PRINT);
