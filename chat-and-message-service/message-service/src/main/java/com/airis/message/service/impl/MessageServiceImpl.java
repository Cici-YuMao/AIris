package com.airis.message.service.impl;

import com.airis.message.common.PageResult;
import com.airis.message.dto.ChatDetailDTO;
import com.airis.message.dto.ConversationDTO;
import com.airis.message.dto.MessageDTO;
import com.airis.message.entity.ChatMessage;
import com.airis.message.entity.ChatSession;
import com.airis.message.enums.MessageStatus;
import com.airis.message.enums.ModerationStatus;
import com.airis.message.mapper.ChatSessionMapper;
import com.airis.message.repository.ChatMessageRepository;
import com.airis.message.request.ChatDetailRequest;
import com.airis.message.request.ConversationListRequest;
import com.airis.message.request.HistoricalMessagesRequest;
import com.airis.message.request.MarkReadRequest;
import com.airis.message.request.SearchMessagesRequest;
import com.airis.message.request.SendMessageRequest;
import com.airis.message.service.MessageService;
import com.airis.message.util.SnowflakeIdGenerator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.rocketmq.spring.core.RocketMQTemplate;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.http.ResponseEntity;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.client.SimpleClientHttpRequestFactory;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Message service implementation class
 * 
 * @author AIRIS Team
 * @since 1.0.0
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class MessageServiceImpl implements MessageService {

    private final ChatMessageRepository chatMessageRepository;
    private final ChatSessionMapper chatSessionMapper;
    private final SnowflakeIdGenerator snowflakeIdGenerator;
    private final RocketMQTemplate rocketMQTemplate;
    private final MongoTemplate mongoTemplate;

    @Value("${user.service.base-url:http://10.144.2.1:8081}")
    private String userServiceBaseUrl;

    private final RestTemplate restTemplate = createRestTemplate();

    private static RestTemplate createRestTemplate() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(1000); // 1s connect timeout
        factory.setReadTimeout(1000); // 1s read timeout
        return new RestTemplate(factory);
    }

    @Override
    @Transactional
    public MessageDTO saveMessage(SendMessageRequest request) {
        log.info("Save message: chatId={}, senderId={}, receiverId={}",
                request.getChatId(), request.getSenderId(), request.getReceiverId());

        // Generate message ID
        String messageId = snowflakeIdGenerator.nextIdStr();
        long currentTimestamp = System.currentTimeMillis();

        // Build ChatMessage entity
        ChatMessage chatMessage = ChatMessage.builder()
                .messageId(messageId)
                .chatId(request.getChatId())
                .senderId(request.getSenderId())
                .receiverId(request.getReceiverId())
                .messageType(request.getMessageType())
                .content(request.getContent())
                .mediaMetadata(convertMediaMetadata(request.getMediaMetadata()))
                .timestamp(currentTimestamp)
                .clientTimestamp(request.getClientTimestamp())
                .status(MessageStatus.DELIVERED_TO_SERVER)
                .moderationStatus(ModerationStatus.PENDING)
                .extraData(request.getExtraData())
                .build();

        // Save to MongoDB
        chatMessage = chatMessageRepository.save(chatMessage);

        // Update chat session info
        updateChatSession(request, messageId, currentTimestamp);

        // Send MQ message notification to other services
        sendMessageNotification(chatMessage);

        // Convert to DTO and return
        return convertToMessageDTO(chatMessage);
    }

    @Override
    public PageResult<MessageDTO> getHistoricalMessages(HistoricalMessagesRequest request) {
        log.info("Query historical messages: chatId={}, userId={}, page={}, size={}",
                request.getChatId(), request.getUserId(), request.getPage(), request.getSize());

        // Verify if user has permission to view messages in this chat
        if (!hasPermissionToViewChat(request.getChatId(), request.getUserId())) {
            log.warn("User {} has no permission to view messages in chat {}", request.getUserId(), request.getChatId());
            return PageResult.of(new ArrayList<>(), 0, request.getPage(), request.getSize());
        }

        // Build pagination parameters
        Pageable pageable = PageRequest.of(
                request.getPage() - 1,
                request.getSize(),
                Sort.by(Sort.Direction.DESC, "timestamp"));

        Page<ChatMessage> messagePage;

        // Choose query method based on request parameters
        if (request.getBeforeTimestamp() != null) {
            messagePage = chatMessageRepository.findByChatIdAndTimestampLessThanOrderByTimestampDesc(
                    request.getChatId(), request.getBeforeTimestamp(), pageable);
        } else if (request.getAfterTimestamp() != null) {
            messagePage = chatMessageRepository.findByChatIdAndTimestampBetweenOrderByTimestampDesc(
                    request.getChatId(), request.getAfterTimestamp(), System.currentTimeMillis(), pageable);
        } else {
            messagePage = chatMessageRepository.findByChatIdOrderByTimestampDesc(request.getChatId(), pageable);
        }

        // Convert to DTO
        List<MessageDTO> messageDTOs = messagePage.getContent().stream()
                .map(this::convertToMessageDTO)
                .collect(Collectors.toList());

        return PageResult.of(messageDTOs, messagePage.getTotalElements(),
                request.getPage(), request.getSize());
    }

    // Helper method to convert media metadata
    private ChatMessage.MediaMetadata convertMediaMetadata(SendMessageRequest.MediaMetadataRequest source) {
        if (source == null) {
            return null;
        }
        return ChatMessage.MediaMetadata.builder()
                .url(source.getUrl())
                .fileName(source.getFileName())
                .fileSize(source.getFileSize())
                .duration(source.getDuration())
                .width(source.getWidth())
                .height(source.getHeight())
                .build();
    }

    // Update chat session info
    private void updateChatSession(SendMessageRequest request, String messageId, long timestamp) {
        try {
            ChatSession existingSession = chatSessionMapper.selectByChatId(request.getChatId());

            if (existingSession == null) {
                // Create new chat session
                ChatSession newSession = ChatSession.builder()
                        .chatId(request.getChatId())
                        .user1Id(request.getSenderId())
                        .user2Id(request.getReceiverId())
                        .lastMessageId(messageId)
                        .lastMessageContent(getMessagePreview(request))
                        .lastMessageTimestamp(timestamp)
                        .user1UnreadCount(0)
                        .user2UnreadCount(1) // Receiver unread count +1
                        .createdAt(LocalDateTime.now())
                        .updatedAt(LocalDateTime.now())
                        .build();

                chatSessionMapper.insert(newSession);
            } else {
                // Update existing session
                chatSessionMapper.updateLastMessage(request.getChatId(), messageId,
                        getMessagePreview(request), timestamp);

                // Increase receiver's unread message count
                String receiverId = request.getReceiverId();
                Integer currentUnreadCount = getCurrentUnreadCount(existingSession, receiverId);
                chatSessionMapper.updateUnreadCount(request.getChatId(), receiverId, currentUnreadCount + 1);
            }
        } catch (Exception e) {
            log.error("Failed to update chat session: chatId={}", request.getChatId(), e);
            // Don't throw exception to avoid affecting message saving
        }
    }

    // Send MQ message notification
    private void sendMessageNotification(ChatMessage chatMessage) {
        try {
            rocketMQTemplate.convertAndSend("message-topic", chatMessage);
            log.info("Send MQ message notification successfully: messageId={}", chatMessage.getMessageId());
        } catch (Exception e) {
            log.error("Failed to send MQ message notification: messageId={}", chatMessage.getMessageId(), e);
        }
    }

    // Convert to MessageDTO
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

    // Check if user has permission to view chat
    private boolean hasPermissionToViewChat(String chatId, String userId) {
        ChatSession session = chatSessionMapper.selectByChatId(chatId);
        if (session == null) {
            return false;
        }
        return userId.equals(session.getUser1Id()) || userId.equals(session.getUser2Id());
    }

    // Get message preview content
    private String getMessagePreview(SendMessageRequest request) {
        if (StringUtils.hasText(request.getContent())) {
            return request.getContent().length() > 100 ? request.getContent().substring(0, 100) + "..."
                    : request.getContent();
        }

        // Return different previews based on message type
        switch (request.getMessageType()) {
            case IMAGE:
                return "[Image]";
            case VOICE:
                return "[Voice]";
            case VIDEO:
                return "[Video]";
            case FILE:
                return "[File]";
            case EMOJI:
                return "[Emoji]";
            case SYSTEM:
                return "[System Message]";
            default:
                return "[Message]";
        }
    }

    // Get current unread message count
    private Integer getCurrentUnreadCount(ChatSession session, String userId) {
        if (userId.equals(session.getUser1Id())) {
            return session.getUser1UnreadCount() != null ? session.getUser1UnreadCount() : 0;
        } else if (userId.equals(session.getUser2Id())) {
            return session.getUser2UnreadCount() != null ? session.getUser2UnreadCount() : 0;
        }
        return 0;
    }

    @Override
    @Transactional
    public void markMessagesAsRead(MarkReadRequest request) {
        log.info("Mark messages as read: chatId={}, userId={}, messageId={}",
                request.getChatId(), request.getUserId(), request.getMessageId());

        // Verify if user has permission to operate this chat
        if (!hasPermissionToViewChat(request.getChatId(), request.getUserId())) {
            log.warn("User {} has no permission to operate chat {}", request.getUserId(), request.getChatId());
            return;
        }

        try {
            // Update user's last read message ID and reset unread count
            chatSessionMapper.updateLastReadMessageId(request.getChatId(),
                    request.getUserId(), request.getMessageId());

            // Update message status to read in MongoDB
            updateMessageStatusInMongoDB(request.getChatId(), request.getUserId(), request.getMessageId());

            log.info("Mark messages as read successfully: chatId={}, userId={}", request.getChatId(),
                    request.getUserId());

            // Send read status update notification (can be enabled)
            // sendReadStatusNotification(request);

        } catch (Exception e) {
            log.error("Failed to mark messages as read: chatId={}, userId={}",
                    request.getChatId(), request.getUserId(), e);
            throw new RuntimeException("Failed to mark messages as read", e);
        }
    }

    @Override
    public PageResult<ConversationDTO> getConversations(ConversationListRequest request) {
        log.info("Get conversation list: userId={}, page={}, size={}",
                request.getUserId(), request.getPage(), request.getSize());

        try {
            // Calculate offset
            int offset = (request.getPage() - 1) * request.getSize();

            // Query conversation list
            List<ChatSession> sessions;
            if (request.getBeforeTimestamp() != null) {
                sessions = chatSessionMapper.selectByUserIdWithTimestamp(
                        request.getUserId(), request.getBeforeTimestamp(), offset, request.getSize());
            } else {
                sessions = chatSessionMapper.selectByUserId(request.getUserId(), offset, request.getSize());
            }

            // Convert to DTO
            List<ConversationDTO> conversationDTOs = sessions.stream()
                    .map(session -> convertToConversationDTO(session, request.getUserId()))
                    .collect(Collectors.toList());

            // Query total count
            long total = chatSessionMapper.countByUserId(request.getUserId());

            return PageResult.of(conversationDTOs, total, request.getPage(), request.getSize());
        } catch (Exception e) {
            log.error("Failed to get conversation list: userId={}", request.getUserId(), e);
            return PageResult.of(new ArrayList<>(), 0, request.getPage(), request.getSize());
        }
    }

    @Override
    public PageResult<MessageDTO> searchMessages(SearchMessagesRequest request) {
        log.info("Search messages: userId={}, keyword={}, chatId={}, page={}, size={}",
                request.getUserId(), request.getKeyword(), request.getChatId(),
                request.getPage(), request.getSize());

        try {
            // Build pagination parameters
            Pageable pageable = PageRequest.of(
                    request.getPage() - 1,
                    request.getSize(),
                    Sort.by(Sort.Direction.DESC, "timestamp"));

            Page<ChatMessage> messagePage;

            // Choose query method based on search conditions
            if (StringUtils.hasText(request.getChatId())) {
                // Search within a specific chat
                if (!hasPermissionToViewChat(request.getChatId(), request.getUserId())) {
                    log.warn("User {} has no permission to search messages in chat {}", request.getUserId(),
                            request.getChatId());
                    return PageResult.of(new ArrayList<>(), 0, request.getPage(), request.getSize());
                }
                messagePage = chatMessageRepository.findByChatIdAndContentContainingIgnoreCaseOrderByTimestampDesc(
                        request.getChatId(), request.getKeyword(), pageable);
            } else {
                // Search across all relevant chats for the user
                messagePage = chatMessageRepository.findByUserIdAndContentContainingIgnoreCaseOrderByTimestampDesc(
                        request.getUserId(), request.getKeyword(), pageable);
            }

            // Filter by time range
            if (request.getStartTimestamp() != null || request.getEndTimestamp() != null) {
                messagePage = filterByTimeRange(messagePage, request.getStartTimestamp(), request.getEndTimestamp());
            }

            // Convert to DTO
            List<MessageDTO> messageDTOs = messagePage.getContent().stream()
                    .map(this::convertToMessageDTO)
                    .collect(Collectors.toList());

            return PageResult.of(messageDTOs, messagePage.getTotalElements(),
                    request.getPage(), request.getSize());
        } catch (Exception e) {
            log.error("Failed to search messages: userId={}, keyword={}", request.getUserId(), request.getKeyword(), e);
            return PageResult.of(new ArrayList<>(), 0, request.getPage(), request.getSize());
        }
    }

    // Send read status notification
    private void sendReadStatusNotification(MarkReadRequest request) {
        try {
            rocketMQTemplate.convertAndSend("read-status-topic", request);
            log.info("Send read status notification successfully: chatId={}, userId={}", request.getChatId(),
                    request.getUserId());
        } catch (Exception e) {
            log.error("Failed to send read status notification: chatId={}, userId={}",
                    request.getChatId(), request.getUserId(), e);
        }
    }

    // Convert to ConversationDTO
    private ConversationDTO convertToConversationDTO(ChatSession session, String currentUserId) {
        // Determine the other user ID
        String otherUserId = currentUserId.equals(session.getUser1Id()) ? session.getUser2Id() : session.getUser1Id();

        // Get current user's unread message count
        Integer unreadCount = getCurrentUnreadCount(session, currentUserId);

        return ConversationDTO.builder()
                .chatId(session.getChatId())
                .otherUserId(otherUserId)
                .otherUserNickname(getUserNickname(otherUserId)) // Need to call user service to get
                .otherUserAvatar(getUserAvatar(otherUserId)) // Need to call user service to get
                .lastMessageId(session.getLastMessageId())
                .lastMessageContent(session.getLastMessageContent())
                .lastMessageTimestamp(session.getLastMessageTimestamp())
                .unreadCount(unreadCount)
                .pinned(false)
                .muted(false)
                .build();
    }

    // Time range filtering (simplified implementation, should be handled in
    // database layer)
    private Page<ChatMessage> filterByTimeRange(Page<ChatMessage> messagePage,
            Long startTimestamp, Long endTimestamp) {
        // Simplified handling here, actual query should be more complex in Repository
        // layer
        return messagePage;
    }

    // Get user nickname (need to call user service)
    private String getUserNickname(String userId) {
        if (userId == null || userId.isEmpty()) {
            return "Unknown User";
        }
        String url = userServiceBaseUrl + "/api/v1/users/" + userId + "/username";
        try {
            ResponseEntity<UserNameResponse> response = restTemplate.getForEntity(url, UserNameResponse.class);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null
                    && response.getBody().getUsername() != null) {
                return response.getBody().getUsername();
            }
        } catch (Exception e) {
            log.warn("Failed to get user nickname, using default: userId={}", userId, e);
        }
        return "User " + userId;
    }

    // User name response body
    private static class UserNameResponse {
        private String userId;
        private String username;

        public String getUserId() {
            return userId;
        }

        public void setUserId(String userId) {
            this.userId = userId;
        }

        public String getUsername() {
            return username;
        }

        public void setUsername(String username) {
            this.username = username;
        }
    }

    // Get user avatar (need to call user service)
    private String getUserAvatar(String userId) {
        return "https://example.com/" + userId + ".png";
    }

    /**
     * Update message status to read in MongoDB
     * 
     * @param chatId            Chat ID
     * @param userId            User ID (receiver)
     * @param lastReadMessageId Last read message ID
     */
    private void updateMessageStatusInMongoDB(String chatId, String userId, String lastReadMessageId) {
        try {
            log.info("Starting MongoDB message status update: chatId={}, userId={}, lastReadMessageId={}",
                    chatId, userId, lastReadMessageId);

            // Build query criteria: chat ID matches, receiver is current user, message ID
            // less than or equal to last read message ID, and status is DELIVERED_TO_SERVER
            Query query = new Query();
            query.addCriteria(Criteria.where("chatId").is(chatId)
                    .and("receiverId").is(userId)
                    .and("messageId").lte(lastReadMessageId)
                    .and("status").is(MessageStatus.DELIVERED_TO_SERVER));

            // Build update operation: set status to read
            Update update = new Update();
            update.set("status", MessageStatus.READ);

            // Execute batch update
            var result = mongoTemplate.updateMulti(query, update, ChatMessage.class);

            log.info(
                    "MongoDB message status update successful: chatId={}, userId={}, lastReadMessageId={}, updated count={}",
                    chatId, userId, lastReadMessageId, result.getModifiedCount());

        } catch (Exception e) {
            log.error("Failed to update MongoDB message status: chatId={}, userId={}, lastReadMessageId={}",
                    chatId, userId, lastReadMessageId, e);
            // Don't throw exception, avoid affecting main flow, but log error
        }
    }

    @Override
    public ChatDetailDTO getChatDetail(ChatDetailRequest request) {
        log.info("Get chat details: userAId={}, userBId={}", request.getUserAId(), request.getUserBId());

        try {
            // 1. Find chat session based on two user IDs
            ChatSession chatSession = chatSessionMapper.selectByTwoUserIds(request.getUserAId(), request.getUserBId());

            if (chatSession == null) {
                log.info("No chat session between two users: userAId={}, userBId={}", request.getUserAId(),
                        request.getUserBId());
                return ChatDetailDTO.builder()
                        .userAId(request.getUserAId())
                        .userBId(request.getUserBId())
                        .chatId(null)
                        .hasChatHistory(false)
                        .chatDurationSeconds(0L)
                        .totalMessageCount(0L)
                        .userAMessageCount(0L)
                        .userBMessageCount(0L)
                        .firstMessageTimestamp(null)
                        .lastMessageTimestamp(null)
                        .build();
            }

            String chatId = chatSession.getChatId();

            // 2. Count message count
            long totalMessageCount = chatMessageRepository.countByChatId(chatId);
            long userAMessageCount = chatMessageRepository.countByChatIdAndSenderId(chatId, request.getUserAId());
            long userBMessageCount = chatMessageRepository.countByChatIdAndSenderId(chatId, request.getUserBId());

            // 3. Get the timestamps of the first and last messages
            ChatMessage firstMessage = chatMessageRepository.findFirstByChatIdOrderByTimestampAsc(chatId);
            ChatMessage lastMessage = chatMessageRepository.findFirstByChatIdOrderByTimestampDesc(chatId);

            Long firstMessageTimestamp = firstMessage != null ? firstMessage.getTimestamp() : null;
            Long lastMessageTimestamp = lastMessage != null ? lastMessage.getTimestamp() : null;

            // 4. Calculate chat duration (seconds)
            Long chatDurationSeconds = 0L;
            if (firstMessageTimestamp != null) {
                chatDurationSeconds = (System.currentTimeMillis() - firstMessageTimestamp) / 1000;
            }

            return ChatDetailDTO.builder()
                    .userAId(request.getUserAId())
                    .userBId(request.getUserBId())
                    .chatId(chatId)
                    .hasChatHistory(true)
                    .chatDurationSeconds(chatDurationSeconds)
                    .totalMessageCount(totalMessageCount)
                    .userAMessageCount(userAMessageCount)
                    .userBMessageCount(userBMessageCount)
                    .firstMessageTimestamp(firstMessageTimestamp)
                    .lastMessageTimestamp(lastMessageTimestamp)
                    .build();

        } catch (Exception e) {
            log.error("Failed to get chat details: userAId={}, userBId={}", request.getUserAId(), request.getUserBId(),
                    e);
            throw new RuntimeException("Failed to get chat details", e);
        }
    }
}