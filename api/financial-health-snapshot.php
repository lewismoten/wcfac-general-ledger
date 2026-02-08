<?php
require_once './helpers.php';
json_headers();
echo json_encode([ 
    "hello" => 'yello'
], JSON_PRETTY_PRINT);