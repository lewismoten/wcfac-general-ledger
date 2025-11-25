<?php

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

$sql = "SELECT DISTINCT
            `$column` as `id`,
            `$column` as `name`
        FROM
            LEDGER
        WHERE
            `$column` IS NOT NULL
        ORDER BY
            `$column` ASC
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
