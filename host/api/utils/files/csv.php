<?php

function open_csv(string $absPath): SplFileObject {
  if (!is_file($absPath)) {
    echo "CSV not found";
    exit;
  }
  if (!is_readable($absPath)) {
    echo "CSV not readable";
    exit;
  }

  $size = filesize($absPath);
  $f = new SplFileObject($absPath, 'rb');
  $f->setFlags(SplFileObject::READ_CSV | SplFileObject::SKIP_EMPTY);
  return $f;
}
