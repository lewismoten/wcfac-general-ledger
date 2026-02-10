<?php
/**
 * Load a .sql file from /sql and return it as a string.
 * Usage: sql('financial_health_snapshot', 'by_department_month_vs_prior')
 * Usage Returns: Contents of /sql/financial_health_snapshot/by_department_month_vs_prior.sql
 */
function sql(string $folder, string $file): string {
  $full = realpath(__DIR__ . "/../../../sql/$folder/$file.sql");
  if ($full === false || !is_file($full)) {
    throw new RuntimeException("SQL file not found: sql/$folder/$file.sql");
  }
  $s = file_get_contents($full);
  if ($s === false) {
    throw new RuntimeException("Failed reading SQL file: sql/$folder/$file.sql");
  }
  return $s;
}