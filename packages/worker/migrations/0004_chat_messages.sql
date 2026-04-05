-- 聊天消息表
CREATE TABLE IF NOT EXISTS chat_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  username TEXT NOT NULL DEFAULT 'Anonymous',
  content TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  is_broadcast INTEGER DEFAULT 0,
  broadcast_count INTEGER DEFAULT 0
);

-- 用户 ID 索引（加速查询特定用户的消息）
CREATE INDEX IF NOT EXISTS idx_chat_user_id ON chat_messages(user_id);

-- 创建时间索引（加速时间范围查询）
CREATE INDEX IF NOT EXISTS idx_chat_created_at ON chat_messages(created_at);

-- 广播状态索引（加速未广播消息查询）
CREATE INDEX IF NOT EXISTS idx_chat_is_broadcast ON chat_messages(is_broadcast);

-- 复合索引（加速定时广播查询）
CREATE INDEX IF NOT EXISTS idx_chat_broadcast_query ON chat_messages(is_broadcast, created_at);
