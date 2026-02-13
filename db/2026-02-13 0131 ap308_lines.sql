CREATE TABLE IF NOT EXISTS ap308_lines (
  observed_id BIGINT UNSIGNED NOT NULL,

  -- identity / grouping helpers
  anchor_hash  CHAR(64) NOT NULL,
  content_hash CHAR(64) NOT NULL,

  -- common AP308 fields (adjust to your CSV schema)
  po_no        VARCHAR(16) NULL,
  vend_no      VARCHAR(16) NULL,
  vendor_name  VARCHAR(255) NULL,
  invoice_no   VARCHAR(128) NULL,
  invoice_date DATE NULL,
  account_no   VARCHAR(64) NULL,
  acct_pd   CHAR(7) NULL,
  net_amount   DECIMAL(18,2) NULL,
  check_no     VARCHAR(16) NULL,  
  check_date   DATE NULL,
  description  VARCHAR(500) NULL,
  batch        VARCHAR(32) NULL,

  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (observed_id),

  UNIQUE KEY uq_content (content_hash),

  KEY idx_vendor (vend_no),
  KEY idx_vendor_name (vendor_name(64)),
  KEY idx_check (check_no),
  KEY idx_check_date (check_date),
  KEY idx_invoice (invoice_no),
  KEY idx_invoice_date (invoice_date),
  KEY idx_account (account_no),
  KEY idx_acct_pd (acct_pd),
  KEY idx_batch (batch),
  KEY idx_amount (net_amount),

  CONSTRAINT fk_lines_observed
    FOREIGN KEY (observed_id) REFERENCES ap308_observed(id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
