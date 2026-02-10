<?php
declare(strict_types=1);
function fiscal_month_from_date(?DateTimeInterface $date = null): int {
    $date  = $date ?? new DateTimeImmutable('now');
    $month = (int) $date->format('n');
    return calendar_month_as_fiscal_month($month);
}