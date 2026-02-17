CREATE TABLE IF NOT EXISTS ap308_observed (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,

  anchor_hash  CHAR(64) NOT NULL,
  content_hash CHAR(64) NOT NULL,

  first_seen_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_seen_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  seen_count    INT UNSIGNED NOT NULL DEFAULT 1,

  PRIMARY KEY (id),

  UNIQUE KEY uq_content (content_hash),
  KEY idx_anchor (anchor_hash)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE ap308_manifest
  ADD COLUMN observed_id BIGINT UNSIGNED NULL,
  ADD KEY idx_observed (observed_id),
  ADD CONSTRAINT fk_ap308_manifest_observed
    FOREIGN KEY (observed_id) REFERENCES ap308_observed(id);
