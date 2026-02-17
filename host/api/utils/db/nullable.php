<?php

function nullable_str($v): ?string {
  if ($v === null) return null;
  $s = trim((string)$v);
  return $s === '' ? null : $s;
}
function nullable_int($v): ? int {
  if ($v === null) return null;
  $s = trim((string)$v);
  return ($s === '' ? null : (int)$s);
}
function nullable_mny($v): ?string {
  if ($v === null) return null;
  $s = trim((string)$v);
  return $s === '' ? null : $s; // keep as string for DECIMAL
}
function nullable_dte($v): ?string {
  if ($v === null) return null;
  $s = trim((string)$v);
  return $s === '' ? null : $s; // 'YYYY-MM-DD'
}
