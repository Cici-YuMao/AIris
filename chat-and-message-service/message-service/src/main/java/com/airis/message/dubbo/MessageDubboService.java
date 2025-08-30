package com.airis.message.dubbo;

import com.airis.message.common.PageResult;
import com.airis.message.dto.ChatDetailDTO;
import com.airis.message.dto.ConversationDTO;
import com.airis.message.dto.MessageDTO;
import com.airis.message.request.ChatDetailRequest;
import com.airis.message.request.ConversationListRequest;
import com.airis.message.request.HistoricalMessagesRequest;
import com.airis.message.request.MarkReadRequest;
import com.airis.message.request.SearchMessagesRequest;
import com.airis.message.request.SendMessageRequest;

/**
 * Message service Dubbo interface
 * Provides services for other microservices to call
 * 
 * @author AIRIS Team
 * @since 1.0.0
 */
public interface MessageDubboService {

    /**
     * Save message
     * 
     * @param request Send message request
     * @return Message DTO
     */
    MessageDTO saveMessage(SendMessageRequest request);

    /**
     * Get historical messages
     * 
     * @param request Historical messages request
     * @return Historical messages page result
     */
    PageResult<MessageDTO> getHistoricalMessages(HistoricalMessagesRequest request);

    /**
     * Mark messages as read
     * 
     * @param request Mark read request
     */
    void markMessagesAsRead(MarkReadRequest request);

    /**
     * Get conversation list
     * 
     * @param request Conversation list request
     * @return Conversation list page result
     */
    PageResult<ConversationDTO> getConversations(ConversationListRequest request);

    /**
     * Search messages
     * 
     * @param request Search messages request
     * @return Search result page
     */
    PageResult<MessageDTO> searchMessages(SearchMessagesRequest request);

    /**
     * Get message details by message ID
     * 
     * @param messageId Message ID
     * @return Message DTO
     */
    MessageDTO getMessageById(String messageId);

    /**
     * Get unread message count for user in specified chat
     * 
     * @param chatId Chat ID
     * @param userId User ID
     * @return Unread message count
     */
    Integer getUnreadCount(String chatId, String userId);

    /**
     * Get chat details
     * 
     * @param request Chat detail request
     * @return Chat details
     */
    ChatDetailDTO getChatDetail(ChatDetailRequest request);
}