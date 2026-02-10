<?php
declare(strict_types=1);

function db_connect(array $db): mysqli
{
    $conn = new mysqli($db["host"], $db["user"], $db["pass"], $db["db"]);
    $conn->set_charset($db["charset"] ?? "utf8mb4");
    return $conn;
}
