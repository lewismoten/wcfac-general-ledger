ALTER TABLE ap308_manifest ADD INDEX idx_manifest_content_hash (content_hash);
ALTER TABLE ap308_observed ADD UNIQUE INDEX uq_observed_content_hash (content_hash);
