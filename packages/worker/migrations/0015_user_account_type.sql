-- Account type and ban fields for guest vs registered users
ALTER TABLE users ADD COLUMN account_type TEXT NOT NULL DEFAULT 'guest';
ALTER TABLE users ADD COLUMN is_banned INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN ban_reason TEXT;
ALTER TABLE users ADD COLUMN banned_at DATETIME;
