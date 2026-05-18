-- 添加 edited 标记到聊天消息表
ALTER TABLE chat_messages ADD COLUMN edited INTEGER DEFAULT 0;
