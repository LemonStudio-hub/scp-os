-- SCP 数据库初始化脚本
-- 创建 SCP 索引表

CREATE TABLE IF NOT EXISTS scp_index (
  scp_id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  object_class TEXT NOT NULL,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  tags TEXT DEFAULT '',
  clearance_level INTEGER DEFAULT 1
);

-- 删除旧的 FTS 表（如果存在）
DROP TABLE IF EXISTS scp_search;

-- 创建全文搜索表（使用 FTS5）
CREATE VIRTUAL TABLE IF NOT EXISTS scp_search USING fts5(
  scp_id,
  name,
  tags,
  tokenize = 'unicode61 remove_diacritics 2'
);

-- 创建索引以加速查询
CREATE INDEX IF NOT EXISTS idx_scp_name ON scp_index(name);
CREATE INDEX IF NOT EXISTS idx_scp_class ON scp_index(object_class);
CREATE INDEX IF NOT EXISTS idx_scp_tags ON scp_index(tags);
CREATE INDEX IF NOT EXISTS idx_scp_clearance ON scp_index(clearance_level);
CREATE INDEX IF NOT EXISTS idx_scp_updated ON scp_index(updated_at);

-- 创建触发器以自动更新时间戳
CREATE TRIGGER IF NOT EXISTS update_scp_timestamp
AFTER UPDATE ON scp_index
FOR EACH ROW
BEGIN
  UPDATE scp_index SET updated_at = CURRENT_TIMESTAMP WHERE scp_id = NEW.scp_id;
END;

-- 创建触发器以自动同步到 FTS 表（插入）
CREATE TRIGGER IF NOT EXISTS scp_search_ai AFTER INSERT ON scp_index BEGIN
  INSERT INTO scp_search(rowid, scp_id, name, tags)
  VALUES (NEW.scp_id, NEW.scp_id, NEW.name, NEW.tags);
END;

-- 创建触发器以自动同步到 FTS 表（删除）
CREATE TRIGGER IF NOT EXISTS scp_search_ad AFTER DELETE ON scp_index BEGIN
  DELETE FROM scp_search WHERE rowid = OLD.scp_id;
END;

-- 创建触发器以自动同步到 FTS 表（更新）
CREATE TRIGGER IF NOT EXISTS scp_search_au AFTER UPDATE ON scp_index BEGIN
  DELETE FROM scp_search WHERE rowid = OLD.scp_id;
  INSERT INTO scp_search(rowid, scp_id, name, tags)
  VALUES (NEW.scp_id, NEW.scp_id, NEW.name, NEW.tags);
END;

-- 插入一些示例数据
INSERT OR IGNORE INTO scp_index (scp_id, name, object_class, tags, clearance_level) VALUES
  (173, '雕像', 'KETER', '雕像 混凝土 移动 视线', 4),
  (096, '羞涩的人', 'EUCLID', '人形 生物 面部 愤怒', 3),
  (682, '不灭孽蜥', 'KETER', '爬行动物 生物 适应 重生', 5),
  (999, '痒痒怪', 'SAFE', '橙色 生物 友好 治疗', 1),
  (049, '疫医', 'EUCLID', '人形 瘟疫 死亡 复活', 3),
  (914, '万能加工机', 'SAFE', '机器 加工 转换', 2),
  (3008, '无限宜家', 'EUCLID', '建筑 空间 无限 宜家', 2),
  (087, '楼梯间', 'EUCLID', '空间 楼梯 无限 恐怖', 3),
  (106, '老人', 'KETER', '人形 腐蚀 穿越物质', 4),
  (1471, '恶魔', 'EUCLID', '数字实体 手机 幻觉', 2);