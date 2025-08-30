package com.airis.message.dubbo.impl;

import com.airis.message.common.PageResult;
import com.airis.message.dto.ChatDetailDTO;
import com.airis.message.dto.ConversationDTO;
import com.airis.message.dto.MessageDTO;
import com.airis.message.dubbo.MessageDubboService;
import com.airis.message.entity.ChatMessage;
import com.airis.message.entity.ChatSession;
import com.airis.message.mapper.ChatSessionMapper;
import com.airis.message.repository.ChatMessageRepository;
import com.airis.message.request.ChatDetailRequest;
import com.airis.message.request.ConversationListRequest;
import com.airis.message.request.HistoricalMessagesRequest;
import com.airis.message.request.MarkReadRequest;
import com.airis.message.request.SearchMessagesRequest;
import com.airis.message.request.SendMessageRequest;
import com.airis.message.service.MessageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.dubbo.config.annotation.DubboService;
import org.springframework.beans.BeanUtils;

import java.util.Optional;

/**
 * Message service Dubbo implementation
 * 
 * @author AIRIS Team
 * @since 1.0.0
 */
@Slf4j
@DubboService(version = "1.0.0", timeout = 10000)
@RequiredArgsConstructor
public class MessageDubboServiceImpl implements MessageDubboService {

    private final MessageService messageService;
    private final ChatMessageRepository chatMessageRepository;
    private final ChatSessionMapper chatSessionMapper;

    @Override
    public MessageDTO saveMessage(SendMessageRequest request) {
        log.info("Dubbo call save message: chatId={}, senderId={}", request.getChatId(), request.getSenderId());
        return messageService.saveMessage(request);
    }

    @Override
    public PageResult<MessageDTO> getHistoricalMessages(HistoricalMessagesRequest request) {
        log.info("Dubbo call get historical messages: chatId={}, userId={}", request.getChatId(), request.getUserId());
        return messageService.getHistoricalMessages(request);
    }

    @Override
    public void markMessagesAsRead(MarkReadRequest request) {
        log.info("Dubbo call mark messages as read: chatId={}, userId={}", request.getChatId(), request.getUserId());
        messageService.markMessagesAsRead(request);
    }

    @Override
    public PageResult<ConversationDTO> getConversations(ConversationListRequest request) {
        log.info("Dubbo call get conversation list: userId={}", request.getUserId());
        return messageService.getConversations(request);
    }

    @Override
    public PageResult<MessageDTO> searchMessages(SearchMessagesRequest request) {
        log.info("Dubbo call search messages: userId={}, keyword={}", request.getUserId(), request.getKeyword());
        return messageService.searchMessages(request);
    }

    @Override
    public MessageDTO getMessageById(String messageId) {
        log.info("Dubbo call get message by ID: messageId={}", messageId);

        Optional<ChatMessage> chatMessageOpt = chatMessageRepository.findByMessageId(messageId);
        if (chatMessageOpt.isEmpty()) {
            log.warn("Message does not exist: messageId={}", messageId);
            return null;
        }

        ChatMessage chatMessage = chatMessageOpt.get();
        return convertToMessageDTO(chatMessage);
    }

    @Override
    public Integer getUnreadCount(String chatId, String userId) {
        log.info("Dubbo call get unread message count: chatId={}, userId={}", chatId, userId);

        try {
            ChatSession session = chatSessionMapper.selectByChatId(chatId);
            if (session == null) {
                return 0;
            }

            if (userId.equals(session.getUser1Id())) {
                return session.getUser1UnreadCount() != null ? session.getUser1UnreadCount() : 0;
            } else if (userId.equals(session.getUser2Id())) {
                return session.getUser2UnreadCount() != null ? session.getUser2UnreadCount() : 0;
            }

            return 0;
        } catch (Exception e) {
            log.error("Failed to get unread message count: chatId={}, userId={}", chatId, userId, e);
            return 0;
        }
    }

    /**
     * Convert to MessageDTO
     * 
     * @param chatMessage Chat message
     * @return MessageDTO
     */
    private MessageDTO convertToMessageDTO(ChatMessage chatMessage) {
        MessageDTO dto = MessageDTO.builder()
                .messageId(chatMessage.getMessageId())
                .chatId(chatMessage.getChatId())
                .senderId(chatMessage.getSenderId())
                .receiverId(chatMessage.getReceiverId())
                .messageType(chatMessage.getMessageType())
                .content(chatMessage.getContent())
                .timestamp(chatMessage.getTimestamp())
                .clientTimestamp(chatMessage.getClientTimestamp())
                .status(chatMessage.getStatus())
                .moderationStatus(chatMessage.getModerationStatus())
                .extraData(chatMessage.getExtraData())
                .build();

        // Convert media metadata
        if (chatMessage.getMediaMetadata() != null) {
            ChatMessage.MediaMetadata source = chatMessage.getMediaMetadata();
            MessageDTO.MediaMetadataDTO mediaDto = MessageDTO.MediaMetadataDTO.builder()
                    .url(source.getUrl())
                    .fileName(source.getFileName())
                    .fileSize(source.getFileSize())
                    .duration(source.getDuration())
                    .width(source.getWidth())
                    .height(source.getHeight())
                    .build();
            dto.setMediaMetadata(mediaDto);
        }

        return dto;
    }

    @Override
    public ChatDetailDTO getChatDetail(ChatDetailRequest request) {
        log.info("Dubbo call get chat details: userAId={}, userBId={}", request.getUserAId(), request.getUserBId());
        return messageService.getChatDetail(request);
    }
}