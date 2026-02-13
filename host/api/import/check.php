<?php
declare(strict_types=1);

require_once __DIR__ . '/../../utils/bootstrap.php';

json_headers('POST');

function require_string($v, string $name): string {
  if (!is_string($v) || trim($v) === '') {
    throw new RuntimeException("Missing/invalid: {$name}");
  }
  return trim($v);
}

function require_int($v, string $name): int {
  if (is_int($v)) return $v;
  if (is_string($v) && ctype_digit($v)) return (int)$v;
  throw new RuntimeException("Missing/invalid: {$name}");
}

function require_hash($v, string $name): string {
  $s = require_string($v, $name);
  if (!preg_match('/^[a-f0-9]{64}$/i', $s)) {
    throw new RuntimeException("Invalid hash for: {$name}");
  }
  return strtolower($s);
}

function sha256hex(string $s): string {
  return hash('sha256', $s);
}

function bind_params(mysqli_stmt $stmt, string $types, array $values): void {
  $refs = [];
  foreach ($values as $k => $v) {
    $refs[$k] = &$values[$k];
  }
  array_unshift($refs, $types);
  if (!call_user_func_array([$stmt, 'bind_param'], $refs)) {
    throw new RuntimeException('bind_param failed: ' . $stmt->error);
  }
}

try {

  $config = require __DIR__ . "/../../config.php";
  $conn = db_connect($config["db"]);

  $body = read_json_body();
  $returnRows = $body['return_rows'] ?? false;
  $sourceFolder = require_string($body['source_folder'] ?? null, 'source_folder');
  $sourceFile   = require_string($body['source_file'] ?? null, 'source_file');

  $rows = $body['rows'] ?? null;
  if (!is_array($rows) || count($rows) === 0) {
    json_error(400, 'rows must be a non-empty array');
  }

  // Normalize incoming rows
  $incoming = [];
  foreach ($rows as $i => $r) {
    if (!is_array($r)) throw new RuntimeException("Row {$i} must be an object");

    $stableRowNum = require_int($r['stable_row_num'] ?? $r['source_row_num'] ?? null, 'stable_row_num');
    if ($stableRowNum <= 0) throw new RuntimeException("Row {$i}: stable_row_num must be > 0");

    $anchorHash  = require_hash($r['anchor_hash'] ?? null, 'anchor_hash');
    $contentHash = require_hash($r['content_hash'] ?? null, 'content_hash');

    $rowKey = $r['source_row_key'] ?? sha256hex($sourceFolder . '|' . $sourceFile . '|' . (string)$stableRowNum);
    if (!preg_match('/^[a-f0-9]{64}$/i', (string)$rowKey)) {
      throw new RuntimeException("Row {$i}: invalid source_row_key");
    }
    $rowKey = strtolower((string)$rowKey);

    $incoming[] = [
      'stable_row_num' => $stableRowNum,
      'anchor_hash' => $anchorHash,
      'content_hash' => $contentHash,
      'source_row_key' => $rowKey,
    ];
  }

  $existingByNum = [];
  $nums = array_values(array_unique(array_map(fn($r) => (int)$r['stable_row_num'], $incoming)));
  sort($nums);

  $conn->begin_transaction();

foreach (chunk($nums, 400) as $numsChunk) {
  $placeholders = implode(',', array_fill(0, count($numsChunk), '?'));

  $sqlSel = "
    SELECT id, stable_row_num, content_hash
    FROM ap308_manifest
    WHERE source_folder = ?
      AND source_file = ?
      AND stable_row_num IN ($placeholders)
  ";

  $stmtSel = $conn->prepare($sqlSel);
  if (!$stmtSel) throw new RuntimeException('Prepare failed: ' . $conn->error);
  $types = 'ss' . str_repeat('i', count($numsChunk));
  $vals  = array_merge([$sourceFolder, $sourceFile], $numsChunk);
  bind_params($stmtSel, $types, $vals);

  if (!$stmtSel->execute()) throw new RuntimeException('Select execute failed: ' . $stmtSel->error);

  $res = $stmtSel->get_result();
  while ($row = $res->fetch_assoc()) {
    $existingByNum[(int)$row['stable_row_num']] = $row;
  }
  $stmtSel->close();
}

  foreach (chunk($incoming, 400) as $rowsChunk) {
  $valuesSql = [];
  $types = '';
  $vals = [];

  foreach ($rowsChunk as $r) {
    $valuesSql[] = "(?, ?, ?, ?, ?, ?)";
    $types .= "ssisss";
    array_push(
      $vals,
      $sourceFolder,
      $sourceFile,
      (int)$r['stable_row_num'],
      $r['anchor_hash'],
      $r['content_hash'],
      $r['source_row_key']
    );
  }

  $sqlUpsert = "
    INSERT INTO ap308_manifest
      (source_folder, source_file, stable_row_num, anchor_hash, content_hash, source_row_key)
    VALUES " . implode(',', $valuesSql) . "
    ON DUPLICATE KEY UPDATE
      anchor_hash = VALUES(anchor_hash),
      content_hash = VALUES(content_hash),
      source_row_key = VALUES(source_row_key),
      last_seen_at = CURRENT_TIMESTAMP,
      seen_count = seen_count + 1,
      is_active = 1
  ";

  $stmtUp = $conn->prepare($sqlUpsert);
  if (!$stmtUp) throw new RuntimeException('Prepare failed: ' . $conn->error);

  bind_params($stmtUp, $types, $vals);
  if (!$stmtUp->execute()) throw new RuntimeException('Upsert execute failed: ' . $stmtUp->error);
  $stmtUp->close();
}

$observedExisting = [];

$allContent = array_values(array_unique(array_map(fn($r) => $r['content_hash'], $incoming)));

foreach (chunk($allContent, 400) as $chChunk) {
  $placeholders = implode(',', array_fill(0, count($chChunk), '?'));

  $sqlObsSel = "SELECT id, content_hash FROM ap308_observed WHERE content_hash IN ($placeholders)";
  $stmtObsSel = $conn->prepare($sqlObsSel);
  if (!$stmtObsSel) throw new RuntimeException('Prepare failed: ' . $conn->error);

  $types = str_repeat('s', count($chChunk));
  $vals = $chChunk;
  bind_params($stmtObsSel, $types, $vals);

  if (!$stmtObsSel->execute()) throw new RuntimeException('Observed select execute failed: ' . $stmtObsSel->error);

  $res = $stmtObsSel->get_result();
  while ($row = $res->fetch_assoc()) {
    $observedExisting[strtolower($row['content_hash'])] = (int)$row['id'];
  }
  $stmtObsSel->close();
}
foreach (chunk($incoming, 400) as $rowsChunk) {
  $valuesSql = [];
  $types = '';
  $vals = [];

  foreach ($rowsChunk as $r) {
    // observed stores 2 cols: anchor_hash, content_hash
    $valuesSql[] = "(?, ?)";
    $types .= "ss";
    array_push($vals, $r['anchor_hash'], $r['content_hash']);
  }

  $sqlObsUpsert = "
    INSERT INTO ap308_observed (anchor_hash, content_hash)
    VALUES " . implode(',', $valuesSql) . "
    ON DUPLICATE KEY UPDATE
      anchor_hash = VALUES(anchor_hash),
      last_seen_at = CURRENT_TIMESTAMP,
      seen_count = seen_count + 1
  ";

  $stmtObsUp = $conn->prepare($sqlObsUpsert);
  if (!$stmtObsUp) throw new RuntimeException('Prepare failed: ' . $conn->error);

  bind_params($stmtObsUp, $types, $vals);
  if (!$stmtObsUp->execute()) throw new RuntimeException('Observed upsert execute failed: ' . $stmtObsUp->error);
  $stmtObsUp->close();
}

$observedIdByContent = [];

foreach (chunk($allContent, 400) as $chChunk) {
  $placeholders = implode(',', array_fill(0, count($chChunk), '?'));

  $sqlObsSel2 = "SELECT id, content_hash FROM ap308_observed WHERE content_hash IN ($placeholders)";
  $stmtObsSel2 = $conn->prepare($sqlObsSel2);
  if (!$stmtObsSel2) throw new RuntimeException('Prepare failed: ' . $conn->error);

  $types = str_repeat('s', count($chChunk));
  $vals = $chChunk;
  bind_params($stmtObsSel2, $types, $vals);

  if (!$stmtObsSel2->execute()) throw new RuntimeException('Observed select2 execute failed: ' . $stmtObsSel2->error);

  $res = $stmtObsSel2->get_result();
  while ($row = $res->fetch_assoc()) {
    $observedIdByContent[strtolower($row['content_hash'])] = (int)$row['id'];
  }

  $stmtObsSel2->close();
}


foreach (chunk($incoming, 400) as $rowsChunk) {
  $cases = [];
  $whereParts = [];
  $types = '';
  $vals = [];

  foreach ($rowsChunk as $r) {
    $ch = strtolower($r['content_hash']);
    $obsId = $observedIdByContent[$ch] ?? null;
    if ($obsId === null) continue;

    // CASE WHEN stable_row_num = ? THEN ?
    $cases[] = "WHEN stable_row_num = ? THEN ?";
    $types .= "ii";
    array_push($vals, (int)$r['stable_row_num'], (int)$obsId);

    // WHERE stable_row_num IN (...)
    $whereParts[] = "?";
    $types .= "i";
    $vals[] = (int)$r['stable_row_num'];
  }

  if (count($cases) === 0) continue;

  $sqlLink = "
    UPDATE ap308_manifest
    SET observed_id = CASE " . implode(' ', $cases) . " ELSE observed_id END
    WHERE source_folder = ?
      AND source_file = ?
      AND stable_row_num IN (" . implode(',', $whereParts) . ")
  ";

  // prepend folder/file (types: ss)
  $types = "ss" . $types;
  array_unshift($vals, $sourceFile);
  array_unshift($vals, $sourceFolder);

  $stmtLink = $conn->prepare($sqlLink);
  if (!$stmtLink) throw new RuntimeException('Prepare failed: ' . $conn->error);

  bind_params($stmtLink, $types, $vals);
  if (!$stmtLink->execute()) throw new RuntimeException('Manifest link execute failed: ' . $stmtLink->error);
  $stmtLink->close();
}
  $conn->commit();

  $counts = [
    'received' => count($incoming), 
    'inserted' => 0, 
    'unchanged' => 0, 
    'changed' => 0,
    'observed_new' => 0,
    'observed_already_seen' => 0
    ];
  $outRows = $returnRows ? [] : null;

  foreach ($incoming as $r) {
    $num = (int)$r['stable_row_num'];
    $prev = $existingByNum[$num] ?? null;

    if ($prev === null) {
      $status = 'inserted';
      $counts['inserted']++;
      $existingId = null;
      $prevContent = null;
    } else {
      $existingId = (int)$prev['id'];
      $prevContent = strtolower((string)$prev['content_hash']);
      if ($prevContent === $r['content_hash']) {
        $status = 'unchanged';
        $counts['unchanged']++;
      } else {
        $status = 'changed';
        $counts['changed']++;
      }
    }

    $ch = strtolower($r['content_hash']);
    $observedWasAlreadySeen = array_key_exists($ch, $observedExisting);
    if($observedWasAlreadySeen) $counts['observed_already_seen']++;
    else $counts['observed_new']++;
    if($returnRows) {
      $outRows[] = [
        'stable_row_num' => $num,
        'source_row_key' => $r['source_row_key'],
        'status' => $status,
        'existing_id' => $existingId,
        'anchor_hash' => $r['anchor_hash'],
        'content_hash' => $r['content_hash'],
        'previous_content_hash' => $prevContent,
        'observed_status' => $observedWasAlreadySeen ? 'already_seen' : 'new',
        'observed_id' => $observedIdByContent[$ch] ?? null,
      ];
    }
  }

  $payload = [
    'ok' => true,
    'source_folder' => $sourceFolder,
    'source_file' => $sourceFile,
    'counts' => $counts
  ];
  if($returnRows) $payload['rows'] = $outRows;

  json_out(200, $payload);

} catch (Throwable $e) {
  // rollback if possible
  if (isset($conn) && $conn instanceof mysqli) {
    try { $conn->rollback(); } catch (Throwable $ignored) {}
  }
  json_error(400, $e->getMessage());
}