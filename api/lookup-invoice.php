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

$level = $_GET['level'];
$table = '';
$fk = '';

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

function is_filtered($value) {
   return $value  !== '' && $value !== null && is_numeric($value) && $value != '-1';
}
function is_filtered_s($value) {
   return $value  !== '' && $value !== null && $value != '-1';
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

switch($level) {
    case '-1': 
        $column = "INVOICE_NO"; 
        break;
    case '1': 
        $column = "INVOICE_NO_1"; 
        break;
    case '2': 
        $column = "INVOICE_NO_2"; 
         break;
    case '3': 
        $column = "INVOICE_NO_3"; 
        break;

    default: 
      echo json_encode([
        "error" => "Unknown type",
        "details" => $conn->connect_error
    ]);
    exit;
}

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

$where = "WHERE `$column` IS NOT NULL";
$types = '';
$params = [];

if(is_filtered_multi($fy)) {
    $where .= " AND CASE WHEN DATE_FORMAT(CHECK_DATE, '%m') >= 7 THEN DATE_FORMAT(CHECK_DATE, '%Y')+1 ELSE DATE_FORMAT(CHECK_DATE, '%Y') END IN($fy)";
}

if(is_filtered($re)) {
    $where .= " AND LEDGER.ACCOUNT_RE = ?";
    $types .= "i";
    $params[] = intval($re);
}
if((is_filtered($re) && $re === '4') || !is_filtered($re)) {
    if(is_filtered($ol1)) {
        $where .= " AND LEDGER.ACCOUNT_OL1 = ?";
        $types .= "i";
        $params[] = intval($ol1);
    }
    if(is_filtered($ol1Func)) {
        $where .= " AND LEDGER.ACCOUNT_OL1_FUNC = ?";
        $types .= "i";
        $params[] = intval($ol1Func);
    }
    if(is_filtered($ol2)) {
        $where .= " AND LEDGER.ACCOUNT_OL2 = ?";
        $types .= "i";
        $params[] = intval($ol2);
    }
    if(is_filtered($dept)) {
        $where .= " AND LEDGER.ACCOUNT_DEPT = ?";
        $types .= "i";
        $params[] = intval($dept);
    }
}
if(is_filtered($acct)) {
    $where .= " AND LEDGER.ACCOUNT_NO = ?";
    $types .= "i";
    $params[] = intval($acct);
}
if(is_filtered($vend)) {
    $where .= " AND LEDGER.VENDOR_ID = ?";
    $types .= "i";
    $params[] = intval($vend);
}
if(is_filtered_s($inv1)) {
    $where .= " AND INVOICE_NO_1 = ?";
    $types .= "s";
    $params[] = $inv1;
}
if(is_filtered_s($inv2)) {
    $where .= " AND INVOICE_NO_2 = ?";
    $types .= "s";
    $params[] = $inv2;
}
if(is_filtered_s($inv3)) {
    $where .= " AND INVOICE_NO_3 = ?";
    $types .= "s";
    $params[] = $inv3;
}
if(is_filtered_s($inv)) {
    $where .= " AND INVOICE_NO = ?";
    $types .= "s";
    $params[] = $inv;
}

$sql = "SELECT DISTINCT
            `$column` as `id`,
            `$column` as `name`
        FROM
            LEDGER
        $where     
        ORDER BY
            `$column` ASC
        LIMIT 500";
$stmt = $conn->prepare($sql);
if(!$stmt) {
  echo json_encode([
      "error" => "Prepare statement failed",
      "details" => $conn->error
  ]);
    exit;
}

if ($types !== '') {
    $stmt->bind_param($types, ...$params);
}

if(!$stmt->execute()) {
  echo json_encode([
      "error" => "Query execution failed",
      "details" => $conn->error
  ]);
    exit;
}
$result = $stmt->get_result();

if (!$result) {
//   http_response_code(500);
  echo json_encode([
      "error" => "Query failed",
      "details" => $conn->error
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
