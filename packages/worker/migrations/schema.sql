-- =============================================
-- SCP-OS 数据库完整 Schema（最新版本）
-- 自动汇总自 migration 文件 0001-0010
-- =============================================

-- =============================================
-- 1. SCP 索引表（基础 SCP 目录）
-- =============================================
CREATE TABLE IF NOT EXISTS scp_index (
  scp_id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  object_class TEXT NOT NULL,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  tags TEXT DEFAULT '',
  clearance_level INTEGER DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_scp_name ON scp_index(name);
CREATE INDEX IF NOT EXISTS idx_scp_class ON scp_index(object_class);
CREATE INDEX IF NOT EXISTS idx_scp_tags ON scp_index(tags);
CREATE INDEX IF NOT EXISTS idx_scp_clearance ON scp_index(clearance_level);
CREATE INDEX IF NOT EXISTS idx_scp_updated ON scp_index(updated_at);

CREATE TRIGGER IF NOT EXISTS update_scp_timestamp
AFTER UPDATE ON scp_index
FOR EACH ROW
BEGIN
  UPDATE scp_index SET updated_at = CURRENT_TIMESTAMP WHERE scp_id = NEW.scp_id;
END;

-- =============================================
-- 2. SCP 全文搜索表（FTS5 - 与 scp_items 内容同步）
-- =============================================
CREATE VIRTUAL TABLE IF NOT EXISTS scp_search USING fts5(
  scp_number,
  title,
  tags,
  content=scp_items,
  content_rowid=id
);

-- =============================================
-- 3. SCP Reader 相关表
-- =============================================
CREATE TABLE IF NOT EXISTS scp_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  scp_number TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  object_class TEXT,
  series TEXT,
  rating INTEGER DEFAULT 0,
  tags TEXT DEFAULT '',
  creator TEXT,
  created_at DATETIME,
  clearance_level INTEGER DEFAULT 1,
  has_content BOOLEAN DEFAULT 0,
  content_file TEXT
);

CREATE TABLE IF NOT EXISTS scp_tales (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  link TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  year INTEGER,
  rating INTEGER DEFAULT 0,
  tags TEXT DEFAULT '',
  creator TEXT,
  created_at DATETIME,
  content_file TEXT
);

CREATE TABLE IF NOT EXISTS scp_goi (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  link TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  rating INTEGER DEFAULT 0,
  tags TEXT DEFAULT '',
  creator TEXT,
  created_at DATETIME
);

CREATE TABLE IF NOT EXISTS scp_hubs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  link TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  references_json TEXT DEFAULT '[]',
  tags TEXT DEFAULT ''
);

CREATE INDEX IF NOT EXISTS idx_scp_items_number ON scp_items(scp_number);
CREATE INDEX IF NOT EXISTS idx_scp_items_class ON scp_items(object_class);
CREATE INDEX IF NOT EXISTS idx_scp_items_series ON scp_items(series);
CREATE INDEX IF NOT EXISTS idx_scp_items_rating ON scp_items(rating);
CREATE INDEX IF NOT EXISTS idx_scp_tales_year ON scp_tales(year);
CREATE INDEX IF NOT EXISTS idx_scp_tales_rating ON scp_tales(rating);
CREATE INDEX IF NOT EXISTS idx_scp_goi_rating ON scp_goi(rating);

CREATE TRIGGER IF NOT EXISTS scp_items_ai AFTER INSERT ON scp_items BEGIN
  INSERT INTO scp_search(rowid, scp_number, title, tags) VALUES (new.id, new.scp_number, new.title, new.tags);
END;

CREATE TRIGGER IF NOT EXISTS scp_items_ad AFTER DELETE ON scp_items BEGIN
  INSERT INTO scp_search(scp_search, rowid, scp_number, title, tags) VALUES ('delete', old.id, old.scp_number, old.title, old.tags);
END;

CREATE TRIGGER IF NOT EXISTS scp_items_au AFTER UPDATE ON scp_items BEGIN
  INSERT INTO scp_search(scp_search, rowid, scp_number, title, tags) VALUES ('delete', old.id, old.scp_number, old.title, old.tags);
  INSERT INTO scp_search(rowid, scp_number, title, tags) VALUES (new.id, new.scp_number, new.title, new.tags);
END;

-- =============================================
-- 4. 聊天消息表
-- =============================================
CREATE TABLE IF NOT EXISTS chat_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  username TEXT NOT NULL DEFAULT 'Anonymous',
  content TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  is_broadcast INTEGER DEFAULT 0,
  broadcast_count INTEGER DEFAULT 0,
  room_id INTEGER DEFAULT 1,
  edited INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_chat_user_id ON chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_created_at ON chat_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_chat_is_broadcast ON chat_messages(is_broadcast);
CREATE INDEX IF NOT EXISTS idx_chat_broadcast_query ON chat_messages(is_broadcast, created_at);
CREATE INDEX IF NOT EXISTS idx_chat_room_id ON chat_messages(room_id);

-- =============================================
-- 5. 聊天室表
-- =============================================
CREATE TABLE IF NOT EXISTS chat_rooms (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  created_by TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  is_public INTEGER DEFAULT 1,
  message_count INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_chat_rooms_name ON chat_rooms(name);

-- =============================================
-- 6. 反馈表
-- =============================================
CREATE TABLE IF NOT EXISTS feedbacks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  nickname TEXT DEFAULT 'Anonymous',
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  status TEXT DEFAULT 'published',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  likes INTEGER DEFAULT 0,
  ip_hash TEXT DEFAULT '',
  upvotes INTEGER DEFAULT 0,
  downvotes INTEGER DEFAULT 0,
  commentsCount INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_feedback_user ON feedbacks(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_created ON feedbacks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feedback_category ON feedbacks(category);
CREATE INDEX IF NOT EXISTS idx_feedback_status ON feedbacks(status);

CREATE TRIGGER IF NOT EXISTS update_feedback_timestamp
AFTER UPDATE ON feedbacks
FOR EACH ROW
BEGIN
  UPDATE feedbacks SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- =============================================
-- 7. 用户表
-- =============================================
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL UNIQUE,
  email TEXT UNIQUE,
  password_hash TEXT,
  nickname TEXT NOT NULL,
  account_type TEXT NOT NULL DEFAULT 'guest',
  is_banned INTEGER NOT NULL DEFAULT 0,
  ban_reason TEXT,
  banned_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_active_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_user_id ON users(user_id);
CREATE INDEX IF NOT EXISTS idx_users_nickname ON users(nickname);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_account_type ON users(account_type);

CREATE TABLE IF NOT EXISTS user_storage (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL UNIQUE,
  used_bytes INTEGER DEFAULT 0,
  max_bytes INTEGER DEFAULT 536870912,
  file_count INTEGER DEFAULT 0,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_user_storage_user_id ON user_storage(user_id);

-- =============================================
-- 8. 反馈投票表
-- =============================================
CREATE TABLE IF NOT EXISTS feedback_votes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  feedback_id INTEGER NOT NULL,
  user_id TEXT NOT NULL,
  vote TEXT NOT NULL CHECK(vote IN ('up', 'down')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (feedback_id) REFERENCES feedbacks(id),
  UNIQUE(feedback_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_feedback_votes_feedback ON feedback_votes(feedback_id);
CREATE INDEX IF NOT EXISTS idx_feedback_votes_user ON feedback_votes(user_id);

-- =============================================
-- 9. 反馈评论表
-- =============================================
CREATE TABLE IF NOT EXISTS feedback_comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  feedback_id INTEGER NOT NULL,
  user_id TEXT NOT NULL,
  nickname TEXT DEFAULT 'Anonymous',
  content TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (feedback_id) REFERENCES feedbacks(id)
);

CREATE INDEX IF NOT EXISTS idx_feedback_comments_feedback ON feedback_comments(feedback_id);
CREATE INDEX IF NOT EXISTS idx_feedback_comments_created ON feedback_comments(created_at ASC);

CREATE TRIGGER IF NOT EXISTS update_feedback_comment_timestamp
AFTER UPDATE ON feedback_comments
FOR EACH ROW
BEGIN
  UPDATE feedback_comments SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- =============================================
-- 10. 用户设置表
-- =============================================
CREATE TABLE IF NOT EXISTS user_settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_user_settings_key ON user_settings(key);
