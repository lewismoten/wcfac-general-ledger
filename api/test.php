<?php

header("Cache-Control: no-cache, no-store, must-revalidate");
header("Pragma: no-cache");
header("Expires: 0");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

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
  http_response_code(500);
  echo json_encode([
      "error" => "Database connection failed",
      "details" => $conn->connect_error
  ]);
  exit;
}
$conn->set_charset($db["charset"] ?? "utf8");

$sql = "SELECT 
            ID,
            PURCHASE_ORDER,
            VENDOR_NO,
            VENDOR_NAME,
            INVOICE_NO,
            INVOICE_DATE,
            ACCOUNT_FUND,
            ACCOUNT_DEPT,
            ACCOUNT_NO,
            ACCOUNT_PAID,
            NET_AMOUNT,
            CHECK_NO,
            CHECK_DATE,
            DESCRIPTION,
            BATCH
        FROM LEDGER LIMIT 100";
$result = $conn->query($sql);

if (!$result) {
  http_response_code(500);
  echo json_encode([
      "error" => "Query failed",
      "details" => $conn->error
  ]);
  exit;
}
$rows = [];

while ($row = $result->fetch_assoc()) {
    $row['ID'] = (int)$row['ID'];
    $row['PURCHASE_ORDER'] = (int)$row['PURCHASE_ORDER'];
    $row['VENDOR_NO'] = (int)$row['VENDOR_NO'];
    // $row['NET_AMOUNT'] = (float)$row['NET_AMOUNT']; can't get '0.08' as float / precision
    $row['ACCOUNT_FUND'] = (int)$row['ACCOUNT_FUND'];
    $row['ACCOUNT_DEPT'] = (int)$row['ACCOUNT_DEPT'];
    $row['ACCOUNT_NO'] = (int)$row['ACCOUNT_NO'];
    $row['CHECK_NO'] = (int)$row['CHECK_NO'];
    $row['BATCH'] = (int)$row['BATCH'];

    $rows[] = $row;
}

$conn->close();

echo json_encode($rows, JSON_PRETTY_PRINT);
