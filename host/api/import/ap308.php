<?php
declare(strict_types=1);

require_once __DIR__ . '/../utils/bootstrap.php';

$config = require __DIR__ . "/../config.php";

$file_settings = $config["files"];

$MAX_BYTES = $file_settings["max_mb"] * 1024 * 1024;
$UPLOAD_DIR = __DIR__ . "/../" . $file_settings['dir'];
$INDEX_PATH = $UPLOAD_DIR . '/index.json';

ensure_dir($UPLOAD_DIR);

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  echo "Method not supported";
  exit;
}
if (!isset($_FILES['csv']) || !is_array($_FILES['csv'])) {
  echo "No file uploaded.";
  exit;
}

$f = $_FILES['csv'];

if(($f['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
  echo "Upload failed (error code: " . (int)$f['error'] . ").";
  exit;
}

$size = (int)($f['size'] ?? 0);
if ($size <= 0) {
  echo "Uploaded file is empty.";
  exit;
}

if ($size > $MAX_BYTES) {
  echo "File too large. Max is " . ($MAX_BYTES / 1024 / 1024) . "MB.";
  exit;
}

$tmpPath = (string)($f['tmp_name'] ?? '');
if ($tmpPath === '' || !is_uploaded_file($tmpPath)) {
  echo "Invalid upload.";
  exit;
}

$origName = safe_original_name((string)($f['name'] ?? 'upload.csv'), 'upload.csv');
$ext = strtolower(pathinfo($origName, PATHINFO_EXTENSION));
if ($ext !== 'csv') {
  echo "File must have a .csv extension.";
  exit;
} 
if (function_exists('finfo_open') && $tmpPath !== '' && is_file($tmpPath)) {
  $fi = finfo_open(FILEINFO_MIME_TYPE);
  if ($fi) {
    $mime = (string)finfo_file($fi, $tmpPath);
    finfo_close($fi);
    $allowed = ['text/plain','text/csv','application/csv','application/vnd.ms-excel'];
    if ($mime !== '' && !in_array($mime, $allowed, true)) {
      echo "Unexpected file type ($mime). Please upload a CSV.";
      exit;
    }
  }
}

$now = new DateTimeImmutable('now', new DateTimeZone('America/New_York')); // change if you want server tz
$year = $now->format('Y');
$folder = $UPLOAD_DIR . DIRECTORY_SEPARATOR . $year;
ensure_dir($folder);
$stampForName = $now->format('Y-m-d His');   // YYYY-MM-DD HHMMSS (no colon)
$uploadedTs   = $now->format('Y-m-d H:i:s'); // for index "uploaded" field
$rid = random_id(8);
$finalFileName = sprintf('%s %s.csv', $stampForName, $rid);
$relativePath = $year . '/' . $finalFileName;
$absolutePath = $folder . DIRECTORY_SEPARATOR . $finalFileName;

$fhCheck = fopen($tmpPath, 'rb');
if ($fhCheck === false) {
  echo "Unable to open uploaded file for validation.";
  exit;
} else {
  $first6 = fread($fhCheck, 6);
  fclose($fhCheck);
  if ($first6 !== "AP308,") {
    echo "Invalid file format. File must be an AP308 export.";
    exit;
  }
}

if (!move_uploaded_file($tmpPath, $absolutePath)) {
  echo "Failed to save uploaded file.";
  exit;
}
@chmod($absolutePath, 0640);
$sha256 = hash_file('sha256', $absolutePath);
if ($sha256 === false) {
  @unlink($absolutePath);
  echo "Failed to compute sha256.";
  exit;
}
if (!file_exists($INDEX_PATH)) {
  $init = @file_put_contents($INDEX_PATH, "[]\n", LOCK_EX);
  if ($init === false) {
    echo "Failed to initialize index.json";
    exit;
  }
  @chmod($INDEX_PATH, 0640);
}
$fh = fopen($INDEX_PATH, 'c+');
if ($fh === false) {
  @unlink($absolutePath);
  echo "Failed to open index.json";
  exit;
}
try {
  if (!flock($fh, LOCK_EX)) {
    @unlink($absolutePath);
    throw new RuntimeException("Failed to lock index.json");
  }
  $index = read_index_locked($INDEX_PATH, $fh);
  $index[] = [
    'path'     => $relativePath,
    'name'     => $origName,
    'type'     => 'ap308',
    'hash'     => $sha256,
    'size'     => $size,
    'uploaded' => $uploadedTs,
  ];
  write_index_locked($fh, $index);
  flock($fh, LOCK_UN);
} finally {
  fclose($fh);
}
// -------[ We are now uploaded]
echo "uploaded<br>";
// -------[ We are now uploaded]

$allowedNonDigitTokens = ['AP308', 'P/O', 'NO.'];

$csv = open_csv($absolutePath);
$csv->rewind();
$headerRow = $csv->fgetcsv();
if (!is_array($headerRow)) {
  echo "Failed to read CSV header.";
  exit;
}
$header = array_map(
  fn($v) => is_string($v) ? trim($v) : (is_null($v) ? '' : (string)$v),
  $headerRow
);
$colCount = count($header);
$rowCount = 0;
$rowNumber = 0;
$minCheckTs = null;
$maxCheckTs = null;
$minPaid = null;
$maxPaid = null;

$corruptedCount = 0;

$sql = sql('ap308_import', 'ledger');
$types = 'iisss'.'sssii'.'iiiii'.'ssiss'.'i';

while (!$csv->eof()) {
  if($corruptedCount>=10) break;

  $row = $csv->fgetcsv();
  if (!is_array($row)) continue;
  $rowNumber++;
  if($rowNumber % 10000 === 0) {
    echo "Processing row ${rowNumber} ...<br>";
  }
  $allEmpty = true;
  foreach ($row as $cell) {
    if ($cell !== null && trim((string)$cell) !== '') { $allEmpty = false; break; }
  }
  if ($allEmpty) continue;

  $row = array_slice(array_pad($row, $colCount, ''), 0, $colCount);

  // 1: Purchase Order Number
  $po = trim((string)($row[0] ?? ''));
  if(in_array($po, $allowedNonDigitTokens, true)) continue;
  if($po === '') continue;

  $rowCount++;

  if (!ctype_digit($po)) {
    $corruptedCount++;
    echo "<li>Row ${rowNumber}: Invalid Purchase Order Number \"" . htmlspecialchars($po, ENT_QUOTES, 'UTF-8')."\"</li>";
    continue;
  }

  // 2: Vendor Number
  $vendorNo = trim((string)($row[1] ?? ''));
  if($vendorNo === '') {
    $corruptedCount++;
    echo "<li>Row ${rowNumber}: Missing Vendor Number.</li>";
    continue;
  }
  if (!ctype_digit($vendorNo)) {
    $corruptedCount++;
    echo "<li>Row ${rowNumber}: Invalid Vendor Number \"" . htmlspecialchars($vendorNo, ENT_QUOTES, 'UTF-8')."\"</li>";
    continue;
  }

  // 3: Vendor Name
  $vendorName = trim((string)($row[2] ?? ''));
  if($vendorName === '') {
    $corruptedCount++;
    echo "<li>Row ${rowNumber}: Missing Vendor Name.</li>";
    continue;
  }

  // 4: Invoice Number
  $invoiceNo = trim((string)($row[3] ?? ''));
  if($invoiceNo === '') {
    $corruptedCount++;
    echo "<li>Row ${rowNumber}: Missing Invoice Number.</li>";
    continue;
  }
  $invoiceParts = explode('-', preg_replace('/[-\s]+/', '-', $invoiceNo));
  $invoiceParts = array_pad($invoiceParts, 3, '');
  $invoiceNo1 = $invoiceParts[0];
  $invoiceNo2 = $invoiceParts[1];
  $invoiceNo3 = $invoiceParts[2];

  // 5: Invoice Date
  $invoiceDateStr = trim((string)($row[4] ??''));
  if($invoiceDateStr === '') {
    $corruptedCount++;
    echo "<li>Row ${rowNumber}: Invoice Date Missing</li>";
    continue;
  }
  $invoiceDate = DateTimeImmutable::createFromFormat('n/j/Y', $invoiceDateStr);
  $errs = DateTimeImmutable::getLastErrors();
  if ($invoiceDate === false || ($errs['warning_count'] ?? 0) > 0 || ($errs['error_count'] ?? 0) > 0) {
    $corruptedCount++;
    echo "<li>Row ${rowNumber}: Invoice Date Invalid \"" . htmlspecialchars($invoiceDateStr, ENT_QUOTES, 'UTF-8')."\"</li>";
    continue;
  }
  $invoiceDate = $invoiceDate->setTime(0, 0, 0);

  // 6: Account No
  $account = (string)($row[5] ?? '');
  $account = preg_replace('/\s+/', ' ', $account);
  $re = '/^\s*' .             // leading spaces before fund
      '(\d{1,7})\s*' .        // fund (1-7 digits), allow spaces around dash
      '-\s*(\d{6})\s*' .      // dept (6 digits)
      '-\s*(\d{4})\s*' .      // obj (4 digits)
      '-\s*(\d{1,3})?\s*' .   // project: digits + trailing spaces OR blank spaces
      '-\s*(\d{1,3})?\s*' .   // sub1
      '-\s*(\d{1,3})?\s*$' .  // sub2
      '/';
  if (!preg_match($re, $account, $parts)) {
    $corruptedCount++;
    echo "<li>Row {$rowNumber}: Account No Invliad \"" . htmlspecialchars($account, ENT_QUOTES, 'UTF-8')."\"</li>";
    continue;
  }
  $firstPadded = str_pad($parts[1], 4, '0', STR_PAD_LEFT);
  $accountRe = (int)$firstPadded[0];

  $account_fund = $parts[1];//1-7
  $account_dep = $parts[2];//6
  $account_no = $parts[3];//4
  $account_project = $parts[4] ?? '';//0-3
  $account_sub1 = $parts[5] ?? '';//0-3
  $account_sub2 = $parts[6] ?? '';//0-3

  $ol1 = $ol1Func = $ol2 = null;
  if($accountRe === 4) {
    $major = str_pad((string)$account_fund, 5, '0', STR_PAD_LEFT);
    $ol1 = (int)($major[0] ?? 0);
    $ol1Func = (int)($major[1] ?? 0);
    $ol2 = (int)($major[2] ?? 0);
  }

  // 7: Account Paid
  $paidStr = trim((string)($row[6] ?? ''));
  if($paidStr === '') {
    $corruptedCount++;
    echo "<li>Row ${rowNumber}: Missing Account Paid</li>";
    continue;
  }
  if (!preg_match('/^\d{4}\/\d{2}$/', $paidStr)) {
    $corruptedCount++;
    echo "<li>Row ${rowNumber}: Account Paid Invalid \"" . htmlspecialchars($paidStr, ENT_QUOTES, 'UTF-8')."\"</li>";
    continue;
  }
  [$paidYear, $paidMonth] = explode('/', $paidStr);
  $paidYearInt = (int)$paidYear;
  $paidMonthInt = (int)$paidMonth;
  if ($paidMonthInt < 1 || $paidMonthInt > 12) {
    $corruptedCount++;
    echo "<li>Row ${rowNumber}: Account Paid invalid month \"" . htmlspecialchars($paidStr, ENT_QUOTES, 'UTF-8')."\"</li>";
    continue;
  }
  $ymInt = ($paidYearInt * 100) + $paidMonthInt;
  $minPaid = ($minPaid === null) ? $ymInt : min($minPaid, $ymInt);
  $maxPaid = ($maxPaid === null) ? $ymInt : max($maxPaid, $ymInt);

  // 8: Net Amount
  $netRaw = trim((string)($row[7] ?? ''));
  if ($netRaw === '') {
    $corruptedCount++;
    echo "<li>Row ${rowNumber}: Net Amount Missing</li>";
    continue;
  }
  if (!preg_match('/^-?\d+(?:\.\d{1,2})?$/', $netRaw)) {
    $corruptedCount++;
    echo "<li>Row ${rowNumber}: Net Amount Invalid \"" . htmlspecialchars($netRaw, ENT_QUOTES, 'UTF-8')."\"</li>";
    continue;
  }
  // 9: Check Number
  $checkNo = trim((string)($row[8] ?? ''));
  if($checkNo === '') {
    $corruptedCount++;
    echo "<li>Row ${rowNumber}: Missing Check Number.</li>";
    continue;
  }
  if (!ctype_digit($checkNo)) {
    $corruptedCount++;
    echo "<li>Row ${rowNumber}: Invalid Check Number \"" . htmlspecialchars($checkNo, ENT_QUOTES, 'UTF-8')."\"</li>";
    continue;
  }

  // 10: Check Date
  $checkDateString = trim((string)($row[9] ??''));
  if($checkDateString === '') {
    $corruptedCount++;
    echo "<li>Row ${rowNumber}: Check Date Missing</li>";
    continue;
  }
  $checkDate = DateTimeImmutable::createFromFormat('n/j/Y', $checkDateString);
  $errs = DateTimeImmutable::getLastErrors();
  if ($checkDate === false || ($errs['warning_count'] ?? 0) > 0 || ($errs['error_count'] ?? 0) > 0) {
    $corruptedCount++;
    echo "<li>Row ${rowNumber}: Check Date Invalid \"" . htmlspecialchars($checkDateString, ENT_QUOTES, 'UTF-8')."\"</li>";
    continue;
  }
  $checkDate = $checkDate->setTime(0, 0, 0);
  $checkTs = $checkDate->getTimestamp();
  $minCheckTs = ($minCheckTs === null) ? $checkTs : min($minCheckTs, $checkTs);
  $maxCheckTs = ($maxCheckTs === null) ? $checkTs : max($maxCheckTs, $checkTs);

  // 11: Description
  $description = trim((string)($row[10] ??''));
  if($description === '') {
    $corruptedCount++;
    echo "<li>Row ${rowNumber}: Description Missing</li>";
    continue;
  }

  // 12: Batch
  $batch = trim((string)($row[11] ?? ''));
  if($batch === '') {
    $corruptedCount++;
    echo "<li>Row ${rowNumber}: Missing Batch</li>";
    continue;
  }
  if (!ctype_digit($batch)) {
    $corruptedCount++;
    echo "<li>Row ${rowNumber}: Invalid Batch \"" . htmlspecialchars($batch, ENT_QUOTES, 'UTF-8')."\"</li>";
    continue;
  }
    $paidMonthStr = str_pad((string)$paidMonthInt, 2, '0', STR_PAD_LEFT);
    $params = [
      nullable_int($po),
      nullable_int($vendorNo),
      nullable_str($vendorName),
      nullable_str($invoiceNo),
      nullable_str($invoiceNo1),

      nullable_str($invoiceNo2),
      nullable_str($invoiceNo3),
      nullable_dte($invoiceDate->format('Y-m-d')),
      nullable_int($accountRe),
      nullable_int($ol1),

      nullable_int($ol1Func),
      nullable_int($ol2),
      nullable_int($account_fund),
      nullable_int($account_dep),
      nullable_int($account_no),

      nullable_dte("${paidYearInt}-${paidMonthStr}-01"),
      nullable_mny($netRaw),
      nullable_int($checkNo),
      nullable_dte($checkDate->format('Y-m-d')),
      nullable_str($description),

      nullable_int($batch)
    ];
    // TODO: Run against database
}

if($corruptedCount > 0) {
  echo "File appears corrupted.<br>";
}
echo "Transactions: ${rowCount}<br>";

if ($minCheckTs === null || $maxCheckTs === null) {
  echo "No valid dates found.";
  exit;
}

$minDate = (new DateTimeImmutable('@' . $minCheckTs))->setTimezone(new DateTimeZone('America/New_York'))->format('Y-m-d');
$maxDate = (new DateTimeImmutable('@' . $maxCheckTs))->setTimezone(new DateTimeZone('America/New_York'))->format('Y-m-d');

echo "Min check date: {$minDate}<br>";
echo "Max check date: {$maxDate}<br>";

if ($minPaid !== null) {
  $minPaidStr = sprintf('%04d/%02d', intdiv($minPaid, 100), $minPaid % 100);
  $maxPaidStr = sprintf('%04d/%02d', intdiv($maxPaid, 100), $maxPaid % 100);

  echo "Account Paid Min: {$minPaidStr}<br>";
  echo "Account Paid Max: {$maxPaidStr}<br>";
}
// AP Reports exported by Fiscal Year (ACCT PD)
// AP Report 2013-2014.csv 2.6MB Paid: Jul'13-Jun'14 Checks: 2012-09-19 to 2014-10-22 [15,396]
// AP Report 2014-2015.csv 2.5MB Paid: Jul'14-Jun'15 Checks: 2014-05-21 to 2017-12-27 [14,622]
// AP Report 2015-2016.csv 2.5MB Paid: Jul'15-Jun'16 Checks: 2013-05-22 to 2016-08-17 [14,431]
// Note - some check dates were cut after the account was paid (re-issued?)