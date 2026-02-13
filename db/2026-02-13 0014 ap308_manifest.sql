CREATE TABLE IF NOT EXISTS ap308_manifest (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,

  -- provenance
  source_folder VARCHAR(64) NOT NULL,
  source_file   VARCHAR(255) NOT NULL,
  stable_row_num INT UNSIGNED NOT NULL,

  -- hashes
  anchor_hash  CHAR(64) NOT NULL,
  content_hash CHAR(64) NOT NULL,

  -- convenience key: sha256(folder|file|stable_row_num)
  source_row_key CHAR(64) NOT NULL,

  -- bookkeeping
  first_seen_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_seen_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  seen_count    INT UNSIGNED NOT NULL DEFAULT 1,

  is_active TINYINT(1) NOT NULL DEFAULT 1,

  PRIMARY KEY (id),

  -- Idempotency: one row “slot” per file
  UNIQUE KEY uq_source_slot (source_folder, source_file, stable_row_num),

  -- Optional: fast lookup if you use row keys in API payloads
  UNIQUE KEY uq_source_row_key (source_row_key),

  KEY idx_anchor (anchor_hash),
  KEY idx_content (content_hash),
  KEY idx_folder_file (source_folder, source_file)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
