package com.airis.chat.listener;

import com.airis.chat.entity.DisconnectNotification;
import com.airis.chat.entity.WebSocketMessage;
import com.airis.chat.service.WebSocketSessionManager;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.rocketmq.spring.annotation.RocketMQMessageListener;
import org.apache.rocketmq.spring.core.RocketMQListener;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * RocketMQ消息监听器
 * 接收来自其他服务器节点的消息
 * 使用条件处理确保消息被正确处理
 *
 * @author AIRIS Team
 * @since 1.0.0
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class MessageListener {

    private final WebSocketSessionManager sessionManager;
    private final ObjectMapper objectMapper;

    @Value("${airis.chat.server-id:server-1}")
    private String serverId;

    /**
     * 监听聊天消息
     * 每个节点只监听属于自己的topic，实现精确路由
     * topic格式: TOPIC_CHAT_MESSAGE_{server-id}
     */
    @Component
    @RocketMQMessageListener(topic = "TOPIC_CHAT_MESSAGE_${airis.chat.server-id:server-1}", consumerGroup = "realtime-chat-consumer-group-${airis.chat.server-id:server-1}")
    public class ChatMessageListener implements RocketMQListener<String> {

        @Override
        public void onMessage(String message) {
            try {
                WebSocketMessage wsMessage = objectMapper.readValue(message, WebSocketMessage.class);
                log.info("Received chat message from RocketMQ on {}: messageId={}, receiverId={}",
                        serverId, wsMessage.getMessageId(), wsMessage.getReceiverId());

                // 由于消息已经精确路由到当前节点，直接处理即可
                // 但仍然需要检查用户是否在线，以防止Redis数据不一致的情况
                if (sessionManager.isUserOnline(wsMessage.getReceiverId())) {
                    boolean sent = sessionManager.sendMessageToUser(wsMessage.getReceiverId(), wsMessage);

                    if (sent) {
                        log.info("Successfully delivered message to user: {} on node: {}",
                                wsMessage.getReceiverId(), serverId);
                    } else {
                        log.warn("Failed to deliver message to user: {} on node: {} - user may have disconnected, " +
                                "online status will be cleared automatically", wsMessage.getReceiverId(), serverId);
                    }
                } else {
                    log.warn("User {} not connected to this node: {} - message routed incorrectly or user disconnected",
                            wsMessage.getReceiverId(), serverId);
                }

            } catch (Exception e) {
                log.error("Failed to process chat message from RocketMQ on node: " + serverId, e);
            }
        }
    }

    /**
     * 监听已读回执
     * 每个节点只监听属于自己的topic，实现精确路由
     * topic格式: TOPIC_READ_RECEIPT_{server-id}
     */
    @Component
    @RocketMQMessageListener(topic = "TOPIC_READ_RECEIPT_${airis.chat.server-id:server-1}", consumerGroup = "realtime-chat-read-receipt-group-${airis.chat.server-id:server-1}")
    public class ReadReceiptListener implements RocketMQListener<String> {

        @Override
        public void onMessage(String message) {
            try {
                WebSocketMessage readReceipt = objectMapper.readValue(message, WebSocketMessage.class);
                log.info("Received read receipt from RocketMQ on {}: chatId={}, receiverId={}",
                        serverId, readReceipt.getChatId(), readReceipt.getReceiverId());

                // 由于消息已经精确路由到当前节点，直接处理即可
                // 但仍然需要检查用户是否在线，以防止Redis数据不一致的情况
                if (sessionManager.isUserOnline(readReceipt.getReceiverId())) {
                    boolean sent = sessionManager.sendMessageToUser(readReceipt.getReceiverId(), readReceipt);
                    if (sent) {
                        log.info("Successfully delivered read receipt to user: {} on node: {}",
                                readReceipt.getReceiverId(), serverId);
                    } else {
                        log.warn(
                                "Failed to deliver read receipt to user: {} on node: {} - user may have disconnected, "
                                        +
                                        "online status will be cleared automatically",
                                readReceipt.getReceiverId(), serverId);
                    }
                } else {
                    log.warn(
                            "User {} not connected to this node: {} - read receipt routed incorrectly or user disconnected",
                            readReceipt.getReceiverId(), serverId);
                }

            } catch (Exception e) {
                log.error("Failed to process read receipt from RocketMQ on node: " + serverId, e);
            }
        }
    }

    /**
     * 监听断开连接通知
     * 每个节点只监听属于自己的topic，实现精确路由
     * topic格式: TOPIC_DISCONNECT_NOTIFY_{server-id}
     */
    @Component
    @RocketMQMessageListener(topic = "TOPIC_DISCONNECT_NOTIFY_${airis.chat.server-id:server-1}", consumerGroup = "disconnect-notify-group-${airis.chat.server-id:server-1}")
    public class DisconnectNotificationListener implements RocketMQListener<String> {

        @Override
        public void onMessage(String message) {
            try {
                DisconnectNotification notification = objectMapper.readValue(message, DisconnectNotification.class);
                log.info("Received disconnect notification on {}: userId={}, from node={}, reason={}",
                        serverId, notification.getUserId(),
                        notification.getSourceNodeId(), notification.getReason());

                // 检查用户是否在当前节点有连接
                if (sessionManager.isUserOnline(notification.getUserId())) {
                    // 向用户发送连接替换通知并断开连接
                    boolean disconnected = sessionManager.disconnectUserWithNotification(
                            notification.getUserId(),
                            notification.getReason());

                    if (disconnected) {
                        log.info("Successfully disconnected user: {} on node: {} due to: {}",
                                notification.getUserId(), serverId, notification.getReason());
                    } else {
                        log.warn("Failed to disconnect user: {} on node: {} - user may have already disconnected",
                                notification.getUserId(), serverId);
                    }
                } else {
                    log.debug("User {} not found on node: {} - may have already disconnected or notification late",
                            notification.getUserId(), serverId);
                }

            } catch (Exception e) {
                log.error("Failed to process disconnect notification on node: " + serverId, e);
            }
        }
    }
}