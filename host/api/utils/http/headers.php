<?php
declare(strict_types=1);
if (!defined('APP_BOOTSTRAPPED')) {
    throw new RuntimeException('Do not load fiscal utils directly; use bootstrap.php');
}

function common_headers(): void {
    header("Cache-Control: no-cache, no-store, must-revalidate");
    header("Pragma: no-cache");
    header("Expires: 0");
}

function json_headers(string $methods = 'GET'): void {
    common_headers();
    header("Content-Type: application/json; charset=UTF-8");
    header("Access-Control-Allow-Origin: *");
    header("Access-Control-Allow-Methods: $methods, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type");

    $method = $_SERVER['REQUEST_METHOD'] ?? '';

    if ($method === 'OPTIONS') {
        http_response_code(204);
        exit;
    }
    if (array_search($method, explode(', ', $methods), true) === false) {
        json_error(405, 'Method Not Allowed');
        exit;
    }
}

function json_out(int $code, array $payload): void {
  http_response_code($code);
  echo json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
  exit;
}
function json_error(int $code, array $message): void {
  json_out($code, ['ok' => false, 'error' => $message]);
}

function csv_headers(string $filename = ''): void {
    common_headers();
    header("Content-Type: text/csv; charset=UTF-8");
    if ($filename !== '') {
        header("Content-Disposition: attachment; filename=\"{$filename}\"");
    }
}
