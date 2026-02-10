<?php
declare(strict_types=1);
require_once __DIR__ . '/fiscal_month_from_date.php';

function current_fiscal_month(): int {
    return fiscal_month_from_date();
}