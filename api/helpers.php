<?php
error_reporting(E_ALL);
ini_set('display_errors', '0');
mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);

function common_headers() {
    header("Cache-Control: no-cache, no-store, must-revalidate");
    header("Pragma: no-cache");
    header("Expires: 0");
}
function json_headers() {
    common_headers();
    header("Content-Type: application/json; charset=UTF-8");
    header("Access-Control-Allow-Origin: *");
    header("Access-Control-Allow-Methods: GET, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type");
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(204);
        exit;
    }
}
function csv_headers($filename="") {
    common_headers();
    header("Content-Type: text/csv; charset=UTF-8");
    header("Content-Disposition: attachement; filename=$filename");
}

function buildCsvFilename(array $query, string $prefix = '', $omit = []): string
{
    foreach ($omit as $k) unset($query[$k]);
    ksort($query);
    $parts = [];
    foreach ($query as $key => $value) {
        $safeKey = preg_replace('/[^a-z0-9_-]/i', '', (string)$key);
        if ($safeKey === '') continue;
        $values = is_array($value) ? $value : [$value];
        $clean = [];
        foreach ($values as $v) {
            $sv = preg_replace('/[^a-z0-9._-]/i', '', (string)$v);
            if ($sv !== '') $clean[] = $sv;
        }
        if (!$clean) continue;
        sort($clean);
        $safeValue = implode(',', $clean);
        $parts[] = "{$safeKey}-{$safeValue}";
    }
    $stamp = date('YmdHis');
    $base  = $prefix . ($parts ? '_' . implode('_', $parts) : '') . "[{$stamp}]";
    if (strlen($base) > 180) {
        $hash = substr(sha1($base), 0, 10);
        $base = substr($base, 0, 160) . "_{$hash}";
    }
    return $base . '.csv';
}

function is_filtered($value) {
   return $value  !== '' && $value !== null && is_numeric($value) && $value != '-1';
}
function is_filtered_s($value) {
   return $value  !== '' && $value !== null && $value != '-1';
}
function is_filtered_multi($values) {
   if($values  == '' || $values == null || $values == '-1') return false;
   if(is_numeric($values)) return true;
   $parts = explode(',', $values);
    foreach ($parts as $p) {
        $p = trim($p);
        if ($p === '' || !is_numeric($p)) {
            return false;
        }
    }
    return true;
}
function is_filtered_multi_s($values) {
   if($values  == '' || $values == null || $values == '-1') return false;
   if(is_numeric($values)) return true;
   $parts = explode(',', $values);
    foreach ($parts as $p) {
        $p = trim($p);
        if ($p === '') {
            return false;
        }
    }
    return true;
}