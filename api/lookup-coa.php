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
switch($id) {
    case 're': $table = "COA_RE"; break;
    case 'ol1': $table = "COA_OL1"; break;
    case 'ol2': $table = "COA_OL2"; break;
    case 'ol1Func': $table = "COA_FUNC"; break;
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

$sql = "SELECT 
            ID as `id`,
            Name as `name`
        FROM
            `$table`
        ORDER BY
            ID ASC
        LIMIT 100";
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
