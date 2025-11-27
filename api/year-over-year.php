<?php
error_reporting(E_ALL);
ini_set('display_errors', '0');
mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);

header("Cache-Control: no-cache, no-store, must-revalidate");
header("Pragma: no-cache");
header("Expires: 0");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

$fy = isset($_GET['fy']) ? $_GET['fy'] : '';
$re = isset($_GET['re']) ? $_GET['re'] : '';
$ol1 = isset($_GET['ol1']) ? $_GET['ol1'] : '';
$ol1Func = isset($_GET['ol1Func']) ? $_GET['ol1Func'] : '';
$ol2 = isset($_GET['ol2']) ? $_GET['ol2'] : '';
$dept = isset($_GET['dept']) ? $_GET['dept'] : '';
$acct = isset($_GET['acct']) ? $_GET['acct'] : '';
$vend = isset($_GET['vend']) ? $_GET['vend'] : '';
$inv = isset($_GET['inv']) ? $_GET['inv'] : '';
$inv1 = isset($_GET['inv1']) ? $_GET['inv1'] : '';
$inv2 = isset($_GET['inv2']) ? $_GET['inv2'] : '';
$inv3 = isset($_GET['inv3']) ? $_GET['inv3'] : '';
$series = isset($_GET['series']) ? explode(',', $_GET['series']) : ['fy'];

$config = require "config.php";
$db = $config["db"];
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$conn = new mysqli(
    $db["host"],
    $db["user"],
    $db["pass"],
    $db["db"]
);

if ($conn->connect_error) {
//   http_response_code(500);
  echo json_encode([
      "error" => "Database connection failed",
      "details" => $conn->connect_error
  ]);
  exit;
}
$conn->set_charset($db["charset"] ?? "utf8");

$filter = '';
function is_filtered($value) {
   return $value  !== '' && $value !== null && is_numeric($value) && $value != '-1';
}
function is_filtered_multi($values) {
   if($values  == '' || $values == null || $values == '-1') return false;
   if(is_numeric($values)) return true;
   $parts = explode(',', $values);
    foreach ($parts as $p) {
        $p = trim($p);
        if ($p === '' || !is_numeric($p)) {
            return false;
        }
    }
    return true;
}

$types = '';
$params = [];

$fiscalYearLabel = "'FY', CASE WHEN DATE_FORMAT(CHECK_DATE, '%m') >= 7 THEN YEAR(CHECK_DATE)+1 ELSE YEAR(CHECK_DATE) END";
$seriesColumn = '';
$seriesJoin = '';
$seriesColumnPieces = [];
$seriesJoinPieces = [];

$seriesParts = [];
foreach($series as $name) {
    switch($name) {
        case 'fy':
            $seriesColumnPieces[] = $fiscalYearLabel;
            break;
        case 're':
            $seriesColumnPieces[] = "COA_RE.Name";
            $seriesJoinPieces[] = "INNER JOIN COA_RE ON LEDGER.ACCOUNT_RE = COA_RE.ID";
            break;
        case 'dept':
            $seriesColumnPieces[] = "COA_DEPT.Name";
            $seriesJoinPieces[] = "INNER JOIN COA_DEPT ON COA_DEPT.ID = LEDGER.ACCOUNT_DEPT";
            break;
        case 'vend':
            $seriesColumnPieces[] = "VENDOR.Name";
            $seriesJoinPieces[] = "INNER JOIN VENDOR ON VENDOR.ID = LEDGER.VENDOR_ID";
            break;
    }
}
if(sizeof($seriesColumnPieces) > 0) {
    $seriesColumn = implode(", ' ', ", $seriesColumnPieces);
} else {
    $seriesColumn = $fiscalYearLabel;
}
if(sizeof($seriesJoinPieces) > 0) {
    $seriesJoin = implode(' ', $seriesJoinPieces);
} else {
    $seriesJoin = '';
}
if(is_filtered_multi($fy)) {
    $filter .= " AND CASE WHEN DATE_FORMAT(CHECK_DATE, '%m') >= 7 THEN DATE_FORMAT(CHECK_DATE, '%Y')+1 ELSE DATE_FORMAT(CHECK_DATE, '%Y') END IN($fy)";
}
if(is_filtered($re)) {
    $filter .= " AND LEDGER.ACCOUNT_RE = ".intval($re);
}
if((is_filtered($re) && $re === '4') || !is_filtered($re)) {
    if(is_filtered($ol1)) {
        $filter .= " AND LEDGER.ACCOUNT_OL1 = ".intval($ol1);
    }
    if(is_filtered($ol1Func)) {
        $filter .= " AND LEDGER.ACCOUNT_OL1_FUNC = ".intval($ol1Func);
    }
    if(is_filtered($ol2)) {
        $filter .= " AND LEDGER.ACCOUNT_OL2 = ".intval($ol2);
    }
    if(is_filtered($dept)) {
        $filter .= " AND LEDGER.ACCOUNT_DEPT = ".intval($dept);
    }
}
if(is_filtered($acct)) {
    $filter .= " AND LEDGER.ACCOUNT_NO = ".intval($acct);
}
if(is_filtered($vend)) {
    $filter .= " AND LEDGER.VENDOR_ID = ".intval($vend);
    $seriesColumn = "";
    $seriesJoin = "";
}
if(is_filtered($inv)) {
    $filter .= " AND LEDGER.INVOICE_NO = ?";
    $types .= 's';
    $params[] = $inv;
}
if(is_filtered($inv1)) {
    $filter .= " AND LEDGER.INVOICE_NO_1 = ?";
    $types .= 's';
    $params[] = $inv1;
}
if(is_filtered($inv2)) {
    $filter .= " AND LEDGER.INVOICE_NO_2 = ?";
    $types .= 's';
    $params[] = $inv2;
}
if(is_filtered($inv3)) {
    $filter .= " AND LEDGER.INVOICE_NO_3 = ?";
    $types .= 's';
    $params[] = $inv3;
}

if($multiYear) {
    if($seriesColumn == '') {
        $seriesColumn = $fiscalYear;
    } else {
        $seriesColumn = "$fiscalYear, ' ', $seriesColumn";
    }
} else if($seriesColumn == '') {
    $seriesColumn = $fiscalYear;
}

if($filter != '') {
    $filter = "WHERE 1=1 $filter";
}

$sql = "SELECT 
            CONCAT($seriesColumn) AS `series`,
            DATE_FORMAT(CHECK_DATE, '%M') AS `point`,
            CASE WHEN DATE_FORMAT(CHECK_DATE, '%m') >= 7 THEN DATE_FORMAT(CHECK_DATE, '%m') - 6 ELSE DATE_FORMAT(CHECK_DATE, '%m') + 6 END AS `pointOrder`,
            SUM(NET_AMOUNT) AS `value`
        FROM LEDGER 
        $seriesJoin
        $filter
        GROUP BY 
            CONCAT($seriesColumn),
            DATE_FORMAT(CHECK_DATE, '%M'),
            CASE WHEN DATE_FORMAT(CHECK_DATE, '%m') >= 7 THEN DATE_FORMAT(CHECK_DATE, '%m') - 6 ELSE DATE_FORMAT(CHECK_DATE, '%m') + 6 END
        ORDER BY
            CASE WHEN DATE_FORMAT(CHECK_DATE, '%m') >= 7 THEN DATE_FORMAT(CHECK_DATE, '%m') - 6 ELSE DATE_FORMAT(CHECK_DATE, '%m') + 6 END ASC,
            CASE WHEN DATE_FORMAT(CHECK_DATE, '%m') >= 7 THEN YEAR(CHECK_DATE)+1 ELSE YEAR(CHECK_DATE) END,
            CONCAT($seriesColumn) ASC
        LIMIT 10000";
// echo $sql;

$stmt = $conn->prepare($sql);

if(!$stmt) {
  echo json_encode([
      "error" => "Prepare statement failed",
      "details" => $conn->error,
      "sql" => $sql
  ]);
    exit;
}

if ($types !== '') {
    $stmt->bind_param($types, ...$params);
}

if(!$stmt->execute()) {
  echo json_encode([
      "error" => "Query execution failed",
      "details" => $conn->error,
      "sql" => $sql
  ]);
    exit;
}
$result = $stmt->get_result();

if (!$result) {
  echo json_encode([
      "error" => "Get results failed",
      "details" => $stmt->error
  ]);
  exit;
}
$rows = [];

while ($row = $result->fetch_assoc()) {
    // $row['BATCH'] = (int)$row['BATCH'];
    $rows[] = $row;
}

$conn->close();

echo json_encode($rows, JSON_PRETTY_PRINT);
