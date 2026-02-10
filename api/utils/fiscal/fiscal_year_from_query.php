<?php
declare(strict_types=1);
require_once __DIR__ . '/fiscal_year_from_date.php';

function fiscal_year_from_query(
  string $param = 'fy', 
  int $min = 1995, 
  ?DateTimeInterface $now = null
):int {
  $now = $now ?? new DateTimeImmutable('now');
  $max = fiscal_year_from_date($now);
  $default = $max;
  return filter_input(
    INPUT_GET, 
    $param, 
    FILTER_VALIDATE_INT,
    [
      'options' => [
        'default' => $default,
        'min_range' => $min,
        'max_range' => $max
      ]
    ]
  ) ?? $default;
}