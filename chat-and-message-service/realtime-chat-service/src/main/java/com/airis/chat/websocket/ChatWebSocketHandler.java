package com.airis.chat.websocket;

import com.airis.chat.entity.WebSocketMessage;
import com.airis.chat.service.MessageHandlerService;
import com.airis.chat.service.UserOnlineService;
import com.airis.chat.service.WebSocketSessionManager;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

/**
 * WebSocket消息处理器
 * 处理WebSocket连接、消息收发和断开连接
 *
 * @author AIRIS Team
 * @since 1.0.0
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class ChatWebSocketHandler extends TextWebSocketHandler {

    private final WebSocketSessionManager sessionManager;
    private final UserOnlineService userOnlineService;
    private final MessageHandlerService messageHandlerService;
    private final ObjectMapper objectMapper;

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        String userId = getUserId(session);
        if (userId != null) {
            // 使用带锁的连接建立流程
            boolean success = sessionManager.addSessionWithLock(userId, session);

            if (success) {
                log.info("WebSocket connection established - userId: {}, sessionId: {}",
                        userId, session.getId());

                // 发送连接成功消息
                sendMessage(session, WebSocketMessage.builder()
                        .type(WebSocketMessage.WebSocketMessageType.CONNECTED)
                        .content("Connection established")
                        .build());

                // 检查是否有未通知的推送失败，如果有则发送通知
                if (sessionManager.hasUnnotifiedFailedPush(userId)) {
                    sessionManager.sendFailedPushNotification(userId);
                }
            } else {
                // 连接建立失败，关闭连接
                log.warn("Failed to establish connection for user: {}, closing session", userId);
                sendMessage(session, WebSocketMessage.builder()
                        .type(WebSocketMessage.WebSocketMessageType.ERROR)
                        .content("Connection failed due to concurrent connection")
                        .build());
                session.close(CloseStatus.SERVER_ERROR);
            }
        }
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        String userId = getUserId(session);
        if (userId == null) {
            return;
        }

        try {
            // 解析消息
            WebSocketMessage wsMessage = objectMapper.readValue(message.getPayload(), WebSocketMessage.class);
            wsMessage.setSenderId(userId);

            log.debug("Received message from user {}: {}", userId, wsMessage);

            // 根据消息类型处理
            switch (wsMessage.getType()) {
                case CHAT_MESSAGE:
                    messageHandlerService.handleChatMessage(wsMessage);
                    break;
                case HEARTBEAT:
                    handleHeartbeat(session, userId);
                    break;
                case READ_RECEIPT:
                    messageHandlerService.handleReadReceipt(wsMessage);
                    break;
                case TYPING:
                    messageHandlerService.handleTypingStatus(wsMessage);
                    break;
                default:
                    log.warn("Unknown message type: {}", wsMessage.getType());
            }
        } catch (Exception e) {
            log.error("Error handling WebSocket message", e);
            sendError(session, "Failed to process message");
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        String userId = getUserId(session);
        if (userId != null) {
            // 移除WebSocket会话
            sessionManager.removeSession(userId, session);

            // 只有完全建立的连接才需要清理在线状态
            String connectionState = (String) session.getAttributes().get("connectionState");
            if ("ESTABLISHED".equals(connectionState)) {
                // 安全地更新用户离线状态（仅当用户确实在当前节点时）
                boolean offlineSet = userOnlineService.setUserOfflineIfOnCurrentNode(userId);

                // 清理推送失败状态
                sessionManager.clearFailedPushOnDisconnect(userId);

                if (!offlineSet) {
                    log.debug("User {} connection closed but user is active on another node", userId);
                }
            }

            log.info("WebSocket connection closed - userId: {}, sessionId: {}, status: {}, connectionState: {}",
                    userId, session.getId(), status, connectionState);
        }
    }

    @Override
    public void handleTransportError(WebSocketSession session, Throwable exception) throws Exception {
        String userId = getUserId(session);
        log.error("WebSocket transport error - userId: {}, sessionId: {}",
                userId, session.getId(), exception);

        if (session.isOpen()) {
            session.close(CloseStatus.SERVER_ERROR);
        }
    }

    private void handleHeartbeat(WebSocketSession session, String userId) throws Exception {
        log.debug("Received heartbeat from user: {}, sessionId: {}", userId, session.getId());

        // 更新用户活跃时间
        userOnlineService.updateUserActivity(userId);

        // 回复心跳
        sendMessage(session, WebSocketMessage.builder()
                .type(WebSocketMessage.WebSocketMessageType.HEARTBEAT_ACK)
                .content("pong")
                .build());

        // 检查是否有未通知的推送失败，如果有则发送通知
        if (sessionManager.hasUnnotifiedFailedPush(userId)) {
            sessionManager.sendFailedPushNotification(userId);
        }

        log.info("Heartbeat processed for user: {}, activity updated and ACK sent", userId);
    }

    private void sendMessage(WebSocketSession session, WebSocketMessage message) throws Exception {
        if (session.isOpen()) {
            String json = objectMapper.writeValueAsString(message);
            session.sendMessage(new TextMessage(json));
        }
    }

    private void sendError(WebSocketSession session, String error) throws Exception {
        sendMessage(session, WebSocketMessage.builder()
                .type(WebSocketMessage.WebSocketMessageType.ERROR)
                .content(error)
                .build());
    }

    private String getUserId(WebSocketSession session) {
        Object userId = session.getAttributes().get("userId");
        return userId != null ? userId.toString() : null;
    }
}