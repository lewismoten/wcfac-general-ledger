<?php
include './helpers.php';

$sql = "";
$types = '';
$params = [];
$medianNet = -1;
$maxNet = 0;
$minNet = 0;

try {

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
$pageNumber = isset($_GET['pg']) ? $_GET['pg'] : '1';
$pageSize = isset($_GET['ps']) ? $_GET['ps'] : '1200';

if(is_filtered($pageNumber)) {
    $pageNumber = intval($pageNumber);
    if($pageNumber < 1) {
        echo json_encode([
            "error" => "Page number too low",
            "details" => $conn->connect_error
        ]);
        exit;
    }
} else {
    $pageNumber = 1;
}
if(is_filtered($pageSize)) {
    $pageSize = intval($pageSize);
    if($pageSize < 25) {
        echo json_encode([
            "error" => "Page size too small",
            "details" => $conn->connect_error
        ]);
        exit;
    }
    if($pageSize > 500) {
        echo json_encode([
            "error" => "Page size too large",
            "details" => $conn->connect_error
        ]);
        exit;
    }
}
$config = require "config.php";
$db = $config["db"];

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

if(is_filtered_multi($fy)) {
    $filter .= " AND CASE WHEN DATE_FORMAT(CHECK_DATE, '%m') >= 7 THEN DATE_FORMAT(CHECK_DATE, '%Y')+1 ELSE DATE_FORMAT(CHECK_DATE, '%Y') END IN($fy)";
}
if(is_filtered_multi($re)) {
    $filter .= " AND LEDGER.ACCOUNT_RE IN($re)";
}
if((is_filtered($re) && $re === '4') || !is_filtered($re)) {
    if(is_filtered_multi($ol1)) {
        $values = array_map('trim', explode(',', $ol1));
        $placeholders = implode(',', array_fill(0, count($values), '?'));
        $filter .= " AND LEDGER.ACCOUNT_OL1 IN($placeholders)";
        $types .= str_repeat('i', count($values));
        $params = array_merge($params, $values);
    }
    if(is_filtered_multi($ol1Func)) {
        $values = array_map('trim', explode(',', $ol1Func));
        $placeholders = implode(',', array_fill(0, count($values), '?'));
        $filter .= " AND LEDGER.ACCOUNT_OL1_FUNC IN($placeholders)";
        $types .= str_repeat('i', count($values));
        $params = array_merge($params, $values);
    }
    if(is_filtered_multi($ol2)) {
        $values = array_map('trim', explode(',', $ol2));
        $placeholders = implode(',', array_fill(0, count($values), '?'));
        $filter .= " AND LEDGER.ACCOUNT_OL2 IN($placeholders)";
        $types .= str_repeat('i', count($values));
        $params = array_merge($params, $values);
    }
    if(is_filtered_multi($dept)) {
        $values = array_map('trim', explode(',', $dept));
        $placeholders = implode(',', array_fill(0, count($values), '?'));
        $filter .= " AND LEDGER.ACCOUNT_DEPT IN($placeholders)";
        $types .= str_repeat('i', count($values));
        $params = array_merge($params, $values);
    }
}
if(is_filtered_multi($acct)) {
    $values = array_map('trim', explode(',', $acct));
    $placeholders = implode(',', array_fill(0, count($values), '?'));
    $filter .= " AND LEDGER.ACCOUNT_NO IN($placeholders)";
    $types .= str_repeat('i', count($values));
    $params = array_merge($params, $values);
}
if(is_filtered_multi($vend)) {
    $values = array_map('trim', explode(',', $vend));
    $placeholders = implode(',', array_fill(0, count($values), '?'));
    $filter .= " AND LEDGER.VENDOR_ID IN($placeholders)";
    $types .= str_repeat('i', count($values));
    $params = array_merge($params, $values);
}
if(is_filtered_multi_s($inv)) {
    $values = array_map('trim', explode(',', $inv));
    $placeholders = implode(',', array_fill(0, count($values), '?'));
    $filter .= " AND LEDGER.INVOICE_NO IN($placeholders)";
    $types .= str_repeat('s', count($values));
    $params = array_merge($params, $values);
}
if(is_filtered_multi_s($inv1)) {
    $values = array_map('trim', explode(',', $inv1));
    $placeholders = implode(',', array_fill(0, count($values), '?'));
    $filter .= " AND LEDGER.INVOICE_NO_1 IN($placeholders)";
    $types .= str_repeat('s', count($values));
    $params = array_merge($params, $values);
}
if(is_filtered_multi_s($inv2)) {
    $values = array_map('trim', explode(',', $inv2));
    $placeholders = implode(',', array_fill(0, count($values), '?'));
    $filter .= " AND LEDGER.INVOICE_NO_2 IN($placeholders)";
    $types .= str_repeat('s', count($values));
    $params = array_merge($params, $values);
}
if(is_filtered_multi_s($inv3)) {
    $values = array_map('trim', explode(',', $inv3));
    $placeholders = implode(',', array_fill(0, count($values), '?'));
    $filter .= " AND LEDGER.INVOICE_NO_3 IN($placeholders)";
    $types .= str_repeat('s', count($values));
    $params = array_merge($params, $values);
}

if($filter != '') {
    $filter = "WHERE 1=1 $filter";
}
$sql = "SELECT 
            COUNT(1),
            MAX(LEDGER.NET_AMOUNT) as `MaxNet`,
            MIN(LEDGER.NET_AMOUNT) as `MinNet`
        FROM LEDGER
            LEFT OUTER JOIN VENDOR ON VENDOR.ID = LEDGER.VENDOR_ID
            $filter";
$sqlcount = $sql;
$stmt = $conn->prepare($sql);

if(!$stmt) {
  echo json_encode([
      "error" => "Prepare statement failed",
      "details" => $conn->error,
      "sql" => $sql
  ]);
    exit;
}

if ($types !== '') {
    $stmt->bind_param($types, ...$params);
}

if(!$stmt->execute()) {
  echo json_encode([
      "error" => "Query execution failed",
      "details" => $conn->error,
      "sql" => $sql
  ]);
    exit;
}
$stmt->bind_result($count, $maxNet, $minNet);
$stmt->fetch();
$stmt->free_result();
$stmt->close();

$medianLimit = ($count % 2 === 0) ? 2 : 1;
$medianOffset = (int)floor(($count - 1) / 2);

$sql = "SELECT AVG(sub.NET_AMOUNT) AS `MedianNet`
FROM (
    SELECT LEDGER.NET_AMOUNT 
    FROM LEDGER
    LEFT OUTER JOIN VENDOR ON VENDOR.ID = LEDGER.VENDOR_ID 
    $filter
    ORDER BY NET_AMOUNT
    LIMIT $medianLimit
    OFFSET $medianOffset
    ) AS sub";
$stmt = $conn->prepare($sql);

if(!$stmt) {
  echo json_encode([
      "error" => "Prepare statement failed",
      "details" => $conn->error,
      "sql" => $sql
  ]);
    exit;
}

if ($types !== '') {
    $stmt->bind_param($types, ...$params);
}

if(!$stmt->execute()) {
  echo json_encode([
      "error" => "Query execution failed",
      "details" => $conn->error,
      "sql" => $sql
  ]);
    exit;
}
$stmt->bind_result($medianNet);
$stmt->fetch();
$stmt->free_result();
$stmt->close();

$pageOffset = (($pageNumber -1) * $pageSize);

$sql = "SELECT
            LEDGER.ID as `id`,
            LPAD(LEDGER.PURCHASE_ORDER, 7, '0') as `poNo`,
            LPAD(VENDOR.Num, 6, '0') as `vendorNo`,
            VENDOR.Name as `vendorName`,
            IFNULL(LEDGER.INVOICE_NO, '') as `invoiceNo`,
            DATE_FORMAT(LEDGER.INVOICE_DATE, '%c/%d/%Y') as `invoiceDate`,
            CONCAT(LPAD(LEDGER.ACCOUNT_FUND, 4, '0'),'-', LPAD(LEDGER.ACCOUNT_DEPT, 6, '0'),'-', LPAD(LEDGER.ACCOUNT_NO, 5, '0'),'-   -   -') as `accountNo`,
            DATE_FORMAT(LEDGER.ACCOUNT_PAID, '%Y/%m') as `accountPaid`,
            LEDGER.NET_AMOUNT as `netAmount`,
            LEDGER.CHECK_NO as `checkNo`,
            DATE_FORMAT(LEDGER.CHECK_DATE, '%c/%d/%Y') as `checkDate`,
            LEDGER.DESCRIPTION as `description`,
            LEDGER.BATCH as `batchNo`
        FROM LEDGER
            LEFT OUTER JOIN VENDOR ON VENDOR.ID = LEDGER.VENDOR_ID
            $filter
        ORDER BY
            CHECK_DATE ASC,
            VENDOR.Num ASC
        LIMIT $pageSize
        OFFSET $pageOffset
        ";

$sqlselect = $sql;
$stmt = $conn->prepare($sql);

if(!$stmt) {
  echo json_encode([
      "error" => "Prepare statement failed",
      "details" => $conn->error,
      "sql" => $sql
  ]);
    exit;
}

if ($types !== '') {
    $stmt->bind_param($types, ...$params);
}

if(!$stmt->execute()) {
  echo json_encode([
      "error" => "Query execution failed",
      "details" => $conn->error,
      "sql" => $sql
  ]);
    exit;
}
$result = $stmt->get_result();

if (!$result) {
  echo json_encode([
      "error" => "Get results failed",
      "details" => $stmt->error
  ]);
  exit;
}
$rows = [];

while ($row = $result->fetch_assoc()) {
    // $row['BATCH'] = (int)$row['BATCH'];
    $rows[] = $row;
}

$stmt->free_result();
$stmt->close();
$conn->close();

$pageCount = ceil($count / $pageSize);
$nextPage = null;
if($pageCount > $pageNumber) $nextPage = $pageNumber + 1;

echo json_encode([ 
    "rows" => $rows,
    "total" => $count,
    "nextPage" => $nextPage,
    "maxNet" => $maxNet,
    "minNet" => $minNet,
    "medianNet" => $medianNet
], JSON_PRETTY_PRINT);
} catch(mysqli_sql_exception $e) {
    error_log($e->getMessage());
    echo json_encode([
    "error" => 'SQL Exception',
    "details" => $e->getMessage(),
    "sql" => $sql,
    "types" => $types,
    "params" => $params,
    "state" => $e->getSqlState(),
], JSON_PRETTY_PRINT);
    exit;
}