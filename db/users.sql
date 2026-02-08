CREATE TABLE users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(32) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  email_verified_at DATETIME NULL,
  last_login_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_users_username (username),
  UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE user_totp (
  user_id BIGINT UNSIGNED NOT NULL PRIMARY KEY,
  is_enabled TINYINT(1) NOT NULL DEFAULT 0,
  secret_enc VARBINARY(512) NOT NULL,
  secret_kid VARCHAR(32) NULL,
  secret_nonce VARBINARY(24) NOT NULL,
  enabled_at DATETIME NULL,
  last_used_step BIGINT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_user_totp_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE user_backup_codes (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  code_hash VARBINARY(64) NOT NULL,
  used_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_backup_user (user_id),
  KEY idx_backup_user_used (user_id, used_at),
  CONSTRAINT fk_backup_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE auth_sessions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  token_id CHAR(36) NOT NULL,
  refresh_token_hash VARBINARY(32) NOT NULL,
  issued_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME NOT NULL,
  last_used_at DATETIME NULL,
  revoked_at DATETIME NULL,
  replaced_by_token_id CHAR(36) NULL,
  ip_address VARCHAR(45) NULL,
  user_agent VARCHAR(255) NULL,
  KEY idx_sessions_user (user_id),
  KEY idx_sessions_token_id (token_id),
  KEY idx_sessions_expires (expires_at),
  KEY idx_sessions_user_active (user_id, revoked_at, expires_at),
  UNIQUE KEY uq_sessions_token_id (token_id),
  CONSTRAINT fk_sessions_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE password_resets (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  token_hash VARBINARY(64) NOT NULL,
  requested_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME NOT NULL,
  used_at DATETIME NULL,
  request_ip VARCHAR(45) NULL,
  KEY idx_resets_user (user_id),
  KEY idx_resets_expires (expires_at),
  KEY idx_resets_user_used (user_id, used_at),
  CONSTRAINT fk_resets_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE email_verifications (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  token_hash VARBINARY(64) NOT NULL,
  requested_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME NOT NULL,
  used_at DATETIME NULL,
  KEY idx_emailver_user (user_id),
  KEY idx_emailver_expires (expires_at),
  CONSTRAINT fk_emailver_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE failed_login_attempts (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NULL,
  username VARCHAR(255) NOT NULL,
  ip_address VARCHAR(45) NOT NULL,
  attempted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_failed_ip_time (ip_address, attempted_at),
  KEY idx_failed_user_time (user_id, attempted_at),
  KEY idx_failed_username_time (username, attempted_at),
  CONSTRAINT fk_failed_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE user_audit_log (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NULL,
  event_type VARCHAR(64) NOT NULL,
  event_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ip_address VARCHAR(45) NULL,
  user_agent VARCHAR(255) NULL,
  session_id BIGINT UNSIGNED NULL,
  target_user_id BIGINT UNSIGNED NULL,
  meta JSON NULL,
  KEY idx_audit_user_time (user_id, event_at),
  KEY idx_audit_type_time (event_type, event_at),
  KEY idx_audit_ip_time (ip_address, event_at),
  CONSTRAINT fk_audit_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE SET NULL,
  CONSTRAINT fk_audit_session
    FOREIGN KEY (session_id) REFERENCES auth_sessions(id)
    ON DELETE SET NULL,
  CONSTRAINT fk_audit_target_user
    FOREIGN KEY (target_user_id) REFERENCES users(id)
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE account_lockouts (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NULL,
  ip_address VARCHAR(45) NULL,
  lock_reason VARCHAR(128) NOT NULL,
  locked_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  locked_until DATETIME NULL,
  cleared_at DATETIME NULL,
  cleared_by_user_id BIGINT UNSIGNED NULL,
  clear_reason VARCHAR(255) NULL,
  meta JSON NULL,
  KEY idx_lockouts_user_active (user_id, cleared_at, locked_until),
  KEY idx_lockouts_ip_active (ip_address, cleared_at, locked_until),
  KEY idx_lockouts_locked_at (locked_at),
  CONSTRAINT fk_lockouts_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_lockouts_cleared_by
    FOREIGN KEY (cleared_by_user_id) REFERENCES users(id)
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


CREATE TABLE system_settings (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  category VARCHAR(64) NOT NULL,
  name VARCHAR(64) NOT NULL,
  value TINYTEXT NOT NULL DEFAULT '',
  description TINYTEXT NOT NULL DEFAULT '',
  can_delete TINYINT NOT NULL DEFAULT 1,
  can_rename TINYINT NOT NULL DEFAULT 1,
  format VARCHAR(32) NULL DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_settings_category_name (category, name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO system_settings (category, name, value, description, can_delete, can_rename, format) VALUES
('auth', 'allow_registration', '1', 'Enable public user registration', 0, 0, 'boolean'),
('auth', 'require_email_verification', '1', 'Require email verification before login', 0, 0, 'boolean'),
('auth', 'username_min_length', '3', 'Minimum username length', 0, 0, 'int'),
('auth', 'username_max_length', '32', 'Maximum username length', 0, 0, 'int'),
('auth', 'password_min_length', '12', 'Minimum password length', 0, 0, 'int'),
('auth', 'password_require_complexity', '1', 'Require complex passwords', 0, 0, 'boolean'),
('auth', 'password_hash_algo', 'argon2id', 'Password hashing algorithm', 0, 0, 'string'),
('auth', 'password_rehash_on_login', '1', 'Upgrade password hashes on login', 0, 0, 'boolean');

INSERT INTO system_settings (category, name, value, description, can_delete, can_rename, format) VALUES
('jwt', 'access_token_ttl_seconds', '900', 'Access token lifetime in seconds', 0, 0, 'int'),
('jwt', 'issuer', 'https://wcf.regaldragondanceparty.com', 'JWT issuer claim', 0, 1, 'string'),
('jwt', 'audience', 'https://wcf.regaldragondanceparty.com', 'JWT audience claim', 0, 1, 'string'),
('jwt', 'signing_algorithm', 'HS256', 'JWT signing algorithm', 0, 0, 'string'),
('jwt', 'clock_skew_seconds', '60', 'Allowed JWT clock skew', 0, 0, 'int'),
('jwt', 'include_username_claim', '1', 'Include username in JWT payload', 0, 0, 'boolean'),
('jwt', 'include_email_claim', '0', 'Include email in JWT payload', 0, 0, 'boolean');

INSERT INTO system_settings (category, name, value, description, can_delete, can_rename, format) VALUES
('sessions', 'refresh_token_ttl_days', '30', 'Refresh token lifetime in days', 0, 0, 'int'),
('sessions', 'max_sessions_per_user', '10', 'Maximum concurrent sessions per user', 0, 0, 'int'),
('sessions', 'rotate_refresh_tokens', '1', 'Enable refresh token rotation', 0, 0, 'boolean'),
('sessions', 'revoke_on_password_change', '1', 'Revoke sessions on password change', 0, 0, 'boolean'),
('sessions', 'revoke_on_mfa_change', '1', 'Revoke sessions on MFA changes', 0, 0, 'boolean'),
('sessions', 'session_idle_timeout_days', '14', 'Expire inactive sessions after N days', 0, 0, 'int');

INSERT INTO system_settings (category, name, value, description, can_delete, can_rename, format) VALUES
('mfa', 'allow_totp', '1', 'Enable TOTP multi-factor authentication', 0, 0, 'boolean'),
('mfa', 'totp_issuer_name', 'ExampleApp', 'Issuer name shown in authenticator apps', 0, 1, 'string'),
('mfa', 'totp_digits', '6', 'Number of digits for TOTP codes', 0, 0, 'int'),
('mfa', 'totp_period_seconds', '30', 'TOTP time step in seconds', 0, 0, 'int'),
('mfa', 'totp_window', '1', 'Allowed TOTP drift window', 0, 0, 'int'),
('mfa', 'require_mfa_for_login', '0', 'Require MFA for all users', 0, 0, 'boolean'),
('mfa', 'require_mfa_for_admins', '1', 'Require MFA for privileged users', 0, 0, 'boolean'),
('mfa', 'backup_codes_count', '10', 'Number of MFA recovery codes', 0, 0, 'int'),
('mfa', 'invalidate_sessions_on_mfa_enable', '1', 'Invalidate sessions when MFA is enabled', 0, 0, 'boolean');

INSERT INTO system_settings (category, name, value, description, can_delete, can_rename, format) VALUES
('security', 'max_failed_logins', '5', 'Failed logins before lockout', 0, 0, 'int'),
('security', 'failed_login_window_minutes', '15', 'Rolling window for failed logins', 0, 0, 'int'),
('security', 'lockout_duration_minutes', '30', 'Initial lockout duration', 0, 0, 'int'),
('security', 'lockout_escalation_enabled', '1', 'Enable escalating lockouts', 0, 0, 'boolean'),
('security', 'max_lockout_duration_minutes', '1440', 'Maximum lockout duration', 0, 0, 'int'),
('security', 'lockout_by_ip_enabled', '1', 'Enable IP-based lockouts', 0, 0, 'boolean'),
('security', 'log_failed_logins', '1', 'Log failed login attempts', 0, 0, 'boolean');

INSERT INTO system_settings (category, name, value, description, can_delete, can_rename, format) VALUES
('recovery', 'password_reset_ttl_minutes', '60', 'Password reset token lifetime', 0, 0, 'int'),
('recovery', 'max_reset_requests_per_day', '5', 'Max password reset requests per day', 0, 0, 'int'),
('recovery', 'reset_token_length', '32', 'Reset token length in bytes', 0, 0, 'int'),
('recovery', 'invalidate_sessions_on_reset', '1', 'Revoke sessions after password reset', 0, 0, 'boolean'),
('recovery', 'email_verification_ttl_hours', '24', 'Email verification token lifetime', 0, 0, 'int');

INSERT INTO system_settings (category, name, value, description, can_delete, can_rename, format) VALUES
('email', 'from_address', 'no-reply@example.com', 'Default sender email address', 0, 1, 'email'),
('email', 'from_name', 'Example App', 'Default sender name', 0, 1, 'string'),
('email', 'enable_email_sending', '1', 'Enable outbound email sending', 0, 0, 'boolean'),
('email', 'email_rate_limit_per_hour', '20', 'Max auth emails per hour', 0, 0, 'int'),
('email', 'email_provider', 'smtp', 'Email provider type', 0, 1, 'string');

INSERT INTO system_settings (category, name, value, description, can_delete, can_rename, format) VALUES
('audit', 'audit_login_events', '1', 'Log login success and failure', 0, 0, 'boolean'),
('audit', 'audit_token_events', '1', 'Log session and token events', 0, 0, 'boolean'),
('audit', 'audit_mfa_events', '1', 'Log MFA enable/disable events', 0, 0, 'boolean'),
('audit', 'audit_retention_days', '365', 'Audit log retention period', 0, 0, 'int'),
('audit', 'anonymize_ip_after_days', '90', 'Anonymize IP addresses after N days', 0, 0, 'int');

INSERT INTO system_settings (category, name, value, description, can_delete, can_rename, format) VALUES
('maintenance', 'prune_expired_sessions', '1', 'Enable cleanup of expired sessions', 0, 0, 'boolean'),
('maintenance', 'prune_expired_tokens_days', '7', 'Grace period before deleting expired tokens', 0, 0, 'int'),
('maintenance', 'prune_old_audit_logs', '1', 'Enable audit log pruning', 0, 0, 'boolean'),
('maintenance', 'prune_failed_logins_days', '30', 'Retention for failed login attempts', 0, 0, 'int');
