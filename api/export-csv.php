<?php
require_once './helpers.php';
require_once './build_ledger_filter_clause.php';

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

$config = require "config.php";
$db = $config["db"];

$conn = new mysqli(
    $db["host"],
    $db["user"],
    $db["pass"],
    $db["db"]
);

if ($conn->connect_error) {
  echo "Database connection failed. ";
  echo $conn->connect_error;
  exit;
}
$conn->set_charset($db["charset"] ?? "utf8");

$filter = build_ledger_filter_clause($types, $params);

if($filter != '') {
    $filter = "WHERE $filter";
}

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
        ";

$sqlselect = $sql;
$stmt = $conn->prepare($sql);

if(!$stmt) {
  echo "Prepare statement failed. ";
  echo $conn->error;
  echo $sql;
  exit;
}

if ($types !== '') {
    $stmt->bind_param($types, ...$params);
}

if(!$stmt->execute()) {
  echo "Query execution failed. ";
  echo $conn->error;
  echo $sql;
  exit;
}
$result = $stmt->get_result();

if (!$result) {
  echo "Get results failed. ";
  echo $stmt->error;
  exit;
}

$filename = buildCsvFilename($_GET, 'ledger', ['pg', 'ps', 'series']);
csv_headers($filename);

$out = fopen('php://output', 'w');

$fields = $result->fetch_fields();
$headers = array_map(fn($f) => $f->name, $fields);
fputcsv($out, $headers);

while ($row = $result->fetch_assoc()) {
    fputcsv($out, $row);
}
fclose($out);
exit;

} catch(mysqli_sql_exception $e) {
  error_log($e->getMessage());
  echo "SQL Exception. ";
  echo $e->getMessage();
  exit;
}