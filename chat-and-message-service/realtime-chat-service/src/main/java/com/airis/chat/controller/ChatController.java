package com.airis.chat.controller;

import com.airis.chat.entity.NotificationMessage;
import com.airis.chat.response.OnlineStatusResponse;
import com.airis.chat.security.SkipAuthentication;
import com.airis.chat.service.MediaServiceClient;
import com.airis.chat.service.OfflinePushService;
import com.airis.chat.service.UserOnlineService;
import com.airis.chat.service.WebSocketSessionManager;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.Map;

/**
 * 聊天服务控制器
 * 提供REST API接口
 *
 * @author AIRIS Team
 * @since 1.0.0
 */
@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
//@CrossOrigin(originPatterns = "*", maxAge = 3600)
public class ChatController {

    private final UserOnlineService userOnlineService;
    private final WebSocketSessionManager sessionManager;
    private final MediaServiceClient mediaServiceClient;
    private final OfflinePushService offlinePushService;

    /**
     * 健康检查
     */
    @GetMapping("/health")
    @SkipAuthentication
    public Map<String, Object> health() {
        Map<String, Object> result = new HashMap<>();
        result.put("status", "UP");
        result.put("service", "realtime-chat-service");
        result.put("timestamp", System.currentTimeMillis());
        return result;
    }

    /**
     * 获取用户在线状态
     */
    @GetMapping("/online/status/{userId}")
    public OnlineStatusResponse getUserOnlineStatus(@PathVariable String userId) {
        boolean isOnline = userOnlineService.isUserOnline(userId);
        String server = isOnline ? userOnlineService.getUserServer(userId) : null;

        return OnlineStatusResponse.builder()
                .userId(userId)
                .online(isOnline)
                .server(server)
                .timestamp(System.currentTimeMillis())
                .build();
    }

    /**
     * 获取在线用户统计
     */
    @GetMapping("/online/stats")
    public Map<String, Object> getOnlineStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalOnlineUsers", userOnlineService.getOnlineUserCount());
        stats.put("localOnlineUsers", sessionManager.getOnlineUserCount());
        stats.put("activeWebSocketSessions", sessionManager.getActiveSessionCount());
        stats.put("timestamp", System.currentTimeMillis());
        return stats;
    }

    /**
     * 上传媒体文件
     */
    @PostMapping("/upload-media")
    public ResponseEntity<Map<String, Object>> uploadMedia(
            @RequestParam("file") MultipartFile file,
            @RequestParam("senderId") String senderId,
            @RequestParam("receiverId") String receiverId) {

        Map<String, Object> response = new HashMap<>();

        try {
            // Validate file
            if (file.isEmpty()) {
                response.put("success", false);
                response.put("error", "File is empty");
                return ResponseEntity.badRequest().body(response);
            }

            // Validate file size (max 50MB)
            if (file.getSize() > 50 * 1024 * 1024) {
                response.put("success", false);
                response.put("error", "File size exceeds 50MB limit");
                return ResponseEntity.badRequest().body(response);
            }

            // Validate sender and receiver IDs
            if (senderId == null || senderId.trim().isEmpty()) {
                response.put("success", false);
                response.put("error", "Sender ID is required");
                return ResponseEntity.badRequest().body(response);
            }

            if (receiverId == null || receiverId.trim().isEmpty()) {
                response.put("success", false);
                response.put("error", "Receiver ID is required");
                return ResponseEntity.badRequest().body(response);
            }

            // Upload file to media service
            String mediaUrl = mediaServiceClient.uploadChatFile(file, senderId, receiverId);

            response.put("success", true);
            response.put("url", mediaUrl);
            response.put("fileName", file.getOriginalFilename());
            response.put("fileSize", file.getSize());
            response.put("contentType", file.getContentType());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            response.put("success", false);
            response.put("error", "Failed to upload file: " + e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }

    /**
     * 发送通知到通知模块（测试用）
     */
    @PostMapping("/send-notification")
    public ResponseEntity<Map<String, Object>> sendNotification(@RequestBody NotificationMessage notification) {
        Map<String, Object> response = new HashMap<>();

        try {
            // 这里可以直接使用offlinePushService的RabbitTemplate
            // 但为了测试，我们创建一个简单的包装
            if (notification.getReceiverId() == null) {
                response.put("success", false);
                response.put("error", "receiverId is required");
                return ResponseEntity.badRequest().body(response);
            }

            if (notification.getType() == null ||
                    (!notification.getType().equals("match") &&
                            !notification.getType().equals("chat") &&
                            !notification.getType().equals("media"))) {
                response.put("success", false);
                response.put("error", "type must be one of: match, chat, media");
                return ResponseEntity.badRequest().body(response);
            }

            // 使用离线推送服务的RabbitTemplate发送通知
            offlinePushService.sendTestNotification(notification);

            response.put("success", true);
            response.put("message", "✅ Sent to MQ!");
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            response.put("success", false);
            response.put("error", "Failed to send notification: " + e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }

    /**
     * 清除用户的推送抑制状态
     */
    @DeleteMapping("/push-suppression/{userId}")
    public ResponseEntity<Map<String, Object>> clearPushSuppression(@PathVariable String userId) {
        Map<String, Object> response = new HashMap<>();

        try {
            offlinePushService.clearSuppression(userId);
            response.put("success", true);
            response.put("message", "Push suppression cleared for user: " + userId);
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            response.put("success", false);
            response.put("error", "Failed to clear push suppression: " + e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }

    /**
     * 获取用户的推送抑制剩余时间
     */
    @GetMapping("/push-suppression/{userId}")
    public ResponseEntity<Map<String, Object>> getPushSuppressionStatus(@PathVariable String userId) {
        Map<String, Object> response = new HashMap<>();

        try {
            long remainingTime = offlinePushService.getSuppressionRemainingTime(userId);
            response.put("userId", userId);
            response.put("suppressed", remainingTime > 0);
            response.put("remainingTimeSeconds", remainingTime);
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            response.put("success", false);
            response.put("error", "Failed to get push suppression status: " + e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }
}