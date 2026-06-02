-- Registered user auth, cloud sync quota, and admin removal.

ALTER TABLE users ADD COLUMN email TEXT;
ALTER TABLE users ADD COLUMN password_hash TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_account_type ON users(account_type);

UPDATE user_storage SET max_bytes = 536870912;

DROP TABLE IF EXISTS admin_login_attempts;
DROP TABLE IF EXISTS admin_logs;
DROP TABLE IF EXISTS admin_users;
