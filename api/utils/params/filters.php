<?php
declare(strict_types=1);
if (!defined('APP_BOOTSTRAPPED')) {
    throw new RuntimeException('Do not load fiscal utils directly; use bootstrap.php');
}

function is_valid_numeric_filter($value): bool
{
    if (is_sentinel($value)) return false;
    return is_numeric($value);
}
function is_valid_string_filter($value): bool
{
    return !is_sentinel($value);
}

function parse_numeric_filter_list($value): ?array
{
    if (is_sentinel($value)) return null;

    if (is_numeric($value)) {
        return [(int) $value];
    }

    $parts = explode(',', (string) $value);
    $out = [];

    foreach ($parts as $p) {
        $p = trim($p);
        if ($p === '' || !is_numeric($p)) {
            return null;
        }
        $out[] = (int) $p;
    }

    return $out ?: null;
}

function parse_string_filter_list($value): ?array
{
    if (is_sentinel($value)) return null;

    if (is_numeric($value)) {
        return [(string) $value];
    }

    $parts = explode(',', (string) $value);
    $out = [];

    foreach ($parts as $p) {
        $p = trim($p);
        if ($p === '') return null;
        $out[] = $p;
    }

    return $out ?: null;
}
