<?php

function chunk(array $arr, int $size): array {
  $out = [];
  for ($i = 0; $i < count($arr); $i += $size) {
    $out[] = array_slice($arr, $i, $size);
  }
  return $out;
}