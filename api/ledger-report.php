<?php
require_once './helpers.php';
require_once './build_ledger_filter_clause.php';

// Drill Down by Department -> Description -> [Sum(2024 checks), Sum(2025 checks)]


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
$po = isset($_GET['po']) ? $_GET['po'] : '';
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
            "details" => $pageNumber
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
            "details" => $pageSize
        ]);
        exit;
    }
    if($pageSize > 1200) {
        echo json_encode([
            "error" => "Page size too large",
            "details" => $pageSize
        ]);
        exit;
    }
} else {
    $pageSize = 1200;
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

$filter = build_ledger_filter_clause($types, $params);

if($filter != '') {
    $filter = "WHERE $filter";
}

$sql = "SELECT DISTINCT DATE_FORMAT(CHECK_DATE, '%Y') + 
    CASE WHEN DATE_FORMAT(CHECK_DATE, '%m') >= 7 THEN 1 ELSE 0 END AS `FY`
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

// get years
$result = $stmt->get_result();
if (!$result) {
  echo json_encode([
      "error" => "Get results failed",
      "details" => $stmt->error
  ]);
  exit;
}
$years = [];
while ($row = $result->fetch_assoc()) {
    $years[] = $row['FY'];
}
$stmt->free_result();
$stmt->close();
if(sizeof($years) === 0) {
    echo json_encode([ 
        "years" => [],
        "departments" => [],
    ], JSON_PRETTY_PRINT);
    exit;
}

$sql = "SELECT
            COA_DEPT.ID AS `departmentNo`,
            COA_DEPT.Name AS `departmentName`,
            LEDGER.ACCOUNT_NO AS `accountNo`,
            LEDGER.DESCRIPTION as `accountDescription`,
            VENDOR.Num AS `vendorNo`,
            VENDOR.Name AS `vendorName`,
            DATE_FORMAT(CHECK_DATE, '%Y') + CASE WHEN DATE_FORMAT(CHECK_DATE, '%m') >= 7 THEN 1 ELSE 0 END AS `fiscalYear`,
            SUM(LEDGER.NET_AMOUNT) AS `netAmount`
        FROM LEDGER
            INNER JOIN COA_DEPT ON LEDGER.ACCOUNT_DEPT = COA_DEPT.ID
            LEFT OUTER JOIN VENDOR ON VENDOR.ID = LEDGER.VENDOR_ID
            $filter
        GROUP BY
            COA_DEPT.ID,
            COA_DEPT.Name,
            LEDGER.ACCOUNT_NO,
            LEDGER.DESCRIPTION,
            VENDOR.Num,
            VENDOR.Name,
            DATE_FORMAT(CHECK_DATE, '%Y') + CASE WHEN DATE_FORMAT(CHECK_DATE, '%m') >= 7 THEN 1 ELSE 0 END
        ORDER BY
            COA_DEPT.ID ASC,
            LEDGER.ACCOUNT_NO ASC,
            VENDOR.Num ASC,
            DATE_FORMAT(CHECK_DATE, '%Y') + CASE WHEN DATE_FORMAT(CHECK_DATE, '%m') >= 7 THEN 1 ELSE 0 END ASC
        LIMIT 10000
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
$departments = [];

while ($row = $result->fetch_assoc()) {
    $dept_no = $row['departmentNo'];
    $dept_name = $row['departmentName'];
    $account_no = $row['accountNo'];
    $account_desc = $row['accountDescription'];
    $vendor_no = $row['vendorNo'];
    $vendor_name = $row['vendorName'];
    $fiscalYear = $row['fiscalYear'];
    $amount = (float)$row['netAmount'];

    if(!isset($departments[$dept_no])) {
        $departments[$dept_no] = [
            'no' => $dept_no,
            'name' => $dept_name,
            'accounts' => []
        ];
    }

    if(!isset($departments[$dept_no]['accounts'][$account_no])) {
        $departments[$dept_no]['accounts'][$account_no] = [
            'no' => $account_no,
            'name' => $account_desc,
            'vendors' => []
        ];
    }

    if (!isset($departments[$dept_no]['accounts'][$account_no]['vendors'][$vendor_no])) {
        $departments[$dept_no]['accounts'][$account_no]['vendors'][$vendor_no] = [
            'no' => $vendor_no,
            'name' => $vendor_name
        ];
    }

    if (!isset($departments[$dept_no]['accounts'][$account_no]['vendors'][$vendor_no][$fiscalYear])) {
        $departments[$dept_no]['accounts'][$account_no]['vendors'][$vendor_no][$fiscalYear] = 0;
    }

    $departments[$dept_no]['accounts'][$account_no]['vendors'][$vendor_no][$fiscalYear] += $amount;

}

$stmt->free_result();
$stmt->close();
$conn->close();

$pageCount = ceil($count / $pageSize);
$nextPage = null;
if($pageCount > $pageNumber) $nextPage = $pageNumber + 1;

echo json_encode([ 
    "years" => $years,
    "departments" => $departments
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