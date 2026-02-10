<?php
declare(strict_types=1);
if (!defined('APP_BOOTSTRAPPED')) {
    throw new RuntimeException('Do not load fiscal utils directly; use bootstrap.php');
}

function build_csv_filename(array $query, string $prefix = '', array $omit = []): string
{
    foreach ($omit as $k) {
        unset($query[$k]);
    }

    ksort($query);

    $parts = [];
    foreach ($query as $key => $value) {
        $safeKey = preg_replace('/[^a-z0-9_-]/i', '', (string) $key);
        if ($safeKey === '') continue;

        $values = is_array($value) ? $value : [$value];
        $clean = [];

        foreach ($values as $v) {
            $sv = preg_replace('/[^a-z0-9._-]/i', '', (string) $v);
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
