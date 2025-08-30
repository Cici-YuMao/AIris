package com.airis.chat.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.util.Map;

/**
 * 通知消息实体
 * 用于发送到通知模块的消息格式
 *
 * @author AIRIS Team
 * @since 1.0.0
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationMessage implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 接收者ID
     */
    private Long receiverId;

    /**
     * 发送者ID（如果没有，就写null）
     */
    private Long senderId;

    /**
     * 通知类型（必须三选一：match/chat/media）
     */
    private String type;

    /**
     * 通知标题，用于UI展示（例如：Match results, AI review results, chat messages~）
     */
    private String title;

    /**
     * 通知正文内容
     */
    private String content;

    /**
     * 扩展字段（如 matchId、mediaId、commentId、审核结果）
     */
    private Map<String, Object> metadata;
} 