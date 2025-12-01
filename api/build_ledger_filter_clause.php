<?php
require_once './helpers.php';

function filter_num($name, $column, &$types, &$params) {
  $value_string = isset($_GET[$name]) ? $_GET[$name] : '';
  if(!is_filtered_multi($value_string)) return null;
  return filter_val($value_string, 'i', $column, $types, $params);
}
function filter_str($name, $column, &$types, &$params) {
  $value_string = isset($_GET[$name]) ? $_GET[$name] : '';
  if(!is_filtered_multi_s($value_string)) return null;
  return filter_val($value_string, 's', $column, $types, $params);
}
function filter_val($value_string, $type, $column, &$types, &$params) {
  $values = array_values(array_filter(
    array_map('trim', explode(',', $value_string)),
    'strlen'
  ));
  if($type === 'i') {
    $values = array_map('intval', $values);
  }
  if(!$values) return null;
  $count = count($values);
  $placeholders = implode(',', array_fill(0, count($values), '?'));
  $types .= str_repeat($type, count($values));
  $params = array_merge($params, $values);
  return $count === 1 ? "$column = ?" : "$column IN($placeholders)";
}
function build_ledger_filter_clause(&$types, &$params) {

  $filters = [];
  $filters[] = filter_num('fy', 
  "DATE_FORMAT(CHECK_DATE, '%Y') + 
    CASE WHEN DATE_FORMAT(CHECK_DATE, '%m') >= 7 THEN 1 ELSE 0 END", 
    $types, $params);
  $filters[] = filter_num('re', 'LEDGER.ACCOUNT_RE', $types, $params);
  $filters[] = filter_num('ol1', 'LEDGER.ACCOUNT_OL1', $types, $params);
  $filters[] = filter_num('ol1Func', 'LEDGER.ACCOUNT_OL1_FUNC', $types, $params);
  $filters[] = filter_num('ol2', 'LEDGER.ACCOUNT_OL2', $types, $params);
  $filters[] = filter_num('dept', 'LEDGER.ACCOUNT_DEPT', $types, $params);
  $filters[] = filter_num('acct', 'LEDGER.ACCOUNT_NO', $types, $params);
  $filters[] = filter_num('vend', 'LEDGER.VENDOR_ID', $types, $params);
  $filters[] = filter_num('po', 'LEDGER.PURCHASE_ORDER', $types, $params);
  $filters[] = filter_str('inv', 'LEDGER.INVOICE_NO', $types, $params);
  $filters[] = filter_str('inv1', 'LEDGER.INVOICE_NO_1', $types, $params);
  $filters[] = filter_str('inv2', 'LEDGER.INVOICE_NO_2', $types, $params);
  $filters[] = filter_str('inv3', 'LEDGER.INVOICE_NO_3', $types, $params);

  return implode(' AND ', array_values(array_filter($filters, 'is_string')));
}