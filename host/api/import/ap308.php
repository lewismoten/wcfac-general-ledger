<?php
declare(strict_types=1);


$config = require __DIR__ . "/../config.php";

$file_settings = $config["files"];

$MAX_BYTES = $file_settings["max_mb"] * 1024 * 1024;
$UPLOAD_DIR = __DIR__ . "/../" . $file_settings['dir'];
$INDEX_PATH = $UPLOAD_DIR . '/index.json';

function ensure_dir(string $dir): void {
  if (!is_dir($dir)) {
    if (!mkdir($dir, 0750, true) && !is_dir($dir)) {
      echo "Failed to create directory: $dir";
      exit;
    }
  }
  if(!is_writable($dir)) {
    echo "Server error: uploads directory not writable.";
    exit;
  }
}

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

function safe_original_name(string $name): string {
  $base = basename($name);
  $base = preg_replace('/[^\w.\- ]+/u', '_', $base) ?? 'upload.csv';
  $base = trim($base);
  return $base !== '' ? $base : 'upload.csv';
}

function random_id(int $bytes = 8): string {
  return bin2hex(random_bytes($bytes)); // 16 hex chars for 8 bytes
}
function read_index_locked(string $indexPath, $fh): array {
  clearstatcache(true, $indexPath);
  $size = filesize($indexPath);
  if ($size === false || $size === 0) return [];

  rewind($fh);
  $json = stream_get_contents($fh);
  if ($json === false || trim($json) === '') return [];

  $data = json_decode($json, true);
  return is_array($data) ? $data : [];
}

function write_index_locked($fh, array $data): void {
  $json = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
  if ($json === false) {
    echo "Failed to encode index.json";
    exit;
  }
  rewind($fh);
  if (!ftruncate($fh, 0)) {
    echo "Failed to truncate index.json";
    exit;
  }
  if (fwrite($fh, $json . "\n") === false) {
    echo "Failed to write index.json";
    exit;
  }
  fflush($fh);
}

$origName = safe_original_name((string)($f['name'] ?? 'upload.csv'));
$ext = strtolower(pathinfo($origName, PATHINFO_EXTENSION));
if ($ext !== 'csv') $errors[] = "File must have a .csv extension.";
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
function open_csv(string $absPath): SplFileObject {
  if (!is_file($absPath)) {
    echo "CSV not found";
    exit;
  }
  if (!is_readable($absPath)) {
    echo "CSV not readable";
    exit;
  }

  $size = filesize($absPath);
  $f = new SplFileObject($absPath, 'rb');
  $f->setFlags(SplFileObject::READ_CSV | SplFileObject::SKIP_EMPTY);
  return $f;
}

$headers = [
  'PO NO.',
  'VEND. NO.',
  'VENDOR NAME',
  'INVOICE NO.',
  'INVOICE DATE',
  'ACCOUNT NO.',
  'ACCT PD',
  'NET AMOUNT',
  'CHECK NO.',
  'CHECK DATE',
  'DESCRIPTION',
  'BATCH',
];
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
$minTs = null;
$maxTs = null;

while (!$csv->eof()) {
  $row = $csv->fgetcsv();
  if (!is_array($row)) continue;
  $rowNumber++;
  $allEmpty = true;
  foreach ($row as $cell) {
    if ($cell !== null && trim((string)$cell) !== '') { $allEmpty = false; break; }
  }
  if ($allEmpty) continue;

  $row = array_slice(array_pad($row, $colCount, ''), 0, $colCount);
  $value = trim((string)($row[0] ?? ''));

  if(in_array($value, $allowedNonDigitTokens, true)) continue;
  if($value === '') continue;
  if (!ctype_digit($value)) {
    echo "File appears corrupted at row ${rowNumber}: Invalid P/O NO.";
    exit;
  }

  $checkDate = trim((string)($row[9] ??'')); // 8/21/2013
  if($checkDate === '') {
    echo "File appears corrupted at row ${rowNumber}: Invalid date";
    exit;
  }
  $dt = DateTimeImmutable::createFromFormat('n/j/Y', $checkDate);
  $errs = DateTimeImmutable::getLastErrors();
  if ($dt === false || ($errs['warning_count'] ?? 0) > 0 || ($errs['error_count'] ?? 0) > 0) {
    echo "Invalid date in row {$rowNumber}, column 10: " . htmlspecialchars($dateStr, ENT_QUOTES, 'UTF-8');
    exit;
  }
  $dt = $dt->setTime(0, 0, 0);
  $ts = $dt->getTimestamp();
  $minTs = ($minTs === null) ? $ts : min($minTs, $ts);
  $maxTs = ($maxTs === null) ? $ts : max($maxTs, $ts);

  $rowCount++;
}

echo "uploaded<br>";
echo "Rows: ${rowCoun}t<br>";

if ($minTs === null || $maxTs === null) {
  echo "No valid dates found.";
  exit;
}

$minDate = (new DateTimeImmutable('@' . $minTs))->setTimezone(new DateTimeZone('America/New_York'))->format('Y-m-d');
$maxDate = (new DateTimeImmutable('@' . $maxTs))->setTimezone(new DateTimeZone('America/New_York'))->format('Y-m-d');

echo "Min date: {$minDate}<br>";
echo "Max date: {$maxDate}<br>";