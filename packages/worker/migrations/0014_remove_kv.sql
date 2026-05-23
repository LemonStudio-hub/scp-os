-- 迁移：从 KV 迁移到 D1
-- 创建替代 KV 的表结构

-- 爬虫缓存表（替代 KV 的 scraper cache）
CREATE TABLE IF NOT EXISTS cache_entries (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  expires_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_cache_expires ON cache_entries(expires_at);

-- 速率限制表（替代 KV 的 rate limiter）
CREATE TABLE IF NOT EXISTS rate_limits (
  identifier TEXT PRIMARY KEY,
  timestamps TEXT NOT NULL
);

-- 文章内容列（替代 KV 的 docs-content:*）
ALTER TABLE scp_items ADD COLUMN content TEXT;
ALTER TABLE scp_tales ADD COLUMN content TEXT;
ALTER TABLE scp_goi ADD COLUMN content TEXT;

-- 性能指标表（替代 KV 的 perf-* 临时存储）
CREATE TABLE IF NOT EXISTS performance_metrics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  data TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_perf_created ON performance_metrics(created_at);
