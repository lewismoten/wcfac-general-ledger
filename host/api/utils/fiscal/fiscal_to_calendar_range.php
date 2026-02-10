<?php
declare(strict_types=1);

require_once __DIR__ . '/month_conversions.php';

/**
 * Given fiscal year (FY) and fiscal month (FM 1-12 where 1=July),
 * return calendar year + calendar month.
 */
function fiscal_year_month_to_calendar_year_month(int $fy, int $fm): array
{
    $calendarMonth = fiscal_month_as_calendar_month($fm); // 1-12

    // FY 2026 FM 1..6 (Jul-Dec) => calendar year 2025
    // FY 2026 FM 7..12 (Jan-Jun) => calendar year 2026
    $calendarYear = ($fm <= 6) ? ($fy - 1) : $fy;

    return [$calendarYear, $calendarMonth];
}

/**
 * Beginning of month (YYYY-MM-01) for given fiscal period.
 */
function fiscal_year_month_to_bom(int $fy, int $fm): string
{
    [$y, $m] = fiscal_year_month_to_calendar_year_month($fy, $fm);
    return sprintf('%04d-%02d-01', $y, $m);
}

/**
 * Beginning of next month (exclusive end boundary), based on fiscal period.
 * Use this for WHERE date >= start AND date < end
 */
function fiscal_year_month_to_next_bom(int $fy, int $fm): string
{
    [$y, $m] = fiscal_year_month_to_calendar_year_month($fy, $fm);

    $dt = new DateTimeImmutable(sprintf('%04d-%02d-01', $y, $m));
    $next = $dt->modify('first day of next month');

    return $next->format('Y-m-d');
}

/**
 * End of month (YYYY-MM-DD). Only use this if you *must* do BETWEEN.
 */
function fiscal_year_month_to_eom(int $fy, int $fm): string
{
    [$y, $m] = fiscal_year_month_to_calendar_year_month($fy, $fm);

    $dt = new DateTimeImmutable(sprintf('%04d-%02d-01', $y, $m));
    $eom = $dt->modify('last day of this month');

    return $eom->format('Y-m-d');
}
