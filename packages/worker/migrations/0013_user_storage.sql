-- 用户存储配额表
CREATE TABLE IF NOT EXISTS user_storage (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL UNIQUE,
  used_bytes INTEGER DEFAULT 0,
  max_bytes INTEGER DEFAULT 536870912, -- 512MB
  file_count INTEGER DEFAULT 0,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_user_storage_user_id ON user_storage(user_id);
