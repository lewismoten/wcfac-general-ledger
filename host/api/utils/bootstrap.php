<?php
declare(strict_types=1);
define('APP_BOOTSTRAPPED', true);

error_reporting(E_ALL);
ini_set('display_errors', '0');

require_once __DIR__ . '/fiscal/_load.php';
require_once __DIR__ . '/db/_load.php';
require_once __DIR__ . '/http/_load.php';
require_once __DIR__ . '/output/csv.php';
require_once __DIR__ . '/params/sentinels.php';
require_once __DIR__ . '/params/filters.php';
require_once __DIR__ . '/arrays.php'