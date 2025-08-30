package com.airis.chat.service;

import com.airis.chat.entity.DisconnectNotification;
import com.airis.chat.entity.WebSocketMessage;
import com.airis.chat.producer.MessageProducer;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;

import java.io.IOException;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArraySet;
import java.util.concurrent.CompletableFuture;

/**
 * WebSocket会话管理器
 * 管理用户的WebSocket连接，支持一个用户多个连接
 *
 * @author AIRIS Team
 * @since 1.0.0
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class WebSocketSessionManager {

    private final ObjectMapper objectMapper;
    private final UserOnlineService userOnlineService;
    private final MessageProducer messageProducer;

    // 用户ID -> WebSocket会话集合的映射
    private final Map<String, Set<WebSocketSession>> userSessions = new ConcurrentHashMap<>();

    // 用户ID -> 推送失败信息的映射
    private final Map<String, FailedPushInfo> failedPushCache = new ConcurrentHashMap<>();

    // 推送失败过期时间：40秒
    private static final long FAILED_PUSH_EXPIRE_TIME = 40 * 1000L;

    /**
     * 推送失败信息
     */
    private static class FailedPushInfo {
        private final long firstFailedTime;
        private boolean notified;

        public FailedPushInfo() {
            this.firstFailedTime = System.currentTimeMillis();
            this.notified = false;
        }

        public long getFirstFailedTime() {
            return firstFailedTime;
        }

        public boolean isNotified() {
            return notified;
        }

        public void setNotified(boolean notified) {
            this.notified = notified;
        }

        public boolean isExpired() {
            return System.currentTimeMillis() - firstFailedTime > FAILED_PUSH_EXPIRE_TIME;
        }
    }

    /**
     * 添加WebSocket会话
     * 一个用户只能有一个连接，新连接会替换旧连接
     */
    public void addSession(String userId, WebSocketSession session) {
        Set<WebSocketSession> existingSessions = userSessions.get(userId);

        // 如果用户已经有连接，先关闭旧连接
        if (existingSessions != null && !existingSessions.isEmpty()) {
            log.info("User {} already has {} session(s), closing old connections", userId, existingSessions.size());
            for (WebSocketSession existingSession : existingSessions) {
                try {
                    if (existingSession.isOpen()) {
                        // 发送替换通知
                        String replaceMessage = objectMapper.writeValueAsString(
                                WebSocketMessage.builder()
                                        .type(WebSocketMessage.WebSocketMessageType.ERROR)
                                        .senderId("system")
                                        .content("Connection replaced by new session")
                                        .timestamp(System.currentTimeMillis())
                                        .build());
                        existingSession.sendMessage(new TextMessage(replaceMessage));
                        existingSession.close();
                    }
                } catch (Exception e) {
                    log.warn("Failed to close existing session for user: {}", userId, e);
                }
            }
            // 清除旧会话
            userSessions.remove(userId);
        }

        // 添加新会话
        userSessions.computeIfAbsent(userId, k -> new CopyOnWriteArraySet<>()).add(session);
        log.info("Added WebSocket session for user: {}, replaced old connections", userId);
    }

    /**
     * 移除WebSocket会话
     */
    public void removeSession(String userId, WebSocketSession session) {
        Set<WebSocketSession> sessions = userSessions.get(userId);
        if (sessions != null) {
            sessions.remove(session);
            if (sessions.isEmpty()) {
                userSessions.remove(userId);
            }
            log.info("Removed WebSocket session for user: {}, remaining sessions: {}",
                    userId, sessions.size());
        }
    }

    /**
     * 获取用户的所有WebSocket会话
     */
    public Set<WebSocketSession> getUserSessions(String userId) {
        return userSessions.getOrDefault(userId, new CopyOnWriteArraySet<>());
    }

    /**
     * 检查用户是否在线（是否有活跃的WebSocket连接）
     */
    public boolean isUserOnline(String userId) {
        Set<WebSocketSession> sessions = userSessions.get(userId);
        if (sessions == null || sessions.isEmpty()) {
            return false;
        }

        // 检查是否有开放的连接
        boolean hasOpenConnection = sessions.stream().anyMatch(WebSocketSession::isOpen);

        // 如果没有开放的连接，清理死会话
        if (!hasOpenConnection) {
            userSessions.remove(userId);
            log.debug("Cleaned up dead sessions for user: {}", userId);
        }

        return hasOpenConnection;
    }

    /**
     * 向指定用户发送消息
     */
    public boolean sendMessageToUser(String userId, WebSocketMessage message) {
        Set<WebSocketSession> sessions = getUserSessions(userId);
        if (sessions.isEmpty()) {
            log.debug("No active sessions found for user: {}", userId);
            // 没有会话，清除在线状态
            clearUserOnlineStatusIfNeeded(userId);
            return false;
        }

        String json;
        try {
            json = objectMapper.writeValueAsString(message);
        } catch (Exception e) {
            log.error("Failed to serialize message", e);
            return false;
        }

        boolean sent = false;
        Set<WebSocketSession> deadSessions = new CopyOnWriteArraySet<>();

        for (WebSocketSession session : sessions) {
            if (session.isOpen()) {
                try {
                    session.sendMessage(new TextMessage(json));
                    sent = true;
                    log.debug("Message sent to user {} via session {}", userId, session.getId());
                } catch (IOException e) {
                    log.error("Failed to send message to session: {}", session.getId(), e);
                    // 发送失败的会话标记为死会话
                    deadSessions.add(session);
                }
            } else {
                // 连接已关闭的会话标记为死会话
                deadSessions.add(session);
            }
        }

        // 清理死会话
        if (!deadSessions.isEmpty()) {
            for (WebSocketSession deadSession : deadSessions) {
                removeSession(userId, deadSession);
                log.info("Removed dead WebSocket session for user: {}, sessionId: {}",
                        userId, deadSession.getId());
            }
        }

        // 如果所有会话都失败了，清除在线状态
        if (!sent) {
            log.warn("Failed to send message to user: {} - all sessions are dead", userId);
            clearUserOnlineStatusIfNeeded(userId);

            // 记录推送失败状态（排除系统通知消息，避免循环）
            if (!isSystemNotification(message)) {
                markPushFailed(userId);
            }
        } else {
            // 推送成功，清除失败状态
            clearFailedPushStatus(userId);
        }

        return sent;
    }

    /**
     * 标记用户推送失败
     */
    private void markPushFailed(String userId) {
        // 使用putIfAbsent确保只记录第一次失败的时间
        FailedPushInfo existing = failedPushCache.putIfAbsent(userId, new FailedPushInfo());
        if (existing == null) {
            log.info("Marked push failed for user: {} at {}", userId, System.currentTimeMillis());
        } else {
            log.debug("User {} already has failed push record since {}", userId, existing.getFirstFailedTime());
        }
    }

    /**
     * 检查用户是否有未通知的推送失败
     */
    public boolean hasUnnotifiedFailedPush(String userId) {
        FailedPushInfo info = failedPushCache.get(userId);
        return info != null && !info.isNotified() && !info.isExpired();
    }

    /**
     * 发送推送失败通知给用户
     */
    public void sendFailedPushNotification(String userId) {
        FailedPushInfo info = failedPushCache.get(userId);
        if (info != null && !info.isNotified() && !info.isExpired()) {
            WebSocketMessage notification = WebSocketMessage.builder()
                    .type(WebSocketMessage.WebSocketMessageType.SYSTEM_NOTIFICATION)
                    .senderId("system")
                    .receiverId(userId)
                    .content("您有新消息，请刷新聊天记录")
                    .timestamp(System.currentTimeMillis())
                    .build();

            boolean sent = sendMessageToUser(userId, notification);
            if (sent) {
                info.setNotified(true);
                log.info("Sent failed push notification to user: {}", userId);
            } else {
                log.warn("Failed to send push notification to user: {}", userId);
            }
        }
    }

    /**
     * 清除用户的推送失败状态
     */
    private void clearFailedPushStatus(String userId) {
        FailedPushInfo removed = failedPushCache.remove(userId);
        if (removed != null) {
            log.debug("Cleared failed push status for user: {}", userId);
        }
    }

    /**
     * 用户连接断开时清理推送失败状态
     */
    public void clearFailedPushOnDisconnect(String userId) {
        clearFailedPushStatus(userId);
        log.debug("Cleared failed push status on disconnect for user: {}", userId);
    }

    /**
     * 判断是否为系统通知消息
     */
    private boolean isSystemNotification(WebSocketMessage message) {
        return WebSocketMessage.WebSocketMessageType.SYSTEM_NOTIFICATION.equals(message.getType()) ||
                "system".equals(message.getSenderId());
    }

    /**
     * 定时清理过期的推送失败记录
     */
    @Scheduled(fixedRate = 10000) // 每10秒执行一次
    public void cleanupExpiredFailedPush() {
        int removedCount = 0;
        var iterator = failedPushCache.entrySet().iterator();
        while (iterator.hasNext()) {
            var entry = iterator.next();
            if (entry.getValue().isExpired()) {
                iterator.remove();
                removedCount++;
            }
        }

        if (removedCount > 0) {
            log.debug("Cleaned up {} expired failed push records", removedCount);
        }
    }

    /**
     * 清除用户在线状态（如果需要的话）
     */
    private void clearUserOnlineStatusIfNeeded(String userId) {
        // 检查用户是否还有活跃的WebSocket连接
        if (!isUserOnline(userId)) {
            log.info("Clearing online status for user: {} - no active sessions", userId);
            userOnlineService.setUserOffline(userId);
        }
    }

    /**
     * 广播消息给多个用户
     */
    public void broadcastMessage(Set<String> userIds, WebSocketMessage message) {
        for (String userId : userIds) {
            boolean sent = sendMessageToUser(userId, message);
            if (!sent) {
                log.debug("Failed to broadcast message to user: {}", userId);
            }
        }
    }

    /**
     * 获取当前在线用户数
     */
    public int getOnlineUserCount() {
        return userSessions.size();
    }

    /**
     * 获取当前活跃的WebSocket连接数
     */
    public int getActiveSessionCount() {
        return userSessions.values().stream()
                .mapToInt(Set::size)
                .sum();
    }

    /**
     * 带分布式锁的连接建立方法
     * 确保同一时间只有一个节点能处理用户的连接状态变更
     */
    public boolean addSessionWithLock(String userId, WebSocketSession session) {
        // 尝试获取分布式锁
        if (!userOnlineService.tryAcquireConnectLock(userId)) {
            log.warn("Failed to acquire connect lock for user: {}", userId);
            return false;
        }

        try {
            return handleConnectionWithLock(userId, session);
        } finally {
            userOnlineService.releaseConnectLock(userId);
        }
    }

    /**
     * 在锁保护下处理连接建立
     */
    private boolean handleConnectionWithLock(String userId, WebSocketSession session) {
        try {
            // 标记连接正在建立
            session.getAttributes().put("connectionState", "ESTABLISHING");

            String currentNodeId = userOnlineService.getServerId();

            // 检查用户是否已在其他节点连接
            String existingNodeId = userOnlineService.getUserServer(userId);

            if (existingNodeId != null && !existingNodeId.equals(currentNodeId)) {
                // 异步通知旧节点断开，避免阻塞当前连接建立
                log.info("User {} switching from node {} to node {}",
                        userId, existingNodeId, currentNodeId);

                CompletableFuture.runAsync(() -> notifyNodeDisconnectUser(userId, existingNodeId, currentNodeId));
            }

            // 清理本地旧连接（如果有）
            removeExistingLocalSessions(userId);

            // 建立新连接
            userSessions.computeIfAbsent(userId, k -> new CopyOnWriteArraySet<>()).add(session);

            // 更新Redis状态
            userOnlineService.setUserOnline(userId);

            // 标记连接已建立
            session.getAttributes().put("connectionState", "ESTABLISHED");

            log.info("Successfully established connection for user: {} on node: {}", userId, currentNodeId);
            return true;

        } catch (Exception e) {
            log.error("Failed to handle connection with lock for user: {}", userId, e);
            return false;
        }
    }

    /**
     * 清理本地的旧连接
     */
    private void removeExistingLocalSessions(String userId) {
        Set<WebSocketSession> existingSessions = userSessions.get(userId);

        if (existingSessions != null && !existingSessions.isEmpty()) {
            log.info("Removing {} existing local sessions for user: {}", existingSessions.size(), userId);

            for (WebSocketSession existingSession : existingSessions) {
                try {
                    if (existingSession.isOpen()) {
                        sendConnectionReplacedMessage(existingSession);
                        existingSession.close(CloseStatus.NORMAL);
                    }
                } catch (Exception e) {
                    log.warn("Failed to close existing session for user: {}", userId, e);
                }
            }

            userSessions.remove(userId);
        }
    }

    /**
     * 发送连接被替换的消息
     */
    private void sendConnectionReplacedMessage(WebSocketSession session) {
        try {
            WebSocketMessage message = WebSocketMessage.builder()
                    .type(WebSocketMessage.WebSocketMessageType.CONNECTION_REPLACED)
                    .senderId("system")
                    .content("Connection replaced by new session")
                    .timestamp(System.currentTimeMillis())
                    .build();

            String json = objectMapper.writeValueAsString(message);
            session.sendMessage(new TextMessage(json));

            // 短暂延迟确保消息送达
            Thread.sleep(100);

        } catch (Exception e) {
            log.warn("Failed to send connection replaced message", e);
        }
    }

    /**
     * 通知指定节点断开用户连接
     */
    private void notifyNodeDisconnectUser(String userId, String targetNodeId, String currentNodeId) {
        try {
            DisconnectNotification notification = DisconnectNotification.builder()
                    .userId(userId)
                    .targetNodeId(targetNodeId)
                    .sourceNodeId(currentNodeId)
                    .reason("Connection switched to another node")
                    .timestamp(System.currentTimeMillis())
                    .build();

            messageProducer.sendDisconnectNotification(notification);
            log.debug("Sent disconnect notification: userId={}, targetNode={}", userId, targetNodeId);

        } catch (Exception e) {
            log.error("Failed to notify node disconnect: userId={}, targetNode={}", userId, targetNodeId, e);
        }
    }

    /**
     * 向用户发送通知并断开连接
     * 用于处理来自其他节点的断开通知
     */
    public boolean disconnectUserWithNotification(String userId, String reason) {
        Set<WebSocketSession> sessions = getUserSessions(userId);

        if (sessions.isEmpty()) {
            log.debug("No sessions found for user: {} to disconnect", userId);
            return false;
        }

        boolean disconnected = false;

        for (WebSocketSession session : sessions) {
            try {
                if (session.isOpen()) {
                    // 发送断开通知
                    WebSocketMessage notification = WebSocketMessage.builder()
                            .type(WebSocketMessage.WebSocketMessageType.CONNECTION_REPLACED)
                            .senderId("system")
                            .content(reason != null ? reason : "Connection terminated")
                            .timestamp(System.currentTimeMillis())
                            .build();

                    String json = objectMapper.writeValueAsString(notification);
                    session.sendMessage(new TextMessage(json));

                    // 短暂延迟后断开
                    Thread.sleep(100);
                    session.close(CloseStatus.NORMAL);

                    disconnected = true;
                    log.debug("Disconnected session for user: {}, reason: {}", userId, reason);
                }
            } catch (Exception e) {
                log.warn("Failed to disconnect session for user: {}", userId, e);
            }
        }

        if (disconnected) {
            // 清理用户会话
            userSessions.remove(userId);

            // 重要：不调用setUserOffline，因为用户可能已经在其他节点上线
            // Redis状态由TTL自然过期或者由用户真正离线时清理
            log.debug("Disconnected user: {} from current node, but keeping Redis online status " +
                    "as user may be active on another node", userId);
        }

        return disconnected;
    }
}