<?php
declare(strict_types=1);
if (!defined('APP_BOOTSTRAPPED')) {
    throw new RuntimeException('Do not load fiscal utils directly; use bootstrap.php');
}

require_once __DIR__ . '/mysqli.php';
require_once __DIR__ . '/connect.php';
