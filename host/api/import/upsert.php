<?php
declare(strict_types=1);

require_once __DIR__ . '/../../../utils/bootstrap.php';

json_headers('POST');

function require_string($v, string $name): string {
  if (!is_string($v) || trim($v) === '') throw new RuntimeException("Missing/invalid: {$name}");
  return trim($v);
}

function require_hash($v, string $name): string {
  $s = require_string($v, $name);
  if (!preg_match('/^[a-f0-9]{64}$/i', $s)) throw new RuntimeException("Invalid hash for: {$name}");
  return strtolower($s);
}

function bind_params(mysqli_stmt $stmt, string $types, array $values): void {
  $refs = [];
  foreach ($values as $k => $v) $refs[$k] = &$values[$k];
  array_unshift($refs, $types);
  if (!call_user_func_array([$stmt, 'bind_param'], $refs)) {
    throw new RuntimeException('bind_param failed: ' . $stmt->error);
  }
}

function norm_nullable_string($v): ?string {
  if ($v === null) return null;
  if (!is_string($v) && !is_numeric($v)) return null;
  $s = trim((string)$v);
  return $s === '' ? null : $s;
}

function norm_nullable_decimal($v): ?string {
  // bind as string; MySQL will coerce to DECIMAL
  if ($v === null) return null;
  if (is_string($v)) $v = trim($v);
  if ($v === '') return null;
  if (!is_numeric($v)) return null;
  return (string)$v;
}

function norm_nullable_date($v): ?string {
  // expect "YYYY-MM-DD" from your Node pre-normalization
  $s = norm_nullable_string($v);
  if ($s === null) return null;
  if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $s)) return null;
  return $s;
}

try {
  $config = require __DIR__ . "/../../../config.php";
  $conn = db_connect($config["db"]);

  $body = read_json_body();
  $rows = $body['rows'] ?? null;
  if (!is_array($rows) || count($rows) === 0) json_error(400, 'rows must be a non-empty array');

  $returnRows = $body['return_rows'] ?? false;

  // Normalize incoming payload
  $incoming = [];
  $contentHashes = [];

  foreach ($rows as $i => $r) {
    if (!is_array($r)) throw new RuntimeException("Row {$i} must be an object");
    $content_hash = require_hash($r['content_hash'] ?? null, 'content_hash');
    $anchor_hash  = require_hash($r['anchor_hash'] ?? null, 'anchor_hash');

    $data = $r['data'] ?? null;
    if (!is_array($data)) throw new RuntimeException("Row {$i} missing data object");

    $incoming[] = [
      'content_hash' => $content_hash,
      'anchor_hash'  => $anchor_hash,
      'po_no'        => norm_nullable_string($data['po_no'] ?? null),
      'vend_no'      => norm_nullable_string($data['vend_no'] ?? null),
      'vendor_name'  => norm_nullable_string($data['vendor_name'] ?? null),
      'invoice_no'   => norm_nullable_string($data['invoice_no'] ?? null),
      'invoice_date' => norm_nullable_date($data['invoice_date'] ?? null),
      'account_no'   => norm_nullable_string($data['account_no'] ?? null),
      'acct_pd'      => norm_nullable_string($data['acct_pd'] ?? null),
      'net_amount'   => norm_nullable_decimal($data['net_amount'] ?? null),
      'check_no'     => norm_nullable_string($data['check_no'] ?? null),
      'check_date'   => norm_nullable_date($data['check_date'] ?? null),
      'description'  => norm_nullable_string($data['description'] ?? null),
      'batch'        => norm_nullable_string($data['batch'] ?? null),
    ];

    $contentHashes[] = $content_hash;
  }

  // Lookup observed_id by content_hash (chunked)
  $observedIdByContent = [];
  foreach (chunk(array_values(array_unique($contentHashes)), 400) as $chChunk) {
    $placeholders = implode(',', array_fill(0, count($chChunk), '?'));
    $sql = "SELECT id, content_hash FROM ap308_observed WHERE content_hash IN ($placeholders)";
    $stmt = $conn->prepare($sql);
    if (!$stmt) throw new RuntimeException('Prepare failed: ' . $conn->error);

    $types = str_repeat('s', count($chChunk));
    $vals = $chChunk;
    bind_params($stmt, $types, $vals);

    if (!$stmt->execute()) throw new RuntimeException('Execute failed: ' . $stmt->error);

    $res = $stmt->get_result();
    while ($row = $res->fetch_assoc()) {
      $observedIdByContent[strtolower($row['content_hash'])] = (int)$row['id'];
    }
    $stmt->close();
  }

  $conn->begin_transaction();

  $counts = [
    'received' => count($incoming),
    'upserted' => 0,
    'skipped_missing_observed' => 0,
  ];

  $details = [];

  // Upsert into ap308_lines (chunked multi-row)
  foreach (chunk($incoming, 300) as $rowsChunk) {
    $valuesSql = [];
    $types = '';
    $vals = [];

    $kept = 0;

    foreach ($rowsChunk as $r) {
      $obsId = $observedIdByContent[$r['content_hash']] ?? null;
      if ($obsId === null) {
        $counts['skipped_missing_observed']++;
        if ($returnRows) {
          $details[] = ['content_hash' => $r['content_hash'], 'status' => 'skipped_missing_observed'];
        }
        continue;
      }

      $kept++;
      $valuesSql[] = "(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
      $types .= "isssssssssssssss";

      array_push(
        $vals,
        $obsId,                 // i
        $r['anchor_hash'],      // s
        $r['content_hash'],     // s
        $r['po_no'],            // s
        $r['vend_no'],          // s
        $r['vendor_name'],      // s
        $r['invoice_no'],       // s
        $r['invoice_date'],     // s (YYYY-MM-DD or null)
        $r['account_no'],       // s
        $r['acct_pd'],          // s
        $r['net_amount'],       // s (decimal as string or null)
        $r['check_no'],         // s
        $r['check_date'],       // s
        $r['description'],      // s
        $r['batch']             // s
      );
    }

    if ($kept === 0) continue;

    $sqlUpsert = "
      INSERT INTO ap308_lines
        (observed_id, anchor_hash, content_hash, po_no, vend_no, vendor_name, invoice_no, invoice_date,
         account_no, acct_pd, net_amount, check_no, check_date, description, batch)
      VALUES " . implode(',', $valuesSql) . "
      ON DUPLICATE KEY UPDATE
        anchor_hash = VALUES(anchor_hash),
        po_no = VALUES(po_no),
        vend_no = VALUES(vend_no),
        vendor_name = VALUES(vendor_name),
        invoice_no = VALUES(invoice_no),
        invoice_date = VALUES(invoice_date),
        account_no = VALUES(account_no),
        acct_pd = VALUES(acct_pd),
        net_amount = VALUES(net_amount),
        check_no = VALUES(check_no),
        check_date = VALUES(check_date),
        description = VALUES(description),
        batch = VALUES(batch)
    ";

    $stmtUp = $conn->prepare($sqlUpsert);
    if (!$stmtUp) throw new RuntimeException('Prepare failed: ' . $conn->error);

    bind_params($stmtUp, $types, $vals);
    if (!$stmtUp->execute()) throw new RuntimeException('Execute failed: ' . $stmtUp->error);

    $counts['upserted'] += $kept;
    $stmtUp->close();
  }

  $conn->commit();

  $payload = ['ok' => true, 'counts' => $counts];
  if ($returnRows) $payload['rows'] = $details;

  json_out(200, $payload);

} catch (Throwable $e) {
  if (isset($conn) && $conn instanceof mysqli) {
    try { $conn->rollback(); } catch (Throwable $ignored) {}
  }
  json_error(400, $e->getMessage());
}
