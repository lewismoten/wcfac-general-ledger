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

$id = $_GET['type'];
$table = '';
$fk = '';
$sql = '';

switch($id) {
    case 're': 
        $table = "COA_RE"; 
        $fk = 'ACCOUNT_RE';
        $name = "CONCAT(LPAD(`$table`.ID, 1, '0'), ': ', Name)";
        break;
    case 'ol1': 
        $table = "COA_OL1";
        $fk = 'ACCOUNT_OL1';
        $name = "CONCAT(LPAD(`$table`.ID, 1, '0'), ': ', Name)";
         break;
    case 'ol2': 
        $table = "COA_OL2"; 
        $fk = 'ACCOUNT_OL2';
        $name = "CONCAT(LPAD(`$table`.ID, 1, '0'), ': ', Name)";
        break;
    case 'ol1Func': 
        $table = "COA_FUNC"; 
        $fk = 'ACCOUNT_OL1_FUNC';
        $name = "CONCAT(LPAD(`$table`.ID, 1, '0'), ': ', Name)";
    break;
    case 'dept': 
        $table = "COA_DEPT"; 
        $fk = 'ACCOUNT_DEPT';
        $name = "CONCAT(LPAD(`$table`.ID, 6, '0'), ': ', Name)";
        break;
    case 'acct': 
        $table = "COA_ACCT"; 
        $fk = 'ACCOUNT_NO';
        $name = "CONCAT(LPAD(`$table`.ID, 5, '0'), ': ', Name)";
        break;
    case 'vend': 
        $table = "VENDOR"; 
        $fk = 'VENDOR_ID';
        $name = "CONCAT(LPAD(`$table`.Num, 6, '0'), ': ', Name)";
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

try {
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

$where = '';
$types = '';
$params = [];

function is_filtered($value) {
   return $value  !== '' && $value !== null && is_numeric($value) && $value != '-1';
}

$re = isset($_GET['re']) ? $_GET['re'] : '';
$ol1 = isset($_GET['ol1']) ? $_GET['ol1'] : '';
$ol1Func = isset($_GET['ol1Func']) ? $_GET['ol1Func'] : '';
$ol2 = isset($_GET['ol2']) ? $_GET['ol2'] : '';
$dept = isset($_GET['dept']) ? $_GET['dept'] : '';

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

if($where != '') {
    $where = "WHERE 1=1 $where";
}

$sql = "SELECT DISTINCT
            `$table`.ID as `id`,
            $name as `name`
        FROM
            `$table`
            INNER JOIN LEDGER ON LEDGER.`$fk` = `$table`.ID
        $where
        ORDER BY
            `$table`.ID ASC
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
      "error" => "Get results failed",
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
} catch (mysqli_sql_exception $e) {
    http_response_code(500);
    echo json_encode([
        "error" => "Database error",
        "detail"=> $e->getMessage(),
        'sql'=> $sql
    ]);
    exit;
}catch (Throwable $e) {
    // http_response_code(500);
    echo json_encode([
        "error" => "Server error",
        "detail"=> $e->getMessage(),
    ]);
    exit;
}