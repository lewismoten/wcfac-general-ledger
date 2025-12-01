<?php
require_once './helpers.php';
require_once './build_ledger_filter_clause.php';

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

$filter = build_ledger_filter_clause($types, $params);

if($filter != '') {
    $where .= " AND $filter";
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
