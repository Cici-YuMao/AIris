package com.airis.chat.service;

import com.airis.chat.config.RabbitMQConfig;
import com.airis.chat.entity.NotificationMessage;
import com.airis.chat.entity.WebSocketMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.TimeUnit;

/**
 * 离线推送服务
 * 使用RabbitMQ发送通知，包含防重复发送逻辑
 *
 * @author AIRIS Team
 * @since 1.0.0
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class OfflinePushService {

    private final RabbitTemplate rabbitTemplate;
    private final RedisTemplate<String, String> redisTemplate;

    @Value("${airis.chat.offline-push.suppression-period:3600}")
    private long suppressionPeriod;

    // Redis键前缀
    private static final String PUSH_SUPPRESSION_PREFIX = "chat:push:suppression:";

    /**
     * 发送离线推送通知
     * 包含防重复发送逻辑
     *
     * @param wsMessage WebSocket消息
     */
    public void sendOfflinePush(WebSocketMessage wsMessage) {
        if (wsMessage == null || wsMessage.getReceiverId() == null) {
            log.warn("Invalid message for offline push: {}", wsMessage);
            return;
        }

        String receiverId = wsMessage.getReceiverId();
        String senderId = wsMessage.getSenderId();

        // 检查是否在抑制期内
        if (isSuppressed(receiverId)) {
            log.debug("Offline push suppressed for user: {} (within suppression period)", receiverId);
            return;
        }

        try {
            // 转换用户ID为Long类型（假设用户ID是数字字符串）
            Long receiverIdLong = parseUserIdToLong(receiverId);
            Long senderIdLong = parseUserIdToLong(senderId);

            // 构建通知消息
            NotificationMessage notification = buildNotificationMessage(wsMessage, receiverIdLong, senderIdLong);

            // 发送到RabbitMQ
            rabbitTemplate.convertAndSend(
                    RabbitMQConfig.NOTIFICATION_EXCHANGE,
                    RabbitMQConfig.NOTIFICATION_ROUTING_KEY,
                    notification);

            // 设置抑制状态
            setSuppression(receiverId);

            log.info("Offline push notification sent successfully: receiverId={}, senderId={}, messageId={}",
                    receiverId, senderId, wsMessage.getMessageId());

        } catch (Exception e) {
            log.error("Failed to send offline push notification: receiverId={}, senderId={}, messageId={}",
                    receiverId, senderId, wsMessage.getMessageId(), e);
        }
    }

    /**
     * 构建通知消息
     */
    private NotificationMessage buildNotificationMessage(WebSocketMessage wsMessage, Long receiverIdLong,
            Long senderIdLong) {
        // 构建元数据
        Map<String, Object> metadata = new HashMap<>();
        if (wsMessage.getChatId() != null) {
            metadata.put("chatId", wsMessage.getChatId());
        }
        if (wsMessage.getMessageId() != null) {
            metadata.put("messageId", wsMessage.getMessageId());
        }
        if (wsMessage.getChatMessageType() != null) {
            metadata.put("messageType", wsMessage.getChatMessageType().toString());
        }
        // 添加原始的extraData
        if (wsMessage.getExtraData() != null) {
            metadata.putAll(wsMessage.getExtraData());
        }

        // 构建通知内容
        String title = "You received a new message!";
        String content = truncateContent(wsMessage.getContent(), 50); // 限制内容长度

        return NotificationMessage.builder()
                .receiverId(receiverIdLong)
                .senderId(senderIdLong)
                .type("chat") // 聊天类型通知
                .title(title)
                .content(content)
                .metadata(metadata)
                .build();
    }

    /**
     * 检查用户是否在抑制期内
     */
    private boolean isSuppressed(String receiverId) {
        String key = PUSH_SUPPRESSION_PREFIX + receiverId;
        return Boolean.TRUE.equals(redisTemplate.hasKey(key));
    }

    /**
     * 设置抑制状态
     */
    private void setSuppression(String receiverId) {
        String key = PUSH_SUPPRESSION_PREFIX + receiverId;
        try {
            redisTemplate.opsForValue().set(key, "1", suppressionPeriod, TimeUnit.SECONDS);
            log.debug("Set push suppression for user: {} for {} seconds", receiverId, suppressionPeriod);
        } catch (Exception e) {
            log.warn("Failed to set push suppression for user: {}", receiverId, e);
        }
    }

    /**
     * 解析用户ID为Long类型
     * 如果解析失败，返回null
     */
    private Long parseUserIdToLong(String userId) {
        if (userId == null) {
            return null;
        }
        try {
            return Long.parseLong(userId);
        } catch (NumberFormatException e) {
            log.debug("User ID is not a number, using hash code: {}", userId);
            // 如果用户ID不是数字，使用hashCode转换为Long
            return (long) userId.hashCode();
        }
    }

    /**
     * 截断内容到指定长度
     */
    private String truncateContent(String content, int maxLength) {
        if (content == null) {
            return "新消息";
        }
        if (content.length() <= maxLength) {
            return content;
        }
        return content.substring(0, maxLength) + "...";
    }

    /**
     * 清除用户的推送抑制状态（用于测试或管理）
     */
    public void clearSuppression(String receiverId) {
        String key = PUSH_SUPPRESSION_PREFIX + receiverId;
        redisTemplate.delete(key);
        log.info("Cleared push suppression for user: {}", receiverId);
    }

    /**
     * 检查用户剩余抑制时间（秒）
     */
    public long getSuppressionRemainingTime(String receiverId) {
        String key = PUSH_SUPPRESSION_PREFIX + receiverId;
        Long ttl = redisTemplate.getExpire(key, TimeUnit.SECONDS);
        return ttl != null && ttl > 0 ? ttl : 0;
    }

    /**
     * 发送测试通知（用于测试接口）
     * 直接发送通知，不进行抑制检查
     */
    public void sendTestNotification(NotificationMessage notification) {
        try {
            rabbitTemplate.convertAndSend(
                    RabbitMQConfig.NOTIFICATION_EXCHANGE,
                    RabbitMQConfig.NOTIFICATION_ROUTING_KEY,
                    notification);
            log.info("Test notification sent successfully: receiverId={}, type={}, title={}",
                    notification.getReceiverId(), notification.getType(), notification.getTitle());
        } catch (Exception e) {
            log.error("Failed to send test notification: receiverId={}, type={}",
                    notification.getReceiverId(), notification.getType(), e);
            throw e;
        }
    }
}