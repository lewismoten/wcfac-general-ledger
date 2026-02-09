<?php
declare(strict_types=1);
if (!defined('APP_BOOTSTRAPPED')) {
    throw new RuntimeException('Do not load fiscal utils directly; use bootstrap.php');
}

require_once __DIR__ . '/month_conversions.php';
require_once __DIR__ . '/fiscal_to_calendar_range.php';

require_once __DIR__ . '/fiscal_year_from_date.php';
require_once __DIR__ . '/fiscal_month_from_date.php';
require_once __DIR__ . '/fiscal_year_from_query.php';
require_once __DIR__ . '/fiscal_month_from_query.php';