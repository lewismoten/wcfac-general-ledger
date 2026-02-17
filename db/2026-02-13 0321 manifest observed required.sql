ALTER TABLE ap308_manifest
  DROP FOREIGN KEY fk_ap308_manifest_observed;

ALTER TABLE ap308_manifest
  MODIFY observed_id BIGINT UNSIGNED NOT NULL;


ALTER TABLE ap308_manifest
  ADD CONSTRAINT fk_ap308_manifest_observed
    FOREIGN KEY (observed_id) REFERENCES ap308_observed(id);

ALTER TABLE ap308_manifest
  ADD UNIQUE KEY uq_manifest_observed_source (observed_id, source_folder, source_file);

ALTER TABLE ap308_manifest DROP INDEX uq_source_slot;

ALTER TABLE ap308_manifest
  CHANGE COLUMN stable_row_num source_row_num INT UNSIGNED NULL;