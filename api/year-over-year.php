<?php
include './helpers.php';

$sql = "";
$types = '';
$params = [];
$seriesColumn = '';
$seriesColumnPieces = [];
$offset = 0;
$pageNumber = 0;
$pageSize = 0;

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
$series = isset($_GET['series']) ? explode(',', $_GET['series']) : ['fy'];
$pageNumber = isset($_GET['pg']) ? $_GET['pg'] : '1';
$pageSize = isset($_GET['ps']) ? $_GET['ps'] : '1200';

if(is_filtered($pageNumber)) {
    $pageNumber =intval($pageNumber);
    if($pageNumber < 1) $pageNumber = 1;
} else {
    $pageNumber = 1;
}
if(is_filtered($pageSize)) {
    $pageSize = intval($pageSize);
    if($pageSize < 1) $pageSize = 1;
    if($pageSize > 10000) {
        $pageSize = 10000;
    }
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

$filter = '';

$fiscalYearLabel = "'FY', CASE WHEN DATE_FORMAT(CHECK_DATE, '%m') >= 7 THEN YEAR(CHECK_DATE)+1 ELSE YEAR(CHECK_DATE) END";
$seriesJoin = '';
$seriesJoinPieces = [];

$seriesParts = [];
foreach($series as $name) {
    switch($name) {
        case 'fy':
            $seriesColumnPieces[] = $fiscalYearLabel;
            break;
        case 're':
            $seriesColumnPieces[] = "IFNULL(COA_RE.Name, '[No RE]')";
            $seriesJoinPieces[] = "LEFT OUTER JOIN COA_RE ON LEDGER.ACCOUNT_RE = COA_RE.ID";
            break;
        case 'dept':
            $seriesColumnPieces[] = "IFNULL(CONCAT(LPAD(COA_DEPT.ID, 6, '0'), ': ', COA_DEPT.Name), '[No Dept]')";
            $seriesJoinPieces[] = "LEFT OUTER JOIN COA_DEPT ON COA_DEPT.ID = LEDGER.ACCOUNT_DEPT";
            break;
        case 'vend':
            $seriesColumnPieces[] = "IFNULL(CONCAT(LPAD(VENDOR.Num, 6, '0'), ': ', VENDOR.Name), '[No Vendor]')";
            $seriesJoinPieces[] = "LEFT OUTER JOIN VENDOR ON VENDOR.ID = LEDGER.VENDOR_ID";
            break;
        case 'ol1':
            $seriesColumnPieces[] = "IFNULL(CONCAT(LPAD(COA_OL1.ID, 1, '0'), ': ', COA_OL1.Name), '[No OL1]')";
            $seriesJoinPieces[] = "LEFT OUTER JOIN COA_OL1 ON COA_OL1.ID = LEDGER.ACCOUNT_OL1";
            break;
        case 'ol1Func':
            $seriesColumnPieces[] = "IFNULL(CONCAT(LPAD(COA_FUNC.ID, 1, '0'), ': ', COA_FUNC.Name), '[No OL1 Func]')";
            $seriesJoinPieces[] = "LEFT OUTER JOIN COA_FUNC ON COA_FUNC.ID = LEDGER.ACCOUNT_OL1_FUNC";
            break;
        case 'ol2':
            $seriesColumnPieces[] = "IFNULL(CONCAT(LPAD(COA_OL2.ID, 1, '0'), ': ', COA_OL2.Name), '[No OL2]')";
            $seriesJoinPieces[] = "LEFT OUTER JOIN COA_OL2 ON COA_OL2.ID = LEDGER.ACCOUNT_OL2";
            break;
        case 'acct':
            $seriesColumnPieces[] = "IFNULL(CONCAT(LPAD(COA_ACCT.ID, 5, '0'), ': ', COA_ACCT.Name), '[No Account]')";
            $seriesJoinPieces[] = "LEFT OUTER JOIN COA_ACCT ON COA_ACCT.ID = LEDGER.ACCOUNT_NO";
            break;
        case 'inv':
            $seriesColumnPieces[] = "IFNULL(LEDGER.INVOICE_NO, '[No Invoice]')";
            break;
        case 'inv1':
            $seriesColumnPieces[] = "IFNULL(LEDGER.INVOICE_NO_1, '[No Invoice 1]')";
            break;
        case 'inv2': 
            $seriesColumnPieces[] = "IFNULL(LEDGER.INVOICE_NO_2, '[No Invoice 2]')";
            break;
        case 'inv3':
            $seriesColumnPieces[] = "IFNULL(LEDGER.INVOICE_NO_3, '[No Invoice 3]')";
            break;
    }
}
if(sizeof($seriesColumnPieces) === 0) {
    $seriesColumnPieces[] = $fiscalYearLabel;
}
$seriesColumn = implode(", ' ', ", $seriesColumnPieces);

if(sizeof($seriesJoinPieces) > 0) {
    $seriesJoin = implode(' ', $seriesJoinPieces);
} else {
    $seriesJoin = '';
}
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

$fromWhere = "FROM LEDGER 
        $seriesJoin
        $filter
        GROUP BY 
            CONCAT('', $seriesColumn),
            DATE_FORMAT(CHECK_DATE, '%M'),
            CASE WHEN DATE_FORMAT(CHECK_DATE, '%m') >= 7 THEN DATE_FORMAT(CHECK_DATE, '%m') - 6 ELSE DATE_FORMAT(CHECK_DATE, '%m') + 6 END
        ";

$sql = "SELECT COUNT(0) AS `total` FROM (SELECT 1 $fromWhere) AS `x`";
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
$stmt->bind_result($count);
$stmt->fetch();
$stmt->free_result();
$stmt->close();

// is count less than page? set to last good page
if(($pageSize * $pageNumber)-1 > $count) {
    $pageNumber = ceil($count / $pageSize);
}
$offset = (($pageNumber -1) * $pageSize);

$sql = "SELECT 
            CONCAT('', $seriesColumn) AS `series`,
            DATE_FORMAT(CHECK_DATE, '%M') AS `point`,
            CASE WHEN DATE_FORMAT(CHECK_DATE, '%m') >= 7 THEN DATE_FORMAT(CHECK_DATE, '%m') - 6 ELSE DATE_FORMAT(CHECK_DATE, '%m') + 6 END AS `pointOrder`,
            SUM(NET_AMOUNT) AS `value`
        $fromWhere
        ORDER BY
            CASE WHEN DATE_FORMAT(CHECK_DATE, '%m') >= 7 THEN DATE_FORMAT(CHECK_DATE, '%m') - 6 ELSE DATE_FORMAT(CHECK_DATE, '%m') + 6 END ASC,
            CONCAT('', $seriesColumn) ASC
        LIMIT $pageSize
        OFFSET $offset";
// echo $sql;
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

echo json_encode([
    "rows" => $rows,
    "count" => $count,
    "pageNumber" => $pageNumber,
    "pageSize" => $pageSize,
    "offset" => $offset,
    "sql" => [
        "count" => $sqlcount,
        "select" => $sqlselect
    ]
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
    "seriesColumnPieces" => $seriesColumnPieces,
    "seriesColumn" => $seriesColumn
], JSON_PRETTY_PRINT);
    exit;
}