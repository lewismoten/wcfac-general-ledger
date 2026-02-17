<?php
function read_index_locked(string $filePath, $fh): array {
  clearstatcache(true, $filePath);
  $size = filesize($filePath);
  if ($size === false || $size === 0) return [];

  rewind($fh);
  $json = stream_get_contents($fh);
  if ($json === false || trim($json) === '') return [];

  $data = json_decode($json, true);
  return is_array($data) ? $data : [];
}

function write_index_locked($fh, array $data): void {
  $json = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
  if ($json === false) {
    echo "Failed to encode data";
    exit;
  }
  rewind($fh);
  if (!ftruncate($fh, 0)) {
    echo "Failed to truncate data";
    exit;
  }
  if (fwrite($fh, $json . "\n") === false) {
    echo "Failed to write idata";
    exit;
  }
  fflush($fh);
}