-- 反馈表
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
  ip_hash TEXT DEFAULT ''
);

-- 用户 ID 索引
CREATE INDEX IF NOT EXISTS idx_feedback_user ON feedbacks(user_id);

-- 创建时间索引（用于排序）
CREATE INDEX IF NOT EXISTS idx_feedback_created ON feedbacks(created_at DESC);

-- 分类索引
CREATE INDEX IF NOT EXISTS idx_feedback_category ON feedbacks(category);

-- 状态索引
CREATE INDEX IF NOT EXISTS idx_feedback_status ON feedbacks(status);

-- 创建触发器自动更新 updated_at
CREATE TRIGGER IF NOT EXISTS update_feedback_timestamp
AFTER UPDATE ON feedbacks
FOR EACH ROW
BEGIN
  UPDATE feedbacks SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;
