package com.airis.chat.producer;

import com.airis.chat.entity.DisconnectNotification;
import com.airis.chat.entity.WebSocketMessage;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.rocketmq.spring.core.RocketMQTemplate;
import org.springframework.messaging.Message;
import org.springframework.messaging.support.MessageBuilder;
import org.springframework.stereotype.Component;

/**
 * RocketMQ消息生产者
 * 用于发送消息到其他服务器节点或离线推送
 *
 * @author AIRIS Team
 * @since 1.0.0
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class MessageProducer {

    private final RocketMQTemplate rocketMQTemplate;
    private final ObjectMapper objectMapper;

    // 主题定义
    private static final String TOPIC_CHAT_MESSAGE_PREFIX = "TOPIC_CHAT_MESSAGE_";
    private static final String TOPIC_OFFLINE_PUSH = "TOPIC_OFFLINE_PUSH";
    private static final String TOPIC_READ_RECEIPT_PREFIX = "TOPIC_READ_RECEIPT_";
    private static final String TOPIC_DISCONNECT_NOTIFY_PREFIX = "TOPIC_DISCONNECT_NOTIFY_";

    /**
     * 发送消息到特定服务器节点
     * 
     * @param wsMessage      消息内容
     * @param targetServerId 目标服务器节点ID
     */
    public void sendToSpecificServer(WebSocketMessage wsMessage, String targetServerId) {
        try {
            String targetTopic = TOPIC_CHAT_MESSAGE_PREFIX + targetServerId;
            String json = objectMapper.writeValueAsString(wsMessage);
            Message<String> message = MessageBuilder
                    .withPayload(json)
                    .setHeader("receiverId", wsMessage.getReceiverId())
                    .setHeader("targetServerId", targetServerId)
                    .build();

            rocketMQTemplate.syncSend(targetTopic, message);
            log.info(
                    "Message sent to specific server via RocketMQ: messageId={}, receiverId={}, targetServer={}, topic={}",
                    wsMessage.getMessageId(), wsMessage.getReceiverId(), targetServerId, targetTopic);

        } catch (Exception e) {
            log.error("Failed to send message to specific server: {}", targetServerId, e);
        }
    }

    /**
     * 发送消息到其他服务器 (已废弃，使用sendToSpecificServer代替)
     * 
     * @deprecated 使用 {@link #sendToSpecificServer(WebSocketMessage, String)} 代替
     */
    @Deprecated
    public void sendToOtherServer(WebSocketMessage wsMessage) {
        log.warn("sendToOtherServer is deprecated, please use sendToSpecificServer instead");
        // 这个方法保留是为了向后兼容，但不应该再使用
        try {
            String json = objectMapper.writeValueAsString(wsMessage);
            Message<String> message = MessageBuilder
                    .withPayload(json)
                    .setHeader("receiverId", wsMessage.getReceiverId())
                    .build();

            // 发送到默认topic（这不是推荐的做法）
            rocketMQTemplate.syncSend("TOPIC_CHAT_MESSAGE", message);
            log.warn("Message sent via deprecated method: messageId={}, receiverId={}",
                    wsMessage.getMessageId(), wsMessage.getReceiverId());

        } catch (Exception e) {
            log.error("Failed to send message via deprecated method", e);
        }
    }

    /**
     * 发送离线推送消息 (已废弃，使用OfflinePushService代替)
     * 
     * @deprecated 使用 OfflinePushService.sendOfflinePush 代替
     */
    @Deprecated
    public void sendOfflinePush(WebSocketMessage wsMessage) {
        log.warn("sendOfflinePush is deprecated, please use OfflinePushService instead");
        try {
            String json = objectMapper.writeValueAsString(wsMessage);
            Message<String> message = MessageBuilder
                    .withPayload(json)
                    .setHeader("receiverId", wsMessage.getReceiverId())
                    .setHeader("pushType", "CHAT_MESSAGE")
                    .build();

            rocketMQTemplate.syncSend(TOPIC_OFFLINE_PUSH, message);
            log.warn("Offline push message sent via deprecated method: messageId={}, receiverId={}",
                    wsMessage.getMessageId(), wsMessage.getReceiverId());

        } catch (Exception e) {
            log.error("Failed to send offline push via deprecated method", e);
        }
    }

    /**
     * 发送已读回执到特定服务器节点
     * 
     * @param readReceipt    已读回执消息
     * @param targetServerId 目标服务器节点ID
     */
    public void sendReadReceiptToSpecificServer(WebSocketMessage readReceipt, String targetServerId) {
        try {
            String targetTopic = TOPIC_READ_RECEIPT_PREFIX + targetServerId;
            String json = objectMapper.writeValueAsString(readReceipt);
            Message<String> message = MessageBuilder
                    .withPayload(json)
                    .setHeader("receiverId", readReceipt.getReceiverId())
                    .setHeader("targetServerId", targetServerId)
                    .build();

            rocketMQTemplate.syncSend(targetTopic, message);
            log.info("Read receipt sent to specific server: chatId={}, receiverId={}, targetServer={}, topic={}",
                    readReceipt.getChatId(), readReceipt.getReceiverId(), targetServerId, targetTopic);

        } catch (Exception e) {
            log.error("Failed to send read receipt to specific server: {}", targetServerId, e);
        }
    }

    /**
     * 发送已读回执到其他服务器 (已废弃，使用sendReadReceiptToSpecificServer代替)
     * 
     * @deprecated 使用
     *             {@link #sendReadReceiptToSpecificServer(WebSocketMessage, String)}
     *             代替
     */
    @Deprecated
    public void sendReadReceiptToOtherServer(WebSocketMessage readReceipt) {
        log.warn("sendReadReceiptToOtherServer is deprecated, please use sendReadReceiptToSpecificServer instead");
        try {
            String json = objectMapper.writeValueAsString(readReceipt);
            Message<String> message = MessageBuilder
                    .withPayload(json)
                    .setHeader("receiverId", readReceipt.getReceiverId())
                    .build();

            // 发送到默认topic（这不是推荐的做法）
            rocketMQTemplate.syncSend("TOPIC_READ_RECEIPT", message);
            log.warn("Read receipt sent via deprecated method: chatId={}, receiverId={}",
                    readReceipt.getChatId(), readReceipt.getReceiverId());

        } catch (Exception e) {
            log.error("Failed to send read receipt via deprecated method", e);
        }
    }

    /**
     * 发送断开连接通知到特定服务器节点
     * 
     * @param notification 断开连接通知
     */
    public void sendDisconnectNotification(DisconnectNotification notification) {
        try {
            String targetTopic = TOPIC_DISCONNECT_NOTIFY_PREFIX + notification.getTargetNodeId();
            String json = objectMapper.writeValueAsString(notification);
            Message<String> message = MessageBuilder
                    .withPayload(json)
                    .setHeader("userId", notification.getUserId())
                    .setHeader("targetNodeId", notification.getTargetNodeId())
                    .setHeader("sourceNodeId", notification.getSourceNodeId())
                    .build();

            rocketMQTemplate.syncSend(targetTopic, message);
            log.info("Disconnect notification sent: userId={}, targetNode={}, sourceNode={}, topic={}",
                    notification.getUserId(), notification.getTargetNodeId(),
                    notification.getSourceNodeId(), targetTopic);

        } catch (Exception e) {
            log.error("Failed to send disconnect notification: userId={}, targetNode={}",
                    notification.getUserId(), notification.getTargetNodeId(), e);
        }
    }
}