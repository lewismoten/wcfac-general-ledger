<?php
declare(strict_types=1);
require_once __DIR__ . '/fiscal_year_from_date.php';

function current_fiscal_year(): int {
    return fiscal_year_from_date();
}