<?php

header("Cache-Control: no-cache, no-store, must-revalidate");
header("Pragma: no-cache");
header("Expires: 0");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

$id = $_GET['type'];
$table = '';
$pad = 1;
$fk = '';

switch($id) {
    case 're': 
        $table = "COA_RE"; 
        $fk = 'ACCOUNT_RE';
        break;
    case 'ol1': 
        $table = "COA_OL1";
        $fk = 'ACCOUNT_OL1';
         break;
    case 'ol2': 
        $table = "COA_OL2"; 
        $fk = 'ACCOUNT_OL2';
        break;
    case 'ol1Func': 
        $table = "COA_FUNC"; 
        $fk = 'ACCOUNT_OL1_FUNC';
    break;
    case 'dept': 
        $table = "COA_DEPT"; 
        $fk = 'ACCOUNT_DEPT';
        $pad = 6;
        break;
    case 'acct': 
        $table = "COA_ACCT"; 
        $fk = 'ACCOUNT_NO';
        $pad = 4;
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

$sql = "SELECT DISTINCT
            `$table`.ID as `id`,
            CONCAT(LPAD(`$table`.ID, $pad, '0'), ': ', Name) as `name`
        FROM
            `$table`
            INNER JOIN LEDGER WHERE LEDGER.`$fk` = `$table`.ID
        ORDER BY
            `$table`.ID ASC
        LIMIT 500";
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
