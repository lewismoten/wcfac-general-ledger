<?php
declare(strict_types=1);
function fiscal_year_from_date(?DateTimeInterface $date = null): int {
    $date = $date ?? new DateTimeImmutable('now');
    $year  = (int) $date->format('Y');
    $month = (int) $date->format('n');
    return ($month >= 7) ? $year + 1 : $year;
}