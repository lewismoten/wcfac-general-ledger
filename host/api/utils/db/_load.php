<?php
declare(strict_types=1);
if (!defined('APP_BOOTSTRAPPED')) {
    throw new RuntimeException('Do not load db utils directly; use bootstrap.php');
}

require_once __DIR__ . '/mysqli.php';
require_once __DIR__ . '/connect.php';
require_once __DIR__ . '/sql.php';
require_once __DIR__ . '/nullable.php';
require_once __DIR__ . '/bind_param_array.php';
