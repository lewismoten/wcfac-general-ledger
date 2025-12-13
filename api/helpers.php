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

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
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