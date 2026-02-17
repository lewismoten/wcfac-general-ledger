<?php
require_once __DIR__ . '/../utils/bootstrap.php';
json_headers();

$report = 'vendor_concentration_large_payments';

$fiscalYear  = fiscal_year_from_query('fy');
$fiscalMonth = fiscal_month_from_query('fm');

$threshold = 25000.0;
if (isset($_GET['threshold']) && is_valid_numeric_filter($_GET['threshold'])) {
  $threshold = (float)$_GET['threshold'];
  if ($threshold < 0) $threshold = 0.0;
}

$fyStart     = fiscal_year_month_to_bom($fiscalYear, 1);
$monthStart  = fiscal_year_month_to_bom($fiscalYear, $fiscalMonth);
$monthEnd    = fiscal_year_month_to_next_bom($fiscalYear, $fiscalMonth);

$config = require __DIR__ . "/../config.php";
$conn = db_connect($config["db"]);

$sqlTop = sql($report, 'top_vendors_fytd');
$stmtTop = $conn->prepare($sqlTop);

$stmtTop->bind_param(
  'ssss',
  $fyStart, $monthEnd,
  $fyStart, $monthEnd
);

$stmtTop->execute();
$resTop = $stmtTop->get_result();

$topVendors = [];
while ($r = $resTop->fetch_assoc()) {
  $topVendors[] = [
    'vendor_id' => (int)$r['vendor_id'],
    'vendor' => $r['vendor'],
    'fytd_outflow_cents' => (int)$r['fytd_outflow_cents'],
    'pct_of_total' => $r['pct_of_total'] === null ? null : (float)$r['pct_of_total'],
  ];
}

$resTop->free();
$stmtTop->close();

$sqlMonth = sql($report, 'payments_over_threshold_month');
$stmtMonth = $conn->prepare($sqlMonth);

$stmtMonth->bind_param(
  'ssd',
  $monthStart, $monthEnd,
  $threshold
);

$stmtMonth->execute();
$resMonth = $stmtMonth->get_result();

$paymentsMonth = [];
while ($r = $resMonth->fetch_assoc()) {
  $paymentsMonth[] = [
    'vendor_id' => (int)$r['vendor_id'],
    'vendor' => $r['vendor'],
    'amount_cents' => (int)$r['amount_cents'],
    'date' => $r['date'],
    'dept_id' => (int)$r['dept_id'],
    'dept' => $r['dept'] ? trim($r['dept'], '* ') : null,
    'check_no' => (int)$r['check_no'],
    'description' => $r['description'],
  ];
}

$resMonth->free();
$stmtMonth->close();

$sqlFytd = sql($report, 'payments_over_threshold_fytd');
$stmtFytd = $conn->prepare($sqlFytd);

$stmtFytd->bind_param(
  'ssd',
  $fyStart, $monthEnd,
  $threshold
);

$stmtFytd->execute();
$resFytd = $stmtFytd->get_result();

$paymentsFytd = [];
while ($r = $resFytd->fetch_assoc()) {
  $paymentsFytd[] = [
    'vendor_id' => (int)$r['vendor_id'],
    'vendor' => $r['vendor'],
    'amount_cents' => (int)$r['amount_cents'],
    'date' => $r['date'],
    'dept_id' => (int)$r['dept_id'],
    'dept' => $r['dept'] ? trim($r['dept'], '* ') : null,
    'check_no' => (int)$r['check_no'],
    'description' => $r['description'],
  ];
}

$resFytd->free();
$stmtFytd->close();

$sqlHhi = sql($report, 'hhi_fytd');
$stmtHhi = $conn->prepare($sqlHhi);

$stmtHhi->bind_param(
  'ssssss',
  $fyStart, $monthEnd,
  $fyStart, $monthEnd,
  $fyStart, $monthEnd
);

$stmtHhi->execute();
$resHhi = $stmtHhi->get_result();

$hhiRow = $resHhi->fetch_assoc() ?: null;

$hhi = null;
if ($hhiRow) {
  $hhi = [
    'hhi' => $hhiRow['hhi'] === null ? null : (float)$hhiRow['hhi'],
    'vendor_count' => (int)$hhiRow['vendor_count'],
    'total_outflow_cents' => $hhiRow['total_outflow_cents'] === null ? 0 : (int)$hhiRow['total_outflow_cents'],
    'top_vendor_pct' => $hhiRow['top_vendor_pct'] === null ? null : (float)$hhiRow['top_vendor_pct'],
  ];
}

$resHhi->free();
$stmtHhi->close();

echo json_encode([
  'fy' => $fiscalYear,
  'fm' => $fiscalMonth,
  'threshold' => $threshold,
  'ranges' => [
    'month' => ['start' => $monthStart, 'end_exclusive' => $monthEnd],
    'fytd'  => ['start' => $fyStart, 'end_exclusive' => $monthEnd],
  ],
  'filters' => [
    'account_re' => 4,
    'net_amount' => '> 0',
  ],
  'semantics' => [
    'amount_cents' => 'NET_AMOUNT * 100 (expenditures only), cast to integer cents.',
    'pct_of_total' => 'Vendor FYTD outflow divided by total FYTD outflow.',
  ],
  'top10_vendors_fytd' => $topVendors,
  'payments_over_threshold' => [
    'month' => $paymentsMonth,
    'fytd'  => $paymentsFytd,
  ],
  'hhi_fytd' => $hhi,
], JSON_PRETTY_PRINT);
