<?php
declare(strict_types=1);
require_once __DIR__ . '/fiscal_month_from_date.php';

function fiscal_month_from_query(
    string $param = 'fm',
    ?DateTimeInterface $now = null
): int {
    $now = $now ?? new DateTimeImmutable('now');
    $default = fiscal_month_from_date($now);

    return filter_input(
        INPUT_GET,
        $param,
        FILTER_VALIDATE_INT,
        [
            'options' => [
                'default'   => $default,
                'min_range' => 1,
                'max_range' => 12,
            ],
        ]
    ) ?? $default;
}