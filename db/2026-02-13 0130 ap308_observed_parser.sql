CREATE TABLE IF NOT EXISTS ap308_observed_payload (
  observed_id BIGINT UNSIGNED NOT NULL,
  payload_json JSON NOT NULL,

  PRIMARY KEY (observed_id),
  CONSTRAINT fk_payload_observed
    FOREIGN KEY (observed_id) REFERENCES ap308_observed(id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
