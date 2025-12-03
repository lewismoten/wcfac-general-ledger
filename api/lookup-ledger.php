<?php
require_once './helpers.php';
require_once './build_ledger_filter_clause.php';

$type = $_GET['type'];
$table = '';
$fk = '';
$pad = 0;
$idColumn;
$nameColumn;

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
$po = isset($_GET['po']) ? $_GET['po'] : '';
try {
switch($type) {
    case 'po': 
        $idColumn = "`PURCHASE_ORDER`";
        $nameColumn = "LPAD(`PURCHASE_ORDER`, 6, '0')";
        break;
    case 'bat':
        $idColumn = "`BATCH`";
        $nameColumn = $idColumn;
        break;
    case 'chk':
        $idColumn = "`CHECK_NO`";
        $nameColumn = $idColumn;
        break;
    case 'des':
        $idColumn = "`DESCRIPTION`";
        $nameColumn = $idColumn;
        break;
    default: 
      echo json_encode([
        "error" => "Unknown type",
        "details" => "'$type' is an unknown type"
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

$where = "WHERE $idColumn IS NOT NULL";
$types = '';
$params = [];

$filter = build_ledger_filter_clause($types, $params);

if($filter != '') {
    $where .= " AND $filter";
    if(str_contains($where, 'VENDOR')) {
        $joinVendor = 'INNER JOIN VENDOR ON LEDGER.VENDOR_ID = VENDOR.ID';
    }
}

$sql = "SELECT DISTINCT
            $idColumn as `id`,
            $nameColumn as `name`
        FROM
            LEDGER
            $joinVendor
        $where     
        ORDER BY
            $nameColumn ASC
        LIMIT 10000";
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
} catch(mysqli_sql_exception $e) {
    error_log($e->getMessage());
    echo json_encode([
        "error" => 'SQL Exception',
        "details" => $e->getMessage(),
        "sql" => $sql,
        "types" => $types,
        "params" => $params,
        "state" => $e->getSqlState()
    ], JSON_PRETTY_PRINT);
    exit;
} catch (Exception $e) {
    error_log($e->getMessage());
    echo json_encode([
        "error" => 'Exception',
        "details" => $e->getMessage()
    ], JSON_PRETTY_PRINT);
    exit;
}