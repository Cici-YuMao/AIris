package com.airis.message.repository;

import com.airis.message.entity.ChatMessage;
import com.airis.message.enums.MessageType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Chat message Repository
 * 
 * @author AIRIS Team
 * @since 1.0.0
 */
@Repository
public interface ChatMessageRepository extends MongoRepository<ChatMessage, String> {

        /**
         * Find message by message ID
         * 
         * @param messageId Message ID
         * @return Message
         */
        Optional<ChatMessage> findByMessageId(String messageId);

        /**
         * Find messages by chat ID (paginated, ordered by timestamp desc)
         * 
         * @param chatId   Chat ID
         * @param pageable Pagination parameters
         * @return Message page result
         */
        @Query("{'chatId': ?0}")
        Page<ChatMessage> findByChatIdOrderByTimestampDesc(String chatId, Pageable pageable);

        /**
         * Find messages by chat ID and time range
         * 
         * @param chatId         Chat ID
         * @param startTimestamp Start timestamp
         * @param endTimestamp   End timestamp
         * @param pageable       Pagination parameters
         * @return Message page result
         */
        @Query("{'chatId': ?0, 'timestamp': {'$gte': ?1, '$lte': ?2}}")
        Page<ChatMessage> findByChatIdAndTimestampBetweenOrderByTimestampDesc(
                        String chatId, Long startTimestamp, Long endTimestamp, Pageable pageable);

        /**
         * Find messages by chat ID and timestamp (timestamp less than specified value)
         * 
         * @param chatId          Chat ID
         * @param beforeTimestamp Timestamp
         * @param pageable        Pagination parameters
         * @return Message page result
         */
        @Query("{'chatId': ?0, 'timestamp': {'$lt': ?1}}")
        Page<ChatMessage> findByChatIdAndTimestampLessThanOrderByTimestampDesc(
                        String chatId, Long beforeTimestamp, Pageable pageable);

        /**
         * Search message content
         * 
         * @param keyword  Keyword
         * @param pageable Pagination parameters
         * @return Message page result
         */
        @Query("{'content': {'$regex': ?0, '$options': 'i'}}")
        Page<ChatMessage> findByContentContainingIgnoreCaseOrderByTimestampDesc(String keyword, Pageable pageable);

        /**
         * Search message content in specified chat
         * 
         * @param chatId   Chat ID
         * @param keyword  Keyword
         * @param pageable Pagination parameters
         * @return Message page result
         */
        @Query("{'chatId': ?0, 'content': {'$regex': ?1, '$options': 'i'}}")
        Page<ChatMessage> findByChatIdAndContentContainingIgnoreCaseOrderByTimestampDesc(
                        String chatId, String keyword, Pageable pageable);

        /**
         * Find related messages by sender or receiver ID and search content
         * 
         * @param userId   User ID
         * @param keyword  Keyword
         * @param pageable Pagination parameters
         * @return Message page result
         */
        @Query("{'$or': [{'senderId': ?0}, {'receiverId': ?0}], 'content': {'$regex': ?1, '$options': 'i'}}")
        Page<ChatMessage> findByUserIdAndContentContainingIgnoreCaseOrderByTimestampDesc(
                        String userId, String keyword, Pageable pageable);

        /**
         * Find messages by chat ID and message type
         * 
         * @param chatId      Chat ID
         * @param messageType Message type
         * @param pageable    Pagination parameters
         * @return Message page result
         */
        Page<ChatMessage> findByChatIdAndMessageTypeOrderByTimestampDesc(
                        String chatId, MessageType messageType, Pageable pageable);

        /**
         * Find distinct chat ID list for user
         * 
         * @param userId User ID
         * @return Chat ID list
         */
        @Query(value = "{'$or': [{'senderId': ?0}, {'receiverId': ?0}]}", fields = "{'chatId': 1}")
        List<ChatMessage> findDistinctChatIdsByUserId(String userId);

        /**
         * Count total messages by chat ID
         * 
         * @param chatId Chat ID
         * @return Total message count
         */
        long countByChatId(String chatId);

        /**
         * Count messages by chat ID and sender
         * 
         * @param chatId   Chat ID
         * @param senderId Sender ID
         * @return Message count
         */
        long countByChatIdAndSenderId(String chatId, String senderId);

        /**
         * Get first message by chat ID (ordered by timestamp asc)
         * 
         * @param chatId Chat ID
         * @return First message
         */
        ChatMessage findFirstByChatIdOrderByTimestampAsc(String chatId);

        /**
         * Get last message by chat ID (ordered by timestamp desc)
         * 
         * @param chatId Chat ID
         * @return Last message
         */
        ChatMessage findFirstByChatIdOrderByTimestampDesc(String chatId);
}