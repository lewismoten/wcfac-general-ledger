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
//   http_response_code(500);
  echo json_encode([
      "error" => "Database connection failed",
      "details" => $conn->connect_error
  ]);
  exit;
}
$conn->set_charset($db["charset"] ?? "utf8");

$sql = "SELECT 
            CONCAT(DATE_FORMAT(CHECK_DATE, '%Y'), ' ', COA_RE.Name) AS `series`,
            DATE_FORMAT(CHECK_DATE, '%M') AS `point`,
            DATE_FORMAT(CHECK_DATE, '%m') AS `pointOrder`,
            SUM(NET_AMOUNT) AS `value`
        FROM LEDGER 
        INNER JOIN COA_RE ON
            LEDGER.ACCOUNT_RE = COA_RE.ID
        GROUP BY 
            CONCAT(DATE_FORMAT(CHECK_DATE, '%Y'), ' ', COA_RE.Name),
            DATE_FORMAT(CHECK_DATE, '%M')
        ORDER BY
            DATE_FORMAT(CHECK_DATE, '%m') ASC,
            CONCAT(DATE_FORMAT(CHECK_DATE, '%Y'), ' ', COA_RE.Name) ASC
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
