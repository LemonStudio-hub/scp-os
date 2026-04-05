-- 聊天室表
CREATE TABLE IF NOT EXISTS chat_rooms (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  created_by TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  is_public INTEGER DEFAULT 1,
  message_count INTEGER DEFAULT 0
);

-- 为 chat_messages 表添加 room_id 列
ALTER TABLE chat_messages ADD COLUMN room_id INTEGER DEFAULT 1;

-- 创建外键索引
CREATE INDEX IF NOT EXISTS idx_chat_room_id ON chat_messages(room_id);

-- 创建聊天室名称索引
CREATE INDEX IF NOT EXISTS idx_chat_rooms_name ON chat_rooms(name);

-- 插入默认聊天室
INSERT OR IGNORE INTO chat_rooms (id, name, description, created_by, is_public) VALUES
  (1, 'General', 'General discussion', 'system', 1),
  (2, 'Random', 'Random chat', 'system', 1),
  (3, 'Tech', 'Technology discussion', 'system', 1);
