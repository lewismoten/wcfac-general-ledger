<?php
function bind_param_array(mysqli_stmt $stmt, string $types, array &$params): bool {
  $refs = [];
  foreach ($params as $k => &$v) { $refs[$k] = &$v; }
  array_unshift($refs, $types);
  return call_user_func_array([$stmt, 'bind_param'], $refs);
}