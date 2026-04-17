-- Add missing columns to feedbacks table
ALTER TABLE feedbacks ADD COLUMN upvotes INTEGER DEFAULT 0;
ALTER TABLE feedbacks ADD COLUMN downvotes INTEGER DEFAULT 0;
ALTER TABLE feedbacks ADD COLUMN commentsCount INTEGER DEFAULT 0;

-- Create feedback_votes table
CREATE TABLE IF NOT EXISTS feedback_votes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  feedback_id INTEGER NOT NULL,
  user_id TEXT NOT NULL,
  vote TEXT NOT NULL CHECK(vote IN ('up', 'down')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (feedback_id) REFERENCES feedbacks(id),
  UNIQUE(feedback_id, user_id)
);

-- Create feedback_comments table
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

-- Index for feedback_votes
CREATE INDEX IF NOT EXISTS idx_feedback_votes_feedback ON feedback_votes(feedback_id);
CREATE INDEX IF NOT EXISTS idx_feedback_votes_user ON feedback_votes(user_id);

-- Index for feedback_comments
CREATE INDEX IF NOT EXISTS idx_feedback_comments_feedback ON feedback_comments(feedback_id);
CREATE INDEX IF NOT EXISTS idx_feedback_comments_created ON feedback_comments(created_at ASC);

-- Trigger for auto-updating feedback_comments updated_at
CREATE TRIGGER IF NOT EXISTS update_feedback_comment_timestamp
AFTER UPDATE ON feedback_comments
FOR EACH ROW
BEGIN
  UPDATE feedback_comments SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;
