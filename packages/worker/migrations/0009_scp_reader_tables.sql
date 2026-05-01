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

CREATE VIRTUAL TABLE IF NOT EXISTS scp_search USING fts5(
  scp_number,
  title,
  tags,
  content=scp_items,
  content_rowid=id
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
