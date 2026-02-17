<?php

function ensure_dir(string $dir): void {
  if (!is_dir($dir)) {
    if (!mkdir($dir, 0750, true) && !is_dir($dir)) {
      echo "Failed to create directory: $dir";
      exit;
    }
  }
  if(!is_writable($dir)) {
    echo "Server error: uploads directory not writable.";
    exit;
  }
}

function random_id(int $bytes = 8): string {
  return bin2hex(random_bytes($bytes)); // 16 hex chars for 8 bytes
}

function safe_original_name(string $name, string $defaultName = 'unknown.bin'): string {
  $base = basename($name);
  $base = preg_replace('/[^\w.\- ]+/u', '_', $base) ?? $defaultName;
  $base = trim($base);
  return $base !== '' ? $base : $defaultName;
}