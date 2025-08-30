-- AIRIS消息服务数据库初始化脚本
-- 创建数据库
CREATE DATABASE IF NOT EXISTS airis_message 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE airis_message;


CREATE TABLE IF NOT EXISTS chat_session (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '主键ID',
    chat_id VARCHAR(255) NOT NULL UNIQUE COMMENT '聊天ID',
    user1_id VARCHAR(128) NOT NULL COMMENT '用户1 ID',
    user2_id VARCHAR(128) NOT NULL COMMENT '用户2 ID',
    last_message_id VARCHAR(128) COMMENT '最后消息ID',
    last_message_content TEXT COMMENT '最后消息内容预览',
    last_message_timestamp BIGINT COMMENT '最后消息时间戳',
    user1_unread_count INT DEFAULT 0 COMMENT 'user1未读消息数',
    user2_unread_count INT DEFAULT 0 COMMENT 'user2未读消息数',
    user1_last_read_message_id VARCHAR(128) COMMENT 'user1最后已读消息ID',
    user2_last_read_message_id VARCHAR(128) COMMENT 'user2最后已读消息ID',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_user1_id (user1_id),
    INDEX idx_user2_id (user2_id),
    INDEX idx_last_message_timestamp (last_message_timestamp),
    INDEX idx_chat_id (chat_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='聊天会话表';

-- Create MongoDB index
/*
use airis_chat;

db.chat_messages.createIndex({ "chatId": 1, "timestamp": -1 });
db.chat_messages.createIndex({ "messageId": 1 }, { unique: true });
db.chat_messages.createIndex({ "senderId": 1 });
db.chat_messages.createIndex({ "receiverId": 1 });
db.chat_messages.createIndex({ "messageType": 1 });
db.chat_messages.createIndex({ "status": 1 });
db.chat_messages.createIndex({ "moderationStatus": 1 });

db.chat_messages.createIndex({ "senderId": 1, "receiverId": 1, "timestamp": -1 });
db.chat_messages.createIndex({ "chatId": 1, "messageType": 1, "timestamp": -1 });

db.chat_messages.createIndex({ "content": "text" });
*/ 