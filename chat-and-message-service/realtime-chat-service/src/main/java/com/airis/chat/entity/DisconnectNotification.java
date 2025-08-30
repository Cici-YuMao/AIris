package com.airis.chat.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 断开连接通知实体
 * 用于跨节点通知断开用户连接
 *
 * @author AIRIS Team
 * @since 1.0.0
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class DisconnectNotification {

    /**
     * 需要断开连接的用户ID
     */
    private String userId;

    /**
     * 目标节点ID（需要断开连接的节点）
     */
    private String targetNodeId;

    /**
     * 源节点ID（发送通知的节点）
     */
    private String sourceNodeId;

    /**
     * 断开原因
     */
    private String reason;

    /**
     * 通知时间戳
     */
    private Long timestamp;

    /**
     * 会话ID（可选，用于精确断开特定会话）
     */
    private String sessionId;
}