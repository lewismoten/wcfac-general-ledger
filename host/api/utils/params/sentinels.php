<?php
declare(strict_types=1);
if (!defined('APP_BOOTSTRAPPED')) {
    throw new RuntimeException('Do not load fiscal utils directly; use bootstrap.php');
}

/**
 * Returns true if the value represents "no selection / ignore"
 */
function is_sentinel($value): bool
{
    if ($value === null) return true;

    if (is_string($value)) {
        $value = trim($value);
        return $value === '' || $value === '-1';
    }

    return false;
}