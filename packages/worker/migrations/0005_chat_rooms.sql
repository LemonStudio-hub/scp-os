-- Chat rooms table
CREATE TABLE IF NOT EXISTS chat_rooms (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  created_by TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  is_public INTEGER DEFAULT 1,
  message_count INTEGER DEFAULT 0
);

-- room_id column already added in 0004_chat_messages.sql
-- ALTER TABLE chat_messages ADD COLUMN room_id INTEGER DEFAULT 1;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_chat_room_id ON chat_messages(room_id);
CREATE INDEX IF NOT EXISTS idx_chat_rooms_name ON chat_rooms(name);

-- Default rooms
INSERT OR IGNORE INTO chat_rooms (id, name, description, created_by, is_public) VALUES
  (1, 'General', 'General discussion', 'system', 1),
  (2, 'Random', 'Random chat', 'system', 1),
  (3, 'Tech', 'Technology discussion', 'system', 1);
