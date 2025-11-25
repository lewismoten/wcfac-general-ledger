<?php

header("Cache-Control: no-cache, no-store, must-revalidate");
header("Pragma: no-cache");
header("Expires: 0");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

$fy = $_GET['fy'];
$re = $_GET['re'];
$ol1 = $_GET['ol1'];
$ol1Func = $_GET['ol1Func'];
$ol2 = $_GET['ol2'];
$dept = $_GET['dept'];
$acct = $_GET['acct'];

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
   if($values  == '' || $values == null || $value == '-1') return false;
   if(is_numeric($value)) return true;
   $parts = explode(',', $values);
    foreach ($parts as $p) {
        $p = trim($p);
        if ($p === '' || !is_numeric($p)) {
            return false;
        }
    }
    return true;
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
if($filter != '') {
    $filter = "WHERE 1=1 $filter";
}

$sql = "SELECT 
            CONCAT('FY', CASE WHEN DATE_FORMAT(CHECK_DATE, '%m') >= 7 THEN DATE_FORMAT(CHECK_DATE, '%y')+1 ELSE DATE_FORMAT(CHECK_DATE, '%y') END, ' ', COA_RE.Name) AS `series`,
            DATE_FORMAT(CHECK_DATE, '%M') AS `point`,
            CASE WHEN DATE_FORMAT(CHECK_DATE, '%m') >= 7 THEN DATE_FORMAT(CHECK_DATE, '%m') - 6 ELSE DATE_FORMAT(CHECK_DATE, '%m') + 6 END AS `pointOrder`,
            SUM(NET_AMOUNT) AS `value`
        FROM LEDGER 
        INNER JOIN COA_RE ON
            LEDGER.ACCOUNT_RE = COA_RE.ID
        $filter
        GROUP BY 
            CONCAT(DATE_FORMAT(CHECK_DATE, '%Y'), ' ', COA_RE.Name),
            DATE_FORMAT(CHECK_DATE, '%M')
        ORDER BY
            CASE WHEN DATE_FORMAT(CHECK_DATE, '%m') >= 6 THEN DATE_FORMAT(CHECK_DATE, '%m') - 6 ELSE DATE_FORMAT(CHECK_DATE, '%m') + 6 END ASC,
            CASE WHEN DATE_FORMAT(CHECK_DATE, '%m') >= 7 THEN DATE_FORMAT(CHECK_DATE, '%y')+1 ELSE DATE_FORMAT(CHECK_DATE, '%y') END,
            CONCAT('', COA_RE.Name) ASC
        LIMIT 10000";
$result = $conn->query($sql);

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
