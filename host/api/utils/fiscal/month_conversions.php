<?php
declare(strict_types=1);
if (!defined('APP_BOOTSTRAPPED')) {
    throw new RuntimeException('Do not load fiscal utils directly; use bootstrap.php');
}

// calendar 1–12 -> fiscal 1–12 (July=1)
function calendar_month_as_fiscal_month(int $month): int {
    return ($month + 5) % 12 + 1;
}

// fiscal 1–12 (July=1) -> calendar 1–12
function fiscal_month_as_calendar_month(int $month): int {
    return ($month + 5) % 12 + 1;
}

function calendar_year_month_to_fiscal(int $year, int $month): array {
  // July(7) starts fiscal month 1 and belongs to FY = year + 1
  $fy = ($month >= 7) ? ($year + 1) : $year;
  $fm = calendar_month_as_fiscal_month($month); 
  return [$fy, $fm];
}
