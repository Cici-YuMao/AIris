package com.airis.chat.service;

import com.airis.chat.entity.WebSocketMessage;
import com.airis.chat.producer.MessageProducer;
import com.airis.message.dto.MessageDTO;
import com.airis.message.dubbo.MessageDubboService;
import com.airis.message.enums.MessageType;
import com.airis.message.request.MarkReadRequest;
import com.airis.message.request.SendMessageRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.dubbo.config.annotation.DubboReference;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/**
 * 消息处理服务
 * 处理各种类型的消息，包括聊天消息、已读回执、输入状态等
 *
 * @author AIRIS Team
 * @since 1.0.0
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class MessageHandlerService {

    private final WebSocketSessionManager sessionManager;
    private final UserOnlineService userOnlineService;
    private final MessageProducer messageProducer;
//    private final ContentModerationService contentModerationService;
    private final OfflinePushService offlinePushService;

    @DubboReference(version = "1.0.0", timeout = 5000, check = false)
    private MessageDubboService messageDubboService;

    /**
     * 处理聊天消息
     */
    public void handleChatMessage(WebSocketMessage wsMessage) {
        try {
            // 确保发送者在线状态（处理超时后重新发消息的情况）
            userOnlineService.updateUserActivity(wsMessage.getSenderId());

            // 生成服务器端消息ID
            String messageId = generateMessageId();
            wsMessage.setMessageId(messageId);

            // 保存客户端传来的临时消息ID用于后续确认
            String tempMessageId = wsMessage.getTempMessageId();


            // 构建发送消息请求
            SendMessageRequest request = buildSendMessageRequest(wsMessage);

            // 调用MessageService保存消息，必须确保保存成功
            MessageDTO savedMessage = null;
            try {
                savedMessage = messageDubboService.saveMessage(request);
                wsMessage.setTimestamp(savedMessage.getTimestamp());
                log.info("Successfully saved message to database: messageId={}, tempMessageId={}, chatId={}",
                        messageId, tempMessageId, wsMessage.getChatId());

                // 只有保存成功后才进行消息推送和确认
                // 发送消息给接收者
                sendMessageToReceiver(wsMessage);

                // 发送消息确认给发送者
                sendMessageAck(wsMessage, tempMessageId);

                log.debug("Message processing completed successfully: messageId={}, tempMessageId={}",
                        messageId, tempMessageId);

            } catch (Exception dubboException) {
                // 消息保存失败，记录错误并通知发送者
                log.error("Failed to save message to database: messageId={}, tempMessageId={}, chatId={}, senderId={}",
                        messageId, tempMessageId, wsMessage.getChatId(), wsMessage.getSenderId(), dubboException);

                // 发送错误消息给发送者，明确告知发送失败
                sendErrorToSender(wsMessage.getSenderId(), "消息发送失败，请重试", tempMessageId);

                // 不推送给接收者，不发送确认，确保数据一致性
                return;
            }

        } catch (Exception e) {
            log.error("Failed to handle chat message: senderId={}, receiverId={}, tempMessageId={}",
                    wsMessage.getSenderId(), wsMessage.getReceiverId(), wsMessage.getTempMessageId(), e);
            sendErrorToSender(wsMessage.getSenderId(), "消息发送失败", wsMessage.getTempMessageId());
        }
    }

    /**
     * 处理已读回执
     */
    public void handleReadReceipt(WebSocketMessage wsMessage) {
        try {
            // 提取消息ID
            String messageId = extractMessageId(wsMessage);
            if (messageId == null || messageId.isEmpty()) {
                log.warn("Cannot handle read receipt: messageId is missing");
                return;
            }

            // 构建标记已读请求
            MarkReadRequest request = MarkReadRequest.builder()
                    .chatId(wsMessage.getChatId())
                    .userId(wsMessage.getSenderId())
                    .messageId(messageId)
                    .build();

            // 调用MessageService标记已读，增加异常处理
            try {
                messageDubboService.markMessagesAsRead(request);
                log.debug("Successfully marked message as read: messageId={}, userId={}",
                        messageId, wsMessage.getSenderId());
            } catch (Exception dubboException) {
                // 处理Dubbo调用异常，包括序列化异常
                log.error("Failed to mark message as read via Dubbo service: messageId={}, userId={}",
                        messageId, wsMessage.getSenderId(), dubboException);

                // 即使标记已读失败，也应该通知发送者，避免用户体验问题
                log.info("Proceeding with read receipt notification despite mark-as-read failure");
            }

            // 无论标记已读是否成功，都发送已读回执通知
            notifyMessageRead(wsMessage);

        } catch (Exception e) {
            log.error("Failed to handle read receipt: messageId={}",
                    extractMessageId(wsMessage), e);
        }
    }

    /**
     * 处理输入状态
     */
    public void handleTypingStatus(WebSocketMessage wsMessage) {
        // 直接转发输入状态给接收者
        if (userOnlineService.isUserOnline(wsMessage.getReceiverId())) {
            sessionManager.sendMessageToUser(wsMessage.getReceiverId(), wsMessage);
        }
    }

    /**
     * 发送消息给接收者
     */
    private void sendMessageToReceiver(WebSocketMessage wsMessage) {
        String receiverId = wsMessage.getReceiverId();

        // 检查接收者是否在线
        if (userOnlineService.isUserOnline(receiverId)) {
            // 检查接收者是否在当前服务器
            if (sessionManager.isUserOnline(receiverId)) {
                // 直接发送
                sessionManager.sendMessageToUser(receiverId, wsMessage);
                log.debug("Message delivered locally to user: {}", receiverId);
            } else {
                // 获取接收者所在的服务器节点
                String targetServerId = userOnlineService.getUserServer(receiverId);
                if (targetServerId != null && !targetServerId.isEmpty()) {
                    // 精确发送到目标服务器节点
                    messageProducer.sendToSpecificServer(wsMessage, targetServerId);
                    log.debug("Message sent to specific server: {} for user: {}", targetServerId, receiverId);
                } else {
                    log.warn("Cannot determine target server for user: {}, using deprecated broadcast method",
                            receiverId);
                    // 降级到旧方法
                    messageProducer.sendToOtherServer(wsMessage);
                }
            }
        } else {
            // 用户离线，发送离线推送
            offlinePushService.sendOfflinePush(wsMessage);
            log.debug("User {} is offline, sent to offline push via RabbitMQ", receiverId);
        }
    }

    /**
     * 发送消息确认给发送者
     */
    private void sendMessageAck(WebSocketMessage originalMessage, String tempMessageId) {
        WebSocketMessage ack = WebSocketMessage.builder()
                .type(WebSocketMessage.WebSocketMessageType.MESSAGE_ACK)
                .messageId(originalMessage.getMessageId())
                .tempMessageId(tempMessageId)
                .chatId(originalMessage.getChatId())
                .senderId("system")
                .receiverId(originalMessage.getSenderId())
                .timestamp(originalMessage.getTimestamp()) // 使用原消息的时间戳
                .build();

        sessionManager.sendMessageToUser(originalMessage.getSenderId(), ack);
        log.debug("Sent message acknowledgment to user: {}, messageId: {}, tempMessageId: {}",
                originalMessage.getSenderId(), originalMessage.getMessageId(), tempMessageId);
    }

    /**
     * 通知消息已读
     */
    private void notifyMessageRead(WebSocketMessage readReceipt) {
        // 从extraData中获取原消息ID，然后查找原消息的发送者
        String messageId = extractMessageId(readReceipt);
        if (messageId == null || messageId.isEmpty()) {
            log.warn("Cannot notify message read: messageId is missing");
            return;
        }

        // 这里需要根据messageId查找原消息的发送者
        // 为了简化，我们从readReceipt的receiverId获取原发送者（因为已读回执的receiverId就是原消息的senderId）
        String originalSenderId = readReceipt.getReceiverId();

        WebSocketMessage notification = WebSocketMessage.builder()
                .type(WebSocketMessage.WebSocketMessageType.READ_RECEIPT)
                .chatId(readReceipt.getChatId())
                .senderId("system")
                .receiverId(originalSenderId)
                .extraData(readReceipt.getExtraData())
                .timestamp(System.currentTimeMillis())
                .build();

        // 检查原发送者是否在线
        if (userOnlineService.isUserOnline(originalSenderId)) {
            if (sessionManager.isUserOnline(originalSenderId)) {
                sessionManager.sendMessageToUser(originalSenderId, notification);
                log.debug("Read receipt delivered locally to user: {}", originalSenderId);
            } else {
                // 获取原发送者所在的服务器节点
                String targetServerId = userOnlineService.getUserServer(originalSenderId);
                if (targetServerId != null && !targetServerId.isEmpty()) {
                    // 精确发送到目标服务器节点
                    messageProducer.sendReadReceiptToSpecificServer(notification, targetServerId);
                    log.debug("Read receipt sent to specific server: {} for user: {}", targetServerId,
                            originalSenderId);
                } else {
                    log.warn("Cannot determine target server for user: {}, using deprecated broadcast method",
                            originalSenderId);
                    // 降级到旧方法（不推荐）
                    messageProducer.sendReadReceiptToOtherServer(notification);
                }
            }
        }
    }

    /**
     * 发送错误消息给发送者
     */
    private void sendErrorToSender(String senderId, String error, String tempMessageId) {
        WebSocketMessage errorMsg = WebSocketMessage.builder()
                .type(WebSocketMessage.WebSocketMessageType.ERROR)
                .senderId("system")
                .receiverId(senderId)
                .content(error)
                .timestamp(System.currentTimeMillis())
                .tempMessageId(tempMessageId)
                .build();

        sessionManager.sendMessageToUser(senderId, errorMsg);
    }

    /**
     * 发送错误消息给发送者（不带tempMessageId）
     */
    private void sendErrorToSender(String senderId, String error) {
        sendErrorToSender(senderId, error, null);
    }

    /**
     * 构建发送消息请求
     */
    private SendMessageRequest buildSendMessageRequest(WebSocketMessage wsMessage) {
        return SendMessageRequest.builder()
                .chatId(wsMessage.getChatId())
                .senderId(wsMessage.getSenderId())
                .receiverId(wsMessage.getReceiverId())
                .messageType(wsMessage.getChatMessageType() != null ? wsMessage.getChatMessageType() : MessageType.TEXT)
                .content(wsMessage.getContent())
                .mediaMetadata(convertMediaMetadata(wsMessage.getMediaMetadata()))
                .clientTimestamp(wsMessage.getTimestamp())
                .extraData(wsMessage.getExtraData())
                .build();
    }

    /**
     * 转换媒体元数据
     */
    private SendMessageRequest.MediaMetadataRequest convertMediaMetadata(WebSocketMessage.MediaMetadataRequest source) {
        if (source == null) {
            return null;
        }
        return SendMessageRequest.MediaMetadataRequest.builder()
                .url(source.getUrl())
                .fileName(source.getFileName())
                .fileSize(source.getFileSize())
                .duration(source.getDuration())
                .width(source.getWidth())
                .height(source.getHeight())
                .build();
    }

    /**
     * 提取消息ID
     */
    private String extractMessageId(WebSocketMessage wsMessage) {
        if (wsMessage.getExtraData() != null) {
            Object messageId = wsMessage.getExtraData().get("messageId");
            if (messageId instanceof String) {
                return (String) messageId;
            }
        }
        // 如果extraData中没有，尝试从消息本身获取
        return wsMessage.getMessageId();
    }

    /**
     * 生成消息ID
     */
    private String generateMessageId() {
        return UUID.randomUUID().toString().replace("-", "");
    }
}