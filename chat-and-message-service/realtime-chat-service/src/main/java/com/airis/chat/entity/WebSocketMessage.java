package com.airis.chat.entity;

import com.airis.message.enums.MessageType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.util.Map;

/**
 * WebSocket消息实体
 *
 * @author AIRIS Team
 * @since 1.0.0
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WebSocketMessage implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * WebSocket消息类型（连接、聊天、心跳等）
     */
    private WebSocketMessageType type;

    /**
     * 聊天消息类型（文本、图片、视频等）
     * 仅当type为CHAT_MESSAGE时有效
     */
    private MessageType chatMessageType;

    /**
     * 发送者ID
     */
    private String senderId;

    /**
     * 接收者ID
     */
    private String receiverId;

    /**
     * 聊天ID
     */
    private String chatId;

    /**
     * 消息ID（仅用于聊天消息）
     */
    private String messageId;

    /**
     * 临时消息ID（客户端生成，用于消息匹配）
     */
    private String tempMessageId;

    /**
     * 消息内容
     */
    private String content;

    /**
     * 媒体文件元数据
     * 仅当chatMessageType不为TEXT时有效
     */
    private MediaMetadataRequest mediaMetadata;

    /**
     * 时间戳
     */
    private Long timestamp;

    /**
     * 额外数据
     */
    private Map<String, Object> extraData;

    /**
     * WebSocket消息类型枚举
     */
    public enum WebSocketMessageType {
        // 连接相关
        CONNECTED,
        DISCONNECTED,
        CONNECTION_REPLACED, // 连接被替换

        // 聊天消息
        CHAT_MESSAGE,
        MESSAGE_ACK, // 消息确认

        // 心跳
        HEARTBEAT,
        HEARTBEAT_ACK,

        // 状态相关
        READ_RECEIPT,
        TYPING,
        ONLINE_STATUS,

        // 系统通知
        SYSTEM_NOTIFICATION,

        // 错误
        ERROR
    }

    /**
     * 媒体文件元数据请求
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MediaMetadataRequest implements Serializable {

        private static final long serialVersionUID = 1L;

        /**
         * 文件URL
         */
        private String url;

        /**
         * 文件名
         */
        private String fileName;

        /**
         * 文件大小
         */
        private Long fileSize;

        /**
         * 时长（秒）
         */
        private Integer duration;

        /**
         * 宽度
         */
        private Integer width;

        /**
         * 高度
         */
        private Integer height;
    }
}